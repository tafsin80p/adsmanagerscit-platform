import { NextResponse } from "next/server";
import { scanReceiptImage, parseReceiptText } from "@/lib/receiptOcr";

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";

    // 1. If JSON payload with imageUrl or base64 or rawText
    if (contentType.includes("application/json")) {
      const body = await req.json().catch(() => ({}));

      if (body.rawText) {
        const parsed = parseReceiptText(body.rawText);
        return NextResponse.json({ success: true, ...parsed });
      }

      if (body.imageUrl) {
        const parsed = await scanReceiptImage(body.imageUrl);
        return NextResponse.json({ success: true, ...parsed });
      }

      return NextResponse.json(
        { success: false, error: "Please provide either imageUrl or rawText in the JSON body." },
        { status: 400 }
      );
    }

    // 2. If Multipart Form Data with file
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;

      if (!file) {
        return NextResponse.json(
          { success: false, error: "No image file provided in form-data." },
          { status: 400 }
        );
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const parsed = await scanReceiptImage(buffer);

      return NextResponse.json({ success: true, ...parsed });
    }

    return NextResponse.json(
      { success: false, error: "Unsupported content-type. Send multipart/form-data with file or JSON with imageUrl." },
      { status: 400 }
    );
  } catch (error: unknown) {
    const err = error as Error;
    console.error("[OCR API] Error running receipt scan:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to parse receipt." },
      { status: 500 }
    );
  }
}

