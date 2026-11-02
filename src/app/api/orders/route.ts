import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { OrderModel, PaymentModel } from "@/models";
import { notifyNewOrderTelegram, processTelegramPendingUpdates } from "@/lib/telegram";
import { scanReceiptImage } from "@/lib/receiptOcr";

export async function GET() {
  try {
    await connectDB();
    // Non-blocking sync for any pending Telegram button clicks
    processTelegramPendingUpdates().catch(() => {});
    const orders = await OrderModel.find({}).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, count: orders.length, orders });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    if (!body.campaignName) {
      return NextResponse.json(
        { success: false, error: "Campaign name is required" },
        { status: 400 }
      );
    }

    const prefix = body.postType?.toLowerCase().includes("ads")
      ? "AD"
      : body.postType?.toLowerCase().includes("promot")
      ? "PROMOTE"
      : "BOOST";

    // Validate if provided ID already exists in DB
    let finalId = body.id;
    if (finalId) {
      const existing = await OrderModel.findOne({ id: finalId });
      if (existing) {
        finalId = undefined; // Collided, force generate new unique ID
      }
    }

    if (!finalId) {
      const allOrders = await OrderModel.find({}, { id: 1 }).lean();
      let maxNum = 1000;
      for (const o of allOrders) {
        const m = o.id?.match(/\d+/);
        if (m) {
          const num = parseInt(m[0], 10);
          if (num > maxNum) maxNum = num;
        }
      }
      finalId = `${prefix}-${maxNum + 1}`;
    }

    body.id = finalId;
    body.source = body.source || "portal_order";
    body.isExternalBoost = body.isExternalBoost !== undefined ? body.isExternalBoost : false;

    // If no transaction ID provided manually, but screenshotUrl is present, run OCR to extract exact TrxID
    if (!body.transactionId?.trim() && body.screenshotUrl) {
      try {
        const ocrResult = await scanReceiptImage(body.screenshotUrl);
        if (ocrResult?.trxId) {
          body.transactionId = ocrResult.trxId;
          if (!body.senderNumber && ocrResult.senderNumber) {
            body.senderNumber = ocrResult.senderNumber;
          }
        }
      } catch (ocrErr) {
        console.warn("[Orders API] OCR fallback scan failed:", ocrErr);
      }
    }

    const order = await OrderModel.create(body);

    // If order has payment details and is not Unpaid, auto-log to PaymentModel
    if (body.paymentMethod && body.paymentStatus && body.paymentStatus !== "Unpaid") {
      try {
        const trxId = body.transactionId?.trim() || "Pending Verification";
        const payStatus = body.paymentStatus === "Verified" ? "Verified" : "Under Review";

        const allPayments = await PaymentModel.find({}, { id: 1 }).lean();
        let maxPayNum = 8000;
        for (const p of allPayments) {
          const m = p.id?.match(/\d+/);
          if (m) {
            const num = parseInt(m[0], 10);
            if (num > maxPayNum) maxPayNum = num;
          }
        }

        const isAds = (order.postType || "").toLowerCase().includes("ads") || (order.postType || "").toLowerCase().includes("campaign");
        const orderExchangeRate = isAds ? 155 : (Math.round((body.paidAmountBDT || 0) / (order.totalBudgetUSD || 1)) || 150);

        await PaymentModel.create({
          id: `TXN-${maxPayNum + 1}`,
          orderId: order.id,
          campaignName: order.campaignName,
          method: body.paymentMethod,
          transactionId: trxId,
          amountUSD: order.totalBudgetUSD || 0,
          amountBDT: body.paidAmountBDT || 0,
          exchangeRate: orderExchangeRate,
          serviceChargeBDT: 0,
          status: payStatus,
          date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
          screenshotUrl: body.screenshotUrl,
          senderNumber: body.senderNumber,
        });
      } catch (payErr) {
        console.warn("Could not auto-create payment entry for order:", payErr);
      }
    }

    // Extract real origin from request headers to construct bulletproof 1-click confirmation links
    const reqOrigin =
      req.headers.get("origin") ||
      (req.headers.get("referer") ? new URL(req.headers.get("referer")!).origin : null) ||
      (req.headers.get("host")
        ? `${req.headers.get("x-forwarded-proto") || "https"}://${req.headers.get("x-forwarded-host") || req.headers.get("host")}`
        : "https://adsmanager.shopnocareerit.com");

    // Broadcast instant Telegram alert to bot & group
    notifyNewOrderTelegram(order, reqOrigin).catch((telErr) => {
      console.warn("[Orders API] Telegram notification background trigger failed:", telErr);
    });

    return NextResponse.json(
      { success: true, message: "Order created successfully", order },
      { status: 201 }
    );
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
