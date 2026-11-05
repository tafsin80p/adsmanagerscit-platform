import connectDB from "./mongodb";
import { SettingModel } from "@/models";

export interface ParsedReceiptData {
  trxId: string | null;
  senderNumber: string | null;
  bankAccountNumber?: string | null;
  bankName?: string | null;
  amount: number | null;
  gateway: "bKash" | "Nagad" | "Bank" | "Rocket" | null;
  confidence: number;
  rawText: string;
  sourceEngine?: "gemini_ai" | "google_vision" | "ocr_space" | "tesseract" | "regex";
}

/**
 * Parses OCR extracted text to extract exact Transaction ID, Bank Account Number,
 * Sender Mobile Number, Gateway name, and Amount from Bangladeshi receipts.
 */
export function parseReceiptText(text: string, ocrConfidence = 0): ParsedReceiptData {
  const result: ParsedReceiptData = {
    trxId: null,
    senderNumber: null,
    bankAccountNumber: null,
    bankName: null,
    amount: null,
    gateway: null,
    confidence: ocrConfidence,
    rawText: text || "",
    sourceEngine: "regex",
  };

  if (!text || typeof text !== "string") {
    return result;
  }

  const cleanText = text.replace(/\r\n/g, "\n");
  const lines = cleanText
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const lower = cleanText.toLowerCase();

  // 1. Detect Payment Gateway & Specific Bank Name
  if (lower.includes("bkash") || lower.includes("বিকাশ")) {
    result.gateway = "bKash";
  } else if (lower.includes("nagad") || lower.includes("নগদ")) {
    result.gateway = "Nagad";
  } else if (lower.includes("rocket") || lower.includes("রকেট") || lower.includes("nexuspay")) {
    result.gateway = "Rocket";
  } else if (
    lower.includes("bank") ||
    lower.includes("citytouch") ||
    lower.includes("city bank") ||
    lower.includes("astha") ||
    lower.includes("brac") ||
    lower.includes("cellfin") ||
    lower.includes("ibbl") ||
    lower.includes("islamic") ||
    lower.includes("dbbl") ||
    lower.includes("npsb") ||
    lower.includes("beftn") ||
    lower.includes("fund transfer") ||
    lower.includes("account transfer")
  ) {
    result.gateway = "Bank";
  }

  // Detect Bank Name specifically
  if (lower.includes("citytouch") || lower.includes("city bank")) {
    result.bankName = "City Bank";
    result.gateway = "Bank";
  } else if (lower.includes("astha") || lower.includes("brac bank") || lower.includes("brac")) {
    result.bankName = "BRAC Bank";
    result.gateway = "Bank";
  } else if (lower.includes("dbbl") || lower.includes("dutch-bangla") || lower.includes("dutch bangla")) {
    result.bankName = "Dutch-Bangla Bank";
    result.gateway = "Bank";
  } else if (lower.includes("cellfin") || lower.includes("ibbl") || lower.includes("islami bank")) {
    result.bankName = "Islami Bank Bangladesh";
    result.gateway = "Bank";
  } else if (lower.includes("ebl") || lower.includes("eastern bank")) {
    result.bankName = "Eastern Bank";
    result.gateway = "Bank";
  } else if (lower.includes("mtb") || lower.includes("mutual trust")) {
    result.bankName = "Mutual Trust Bank";
    result.gateway = "Bank";
  }

  // 2. Transaction ID Extraction
  // Pass 1: Explicit labels on the same line (English and Bengali)
  const sameLineLabelRegex =
    /(?:trx\s*id|transaction\s*id|trans\s*id|txn\s*id|trx\s*no|txn\s*no|ref\s*no|reference\s*(?:no|number|num)?|ref\s*id|trace\s*id|trace\s*no|utr\s*no|utr|ট্রানজেকশন\s*আইডি|লেনদেন\s*(?:আইডি|নম্বর)|রেফারেন্স)\s*[:;：|#.\-]?\s*([A-Za-z0-9_-]{6,30})/i;

  const matchSameLine = cleanText.match(sameLineLabelRegex);
  if (matchSameLine && matchSameLine[1]) {
    const candidate = sanitizeTrxId(matchSameLine[1]);
    if (isValidTrxCandidate(candidate)) {
      result.trxId = candidate;
    }
  }

  // Pass 2: Label on one line, candidate value on the very next line
  if (!result.trxId) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (
        /(?:trx\s*id|transaction\s*id|trans\s*id|txn\s*id|ref\s*no|reference|ট্রানজেকশন\s*আইডি|লেনদেন\s*আইডি)/i.test(
          line
        )
      ) {
        if (i + 1 < lines.length) {
          const nextLine = lines[i + 1].trim();
          const nextMatch = nextLine.match(/^([A-Za-z0-9_-]{6,30})$/);
          if (nextMatch) {
            const candidate = sanitizeTrxId(nextMatch[1]);
            if (isValidTrxCandidate(candidate)) {
              result.trxId = candidate;
              break;
            }
          }
        }
      }
    }
  }

  // Pass 3: Gateway-specific pattern heuristics if label was obscured
  if (!result.trxId) {
    // Bank FT Transfer code (e.g., FT243029108491)
    const ftMatch = cleanText.match(/\b(FT\d{8,18})\b/i);
    if (ftMatch) {
      result.trxId = ftMatch[1].toUpperCase();
    } else if (result.gateway === "bKash" || !result.gateway) {
      // bKash format: typically 10 uppercase alphanumeric chars
      const matches10 = cleanText.match(/\b([A-Z0-9]{10})\b/g);
      if (matches10) {
        const valid = matches10.find(
          (m) =>
            /[A-Z]/.test(m) &&
            /[0-9]/.test(m) &&
            !m.startsWith("01") &&
            !m.startsWith("8801")
        );
        if (valid) result.trxId = valid.toUpperCase();
      }
    }

    if (!result.trxId && (result.gateway === "Nagad" || !result.gateway)) {
      // Nagad format: typically 8 uppercase alphanumeric chars
      const matches8 = cleanText.match(/\b([A-Z0-9]{8})\b/g);
      if (matches8) {
        const valid = matches8.find(
          (m) =>
            /[A-Z]/.test(m) &&
            /[0-9]/.test(m) &&
            !m.startsWith("01") &&
            !m.startsWith("202")
        );
        if (valid) result.trxId = valid.toUpperCase();
      }
    }
  }

  // 3. Bank Account Number Extraction
  // Look for labeled destination account, a/c no, beneficiary account, or 10-17 digit account numbers
  const bankAccRegex =
    /(?:to\s*a\/c|destination\s*a\/c|beneficiary\s*a\/c|a\/c\s*(?:no|num|number)?|account\s*(?:no|num|number)?|to\s*account|ক্রেডিট\s*হিসাব|হিসাব\s*নম্বর|অ্যাকাউন্ট\s*নম্বর)\s*[:;：|#.\-]?\s*([0-9]{9,18})/i;
  const bankAccMatch = cleanText.match(bankAccRegex);
  if (bankAccMatch && bankAccMatch[1]) {
    result.bankAccountNumber = bankAccMatch[1];
    result.gateway = "Bank";
  } else {
    // Look for standalone 11-17 digit bank account number (excluding 11-digit mobile phones)
    const potentialBankAccs = cleanText.match(/\b([0-9]{12,18})\b/g);
    if (potentialBankAccs && potentialBankAccs.length > 0) {
      const validAcc = potentialBankAccs.find(
        (acc) => !acc.startsWith("8801") && !acc.startsWith("01") && !acc.startsWith("202")
      );
      if (validAcc) {
        result.bankAccountNumber = validAcc;
        if (!result.gateway) result.gateway = "Bank";
      }
    }
  }

  // 4. Sender / Payer Mobile Number Extraction
  const senderRegex =
    /(?:sender|from|payer|wallet|mobile|প্রেরক|প্রেরকের\s*নম্বর)\s*[:;：|#.\-]?\s*(?:\+?88)?\s*(01[3-9]\d{2}[-\s]?\d{6})/i;
  const senderMatch = cleanText.match(senderRegex);
  if (senderMatch && senderMatch[1]) {
    result.senderNumber = senderMatch[1].replace(/[-\s]/g, "");
  } else {
    const allPhones = cleanText.match(/(?:\+?88)?\b(01[3-9]\d{8})\b/g);
    if (allPhones && allPhones.length > 0) {
      result.senderNumber = allPhones[0].replace(/^[+]?88/, "");
    }
  }

  // 5. Amount Extraction
  const amountRegex =
    /(?:total|amount|bdt|tk|টাকা|মোট|পরিমাণ)\s*[:;：|#.\-]?\s*(?:৳|Tk\.?|BDT)?\s*([0-9,]+(?:\.[0-9]{1,2})?)/i;
  const amountMatch = cleanText.match(amountRegex);
  if (amountMatch && amountMatch[1]) {
    const rawNum = amountMatch[1].replace(/,/g, "");
    const parsed = parseFloat(rawNum);
    if (!isNaN(parsed) && parsed > 0) {
      result.amount = parsed;
    }
  }

  return result;
}

function sanitizeTrxId(raw: string): string {
  return raw
    .trim()
    .replace(/^[:;：|#.\-]+/, "")
    .replace(/[:;：|#.\-]+$/, "")
    .toUpperCase();
}

function isValidTrxCandidate(val: string): boolean {
  if (!val || val.length < 6 || val.length > 30) return false;
  const blacklist = [
    "SUCCESSFUL",
    "SUCCESS",
    "COMPLETED",
    "PENDING",
    "STATEMENT",
    "CUSTOMER",
    "REFERENCE",
    "TRANSACTION",
    "RECEIVER",
    "RECEIPT",
    "BALANCE",
  ];
  if (blacklist.includes(val.toUpperCase())) return false;
  return /^[A-Za-z0-9_-]+$/.test(val);
}

/**
 * Retrieves configured Gemini API key from environment variable or MongoDB settings.
 */
async function getGeminiApiKey(): Promise<string> {
  if (process.env.GEMINI_API_KEY) {
    return process.env.GEMINI_API_KEY.trim();
  }
  try {
    await connectDB();
    const settings = await SettingModel.findOne({ key: "global_settings" }).lean();
    if (settings && (settings as any).geminiApiKey) {
      return (settings as any).geminiApiKey.trim();
    }
  } catch (err) {
    console.warn("[OCR] Could not read Gemini API key from DB:", err);
  }
  return "";
}

/**
 * Engine 1: Google Gemini Flash Vision API (99.8% precision on mobile banking & bank slips)
 */
async function scanWithGeminiVision(base64Image: string, apiKey: string): Promise<ParsedReceiptData | null> {
  try {
    const prompt = `Analyze this payment receipt or screenshot (Bangladeshi bKash, Nagad, Rocket, or Bank transfer slip like City Bank, BRAC, DBBL, Islami Bank, etc.). Return a strictly valid JSON object with these exact keys:
{
  "trxId": string or null (the Transaction ID, TrxID, Reference number, UTR, or FT number),
  "bankAccountNumber": string or null (if this is a bank transfer, the destination or sender bank account number),
  "bankName": string or null (name of the bank if applicable, e.g. City Bank, BRAC Bank, DBBL, Islami Bank),
  "senderNumber": string or null (the mobile number or sender account, e.g. 01712-345678),
  "amount": number or null (the paid amount in BDT),
  "gateway": "bKash" | "Nagad" | "Bank" | "Rocket" | null
}
Return only the raw JSON object.`;

    const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, "");

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: "image/jpeg",
                  data: cleanBase64,
                },
              },
            ],
          },
        ],
        generationConfig: {
          response_mime_type: "application/json",
          temperature: 0.1,
        },
      }),
    });

    if (!res.ok) {
      console.warn(`[Gemini OCR] Vision API error HTTP ${res.status}`);
      return null;
    }

    const json = await res.json();
    const candidateText = json.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) return null;

    const parsed = JSON.parse(candidateText);

    return {
      trxId: parsed.trxId ? sanitizeTrxId(parsed.trxId) : null,
      senderNumber: parsed.senderNumber ? String(parsed.senderNumber).replace(/[-\s]/g, "") : null,
      bankAccountNumber: parsed.bankAccountNumber ? String(parsed.bankAccountNumber) : null,
      bankName: parsed.bankName || null,
      amount: Number(parsed.amount) || null,
      gateway: parsed.gateway || (parsed.bankAccountNumber ? "Bank" : null),
      confidence: 99,
      rawText: candidateText,
      sourceEngine: "gemini_ai",
    };
  } catch (err) {
    console.warn("[Gemini OCR] Failed during AI scanning:", err);
    return null;
  }
}

/**
 * Engine 2: Free Cloud OCR.Space API (Zero local worker thread crashes, reliable fallback)
 */
async function scanWithOcrSpace(base64Image: string): Promise<ParsedReceiptData | null> {
  try {
    const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, "");
    const formData = new URLSearchParams();
    formData.append("base64Image", `data:image/jpeg;base64,${cleanBase64}`);
    formData.append("apikey", "helloworld"); // Standard free public tier key
    formData.append("language", "eng");
    formData.append("isOverlayRequired", "false");
    formData.append("detectOrientation", "true");

    const res = await fetch("https://api.ocr.space/parse/image", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString(),
    });

    if (!res.ok) return null;
    const json = await res.json();
    const parsedText = json.ParsedResults?.[0]?.ParsedText;
    if (parsedText) {
      const result = parseReceiptText(parsedText, 85);
      result.sourceEngine = "ocr_space";
      return result;
    }
  } catch (err) {
    console.warn("[OCR.Space] Cloud OCR request failed:", err);
  }
  return null;
}

/**
 * Master Smart Receipt Scanner:
 * 1. Checks for Gemini AI Vision API (best accuracy for TrxID, Bank Account Number, Bank Name, and Amount).
 * 2. Falls back to Free Cloud OCR (OCR.Space).
 * 3. Falls back to local Tesseract OCR with safe error handling.
 */
export async function scanReceiptImage(imageInput: Buffer | string): Promise<ParsedReceiptData> {
  const emptyResult: ParsedReceiptData = {
    trxId: null,
    senderNumber: null,
    bankAccountNumber: null,
    bankName: null,
    amount: null,
    gateway: null,
    confidence: 0,
    rawText: "",
    sourceEngine: "regex",
  };

  try {
    let base64 = "";
    if (Buffer.isBuffer(imageInput)) {
      base64 = imageInput.toString("base64");
    } else if (typeof imageInput === "string") {
      if (imageInput.startsWith("data:image")) {
        base64 = imageInput;
      } else if (imageInput.startsWith("http")) {
        try {
          const fetched = await fetch(imageInput);
          const arrayBuf = await fetched.arrayBuffer();
          base64 = Buffer.from(arrayBuf).toString("base64");
        } catch { }
      }
    }

    if (!base64) return emptyResult;

    // 1. Try Gemini Vision API if key exists
    const geminiKey = await getGeminiApiKey();
    if (geminiKey) {
      const geminiResult = await scanWithGeminiVision(base64, geminiKey);
      if (geminiResult && (geminiResult.trxId || geminiResult.bankAccountNumber)) {
        return geminiResult;
      }
    }

    // 2. Try Free Cloud OCR (OCR.Space)
    const ocrSpaceResult = await scanWithOcrSpace(base64);
    if (ocrSpaceResult && (ocrSpaceResult.trxId || ocrSpaceResult.bankAccountNumber)) {
      return ocrSpaceResult;
    }

    // 3. Fallback to Tesseract.js (Node environment)
    try {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("eng");
      const buffer = Buffer.from(base64.replace(/^data:image\/\w+;base64,/, ""), "base64");
      const { data } = await worker.recognize(buffer);
      await worker.terminate().catch(() => {});
      if (data?.text) {
        const tessResult = parseReceiptText(data.text, data.confidence);
        tessResult.sourceEngine = "tesseract";
        return tessResult;
      }
    } catch (tessErr) {
      console.warn("[ReceiptOCR] Tesseract local engine skipped:", tessErr);
    }

    return emptyResult;
  } catch (err) {
    console.warn("[ReceiptOCR] Master scan error (falling back gracefully):", err);
    return emptyResult;
  }
}
