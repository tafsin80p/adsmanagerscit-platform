import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { PaymentModel, OrderModel } from "@/models";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const payment = await PaymentModel.findOne({ id }).lean();

    if (!payment) {
      return NextResponse.json(
        { success: false, error: "Payment transaction not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, payment });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await req.json();

    const updatedPayment = await PaymentModel.findOneAndUpdate(
      { id },
      { $set: body },
      { new: true, runValidators: true }
    );

    if (!updatedPayment) {
      return NextResponse.json(
        { success: false, error: "Payment transaction not found" },
        { status: 404 }
      );
    }

    // Sync with order if status changed
    if (updatedPayment.orderId && body.status) {
      const orderPaymentStatus =
        body.status === "Verified"
          ? "Verified"
          : body.status === "Failed"
          ? "Failed"
          : "Awaiting Verification";

      await OrderModel.findOneAndUpdate(
        { id: updatedPayment.orderId },
        { $set: { paymentStatus: orderPaymentStatus } }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Payment transaction updated successfully",
      payment: updatedPayment,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const deleted = await PaymentModel.findOneAndDelete({ id });
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Payment transaction not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Payment transaction deleted successfully",
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
