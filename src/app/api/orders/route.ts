import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { OrderModel } from "@/models";


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
