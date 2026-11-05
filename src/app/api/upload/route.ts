import { NextResponse } from "next/server";
import { uploadToCloudinary, isCloudinaryConfigured } from "@/lib/cloudinary";
import { scanReceiptImage, ParsedReceiptData } from "@/lib/receiptOcr";
import path from "path";
import fs from "fs/promises";

// Max file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Allowed MIME types
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "image/avif",
  "application/pdf", // For formal bank payment receipts
];

export async function GET() {
  return NextResponse.json({
    success: true,
    isCloudinaryConfigured: isCloudinaryConfigured(),
    cloudName: process.env.CLOUDINARY_CLOUD_NAME ? `${process.env.CLOUDINARY_CLOUD_NAME.slice(0, 3)}***` : null,
  });
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const requestedFolder = (formData.get("folder") as string) || "assets";

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided for upload" },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: "File exceeds 10MB size limit" },
        { status: 400 }
      );
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: `Unsupported file type: ${file.type}. Allowed: JPG, PNG, WEBP, GIF, SVG, PDF.`,
        },
        { status: 400 }
      );
    }

    // Convert file to Node buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Sanitize folder name
    const safeFolder = requestedFolder.replace(/[^a-zA-Z0-9_-]/g, "").toLowerCase() || "assets";
    const cloudinaryFolder = `meta_ads/${safeFolder}`;

    // Optional OCR Receipt parsing for payments & receipts
    let ocrData: ParsedReceiptData | null = null;
    const shouldRunOcr =
      (safeFolder === "payments" || safeFolder === "receipts" || formData.get("ocr") === "true") &&
      file.type.startsWith("image/");

    if (shouldRunOcr) {
      try {
        ocrData = await scanReceiptImage(buffer);
      } catch (ocrErr) {
        console.error("[Upload] OCR parsing error:", ocrErr);
      }
    }

    // 1. If Cloudinary credentials are provided, upload to Cloudinary
    if (isCloudinaryConfigured()) {
      try {
        const result = await uploadToCloudinary(buffer, {
          folder: cloudinaryFolder,
          resourceType: file.type === "application/pdf" ? "raw" : "image",
          tags: ["meta_ads_portal", safeFolder],
        });

        let secureUrl = result.secure_url;
        // If image uploaded as .avif (common from Meta/Facebook CDN), ensure universal .png delivery URL for 100% browser compatibility
        if (secureUrl && (result.format === "avif" || secureUrl.endsWith(".avif"))) {
          secureUrl = secureUrl.replace(/\.avif$/, ".png");
        }

        return NextResponse.json({
          success: true,
          url: secureUrl,
          publicId: result.public_id,
          format: result.format,
          bytes: result.bytes,
          storage: "cloudinary",
          message: "Uploaded to Cloudinary successfully",
          detectedTrxId: ocrData?.trxId || null,
          detectedSenderNumber: ocrData?.senderNumber || null,
          detectedBankAccount: ocrData?.bankAccountNumber || null,
          detectedBankName: ocrData?.bankName || null,
          detectedAmount: ocrData?.amount || null,
          detectedGateway: ocrData?.gateway || null,
          ocrConfidence: ocrData?.confidence || 0,
          detectedSourceEngine: ocrData?.sourceEngine || null,
        });
      } catch (cloudErr: unknown) {
        const cErr = cloudErr as Error;
        console.error("[Upload] Cloudinary upload error:", cErr);
        // Fall through to local fallback if Cloudinary API rejected (e.g. invalid key)
        return NextResponse.json(
          {
            success: false,
            error: `Cloudinary upload failed: ${cErr.message}`,
            storage: "cloudinary_error",
          },
          { status: 500 }
        );
      }
    }

    // 2. Seamless local fallback when Cloudinary env vars are pending
    console.warn(
      "[Upload] Cloudinary is not configured. Saving file locally to public/uploads/ as fallback."
    );

    const uploadsDir = path.join(process.cwd(), "public", "uploads", safeFolder);
    await fs.mkdir(uploadsDir, { recursive: true });

    const ext = path.extname(file.name) || (file.type === "image/png" ? ".png" : ".jpg");
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}${ext}`;
    const filePath = path.join(uploadsDir, uniqueName);

    await fs.writeFile(filePath, buffer);

    const localUrl = `/uploads/${safeFolder}/${uniqueName}`;

    return NextResponse.json({
      success: true,
      url: localUrl,
      format: ext.replace(".", ""),
      bytes: buffer.length,
      storage: "local_fallback",
      message: "Uploaded locally. Add CLOUDINARY credentials in .env.local for Cloudinary hosting.",
      warning: "CLOUDINARY_NOT_CONFIGURED",
      detectedTrxId: ocrData?.trxId || null,
      detectedSenderNumber: ocrData?.senderNumber || null,
      detectedBankAccount: ocrData?.bankAccountNumber || null,
      detectedBankName: ocrData?.bankName || null,
      detectedAmount: ocrData?.amount || null,
      detectedGateway: ocrData?.gateway || null,
      ocrConfidence: ocrData?.confidence || 0,
      detectedSourceEngine: ocrData?.sourceEngine || null,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("[Upload] Unhandled upload error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to process upload" },
      { status: 500 }
    );
  }
}
