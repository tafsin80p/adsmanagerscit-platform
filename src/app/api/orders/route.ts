import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { OrderModel, PaymentModel } from "@/models";


export async function GET() {
  try {
    await connectDB();
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
    const order = await OrderModel.create(body);

    // If order has payment details and is not Unpaid, auto-log to PaymentModel
    if (body.paymentMethod && body.paymentStatus && body.paymentStatus !== "Unpaid") {
      try {
        const trxId = body.transactionId || `TRX-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
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

        await PaymentModel.create({
          id: `TXN-${maxPayNum + 1}`,
          orderId: order.id,
          campaignName: order.campaignName,
          method: body.paymentMethod,
          transactionId: trxId,
          amountUSD: order.totalBudgetUSD || 0,
          amountBDT: body.paidAmountBDT || 0,
          exchangeRate: Math.round((body.paidAmountBDT || 0) / (order.totalBudgetUSD || 1)) || 150,
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
