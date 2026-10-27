import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { PaymentModel, OrderModel } from "@/models";


export async function GET() {
  try {
    await connectDB();
    const payments = await PaymentModel.find({}).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, count: payments.length, payments });
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

    if (!body.orderId || !body.transactionId) {
      return NextResponse.json(
        { success: false, error: "Order ID and Transaction ID are required" },
        { status: 400 }
      );
    }

    let finalId = body.id;
    if (finalId) {
      const existing = await PaymentModel.findOne({ id: finalId });
      if (existing) {
        finalId = undefined;
      }
    }

    if (!finalId) {
      const allPayments = await PaymentModel.find({}, { id: 1 }).lean();
      let maxNum = 8000;
      for (const p of allPayments) {
        const m = p.id?.match(/\d+/);
        if (m) {
          const num = parseInt(m[0], 10);
          if (num > maxNum) maxNum = num;
        }
      }
      finalId = `TXN-${maxNum + 1}`;
    }

    body.id = finalId;
    const payment = await PaymentModel.create(body);

    // Optionally update associated order payment status
    if (body.orderId && body.status) {
      const orderPaymentStatus =
        body.status === "Verified"
          ? "Verified"
          : body.status === "Failed"
          ? "Failed"
          : "Under Review";

      await OrderModel.findOneAndUpdate(
        { id: body.orderId },
        {
          $set: {
            paymentStatus: orderPaymentStatus,
            transactionId: body.transactionId,
            paymentMethod: body.method,
            paidAmountBDT: body.amountBDT,
          },
        }
      );
    }

    return NextResponse.json(
      { success: true, message: "Payment recorded successfully", payment },
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
