import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import { UserModel, hashPassword } from "@/models";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    let client = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      client = await UserModel.findById(id).select("-password").lean();
    }
    if (!client) {
      client = await UserModel.findOne({
        $or: [{ _id: id }, { email: id.toLowerCase() }],
      })
        .select("-password")
        .lean();
    }

    if (!client) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, client });
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

    const updatePayload: Record<string, any> = {};
    if (body.name !== undefined) updatePayload.name = body.name.trim();
    if (body.email !== undefined) updatePayload.email = body.email.trim().toLowerCase();
    if (body.phone !== undefined) updatePayload.phone = body.phone.trim();
    if (body.businessName !== undefined) updatePayload.businessName = body.businessName.trim();
    if (body.role !== undefined) updatePayload.role = body.role;
    if (body.connectedPage !== undefined) updatePayload.connectedPage = body.connectedPage;
    if (body.password && typeof body.password === "string" && body.password.trim().length > 0) {
      updatePayload.password = hashPassword(body.password.trim());
    }

    let updated = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      updated = await UserModel.findByIdAndUpdate(
        id,
        { $set: updatePayload },
        { new: true, runValidators: true }
      ).select("-password");
    }
    if (!updated) {
      updated = await UserModel.findOneAndUpdate(
        { $or: [{ _id: id }, { email: id.toLowerCase() }] },
        { $set: updatePayload },
        { new: true, runValidators: true }
      ).select("-password");
    }

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "User updated successfully",
      client: updated,
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

    let deleted = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      deleted = await UserModel.findByIdAndDelete(id);
    }
    if (!deleted) {
      deleted = await UserModel.findOneAndDelete({
        $or: [{ _id: id }, { email: id.toLowerCase() }],
      });
    }

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `User '${deleted.name || deleted.email}' removed successfully`,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
