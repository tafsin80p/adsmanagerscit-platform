import Tesseract from "tesseract.js";

export interface ParsedReceiptData {
  trxId: string | null;
  senderNumber: string | null;
  amount: number | null;
  gateway: "bKash" | "Nagad" | "Bank" | "Rocket" | null;
  confidence: number;
  rawText: string;
}

/**
 * Parses OCR extracted text to extract exact Transaction ID, Sender Mobile Number,
 * Gateway name, and Amount from Bangladeshi payment receipts (bKash, Nagad, Rocket, Banks).
 */
export function parseReceiptText(text: string, ocrConfidence = 0): ParsedReceiptData {
  const result: ParsedReceiptData = {
    trxId: null,
    senderNumber: null,
    amount: null,
    gateway: null,
    confidence: ocrConfidence,
    rawText: text || "",
  };

  if (!text || typeof text !== "string") {
    return result;
  }

  // Normalize line breaks and clean common OCR noise
  const cleanText = text.replace(/\r\n/g, "\n");
  const lines = cleanText
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const lower = cleanText.toLowerCase();

  // 1. Detect Payment Gateway
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
    lower.includes("fund transfer")
  ) {
    result.gateway = "Bank";
  }

  // 2. Transaction ID Extraction
  // Pass 1: Explicit labels on the same line (supports English and Bengali)
  // Example: "TrxID: 9J29AKD921", "Transaction ID: BLA78D9SK2", "Txn ID: 71KD9A8J", "Ref No: FT243029108491"
  const sameLineLabelRegex =
    /(?:trx\s*id|transaction\s*id|trans\s*id|txn\s*id|trx\s*no|txn\s*no|ref\s*no|reference\s*(?:no|number|num)?|ref\s*id|trace\s*id|utr\s*no|utr|ট্রানজেকশন\s*আইডি|লেনদেন\s*(?:আইডি|নম্বর)|রেফারেন্স)\s*[:;：|#.\-]?\s*([A-Za-z0-9_-]{6,30})/i;

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
      // bKash format: typically 10 uppercase alphanumeric chars with letters & numbers (e.g. BLA78D9SK2, 9J29AKD921)
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
      // Nagad format: typically 8 uppercase alphanumeric chars (e.g. 71KD9A8J)
      const matches8 = cleanText.match(/\b([A-Z0-9]{8})\b/g);
      if (matches8) {
        const valid = matches8.find(
          (m) =>
            /[A-Z]/.test(m) &&
            /[0-9]/.test(m) &&
            !m.startsWith("01") &&
            !m.startsWith("202") // avoids year prefixes like 20261101
        );
        if (valid) result.trxId = valid.toUpperCase();
      }
    }
  }

  // 3. Sender / Payer Mobile Number Extraction
  // Priority: explicit sender/from/payer label
  const senderRegex =
    /(?:sender|from|payer|account\s*no|wallet|mobile|প্রেরক|প্রেরকের\s*নম্বর)\s*[:;：|#.\-]?\s*(?:\+?88)?\s*(01[3-9]\d{2}[-\s]?\d{6})/i;
  const senderMatch = cleanText.match(senderRegex);
  if (senderMatch && senderMatch[1]) {
    result.senderNumber = senderMatch[1].replace(/[-\s]/g, "");
  } else {
    // Fallback: search for valid Bangladeshi mobile numbers
    const allPhones = cleanText.match(/(?:\+?88)?\b(01[3-9]\d{8})\b/g);
    if (allPhones && allPhones.length > 0) {
      result.senderNumber = allPhones[0].replace(/^[+]?88/, "");
    }
  }

  // 4. Amount Extraction
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

/**
 * Strips punctuation and trailing garbage from candidate TrxID.
 */
function sanitizeTrxId(raw: string): string {
  return raw
    .trim()
    .replace(/^[:;：|#.\-]+/, "")
    .replace(/[:;：|#.\-]+$/, "")
    .toUpperCase();
}

/**
 * Validates that candidate TrxID is not a common noise word or pure common word.
 */
function isValidTrxCandidate(val: string): boolean {
  if (!val || val.length < 6 || val.length > 30) return false;
  // Ignore common keywords if OCR misgrouped them
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
  // Must contain alphanumeric chars
  return /^[A-Za-z0-9_-]+$/.test(val);
}

/**
 * Runs Tesseract OCR on an image buffer or file URL and parses payment data.
 */
export async function scanReceiptImage(imageInput: Buffer | string): Promise<ParsedReceiptData> {
  try {
    const { data } = await Tesseract.recognize(imageInput, "eng");
    return parseReceiptText(data.text, data.confidence);
  } catch (err) {
    console.error("[ReceiptOCR] Error during Tesseract recognition:", err);
    return {
      trxId: null,
      senderNumber: null,
      amount: null,
      gateway: null,
      confidence: 0,
      rawText: "",
    };
  }
}

