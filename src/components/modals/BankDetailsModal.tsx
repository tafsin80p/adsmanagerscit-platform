"use client";

import React, { useState } from "react";
import {
  X,
  Copy,
  Check,
  Building,
  ShieldCheck,
  ArrowRight,
  Info,
  CheckCircle,
} from "lucide-react";
import {
  CityBankLogo,
  BracBankLogo,
  DbblLogo,
} from "@/components/ui/BankLogos";
import { BankAccount } from "@/types";

export type BankKey = string;

interface BankDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  bankKey?: BankKey;
  bankAccount?: BankAccount;
  onConfirmBank?: (bank: any) => void;
}

export const BankDetailsModal: React.FC<BankDetailsModalProps> = ({
  isOpen,
  onClose,
  bankKey = "City Bank",
  bankAccount,
  onConfirmBank,
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!isOpen) return null;

  const bankData: Record<string, {
    name: string;
    branch: string;
    accountName: string;
    accountNumber: string;
    routingNumber: string;
    swift: string;
    tag: string;
    instructions: string;
    brandColor: string;
  }> = {
    "City Bank": {
      name: "The City Bank PLC",
      branch: "Gulshan Avenue Branch, Dhaka",
      accountName: "Meta Ads Agency BD",
      accountNumber: "1502-9384-72001",
      routingNumber: "225271829",
      swift: "CIBLBDDH",
      tag: "CityTouch / NPSB / BEFTN / RTGS",
      instructions:
        "Transfer instantly via CityTouch App or any Bangladeshi bank's internet banking / NPSB instant transfer. Please include your Facebook Page Name or Order ID in the reference field.",
      brandColor: "#EB2028",
    },
    "BRAC Bank": {
      name: "BRAC Bank PLC",
      branch: "Banani Branch, Dhaka",
      accountName: "Meta Ads Agency BD",
      accountNumber: "2061-4892-0001",
      routingNumber: "060260424",
      swift: "BRAKBDDH",
      tag: "Astha App / NPSB / BEFTN",
      instructions:
        "Transfer instantly via Astha App or any bank's NPSB instant fund transfer. Please mention your Facebook Page Name or Phone Number as the deposit reference.",
      brandColor: "#006CB5",
    },
    DBBL: {
      name: "Dutch-Bangla Bank PLC (DBBL)",
      branch: "Motijheel Foreign Exchange Branch, Dhaka",
      accountName: "Meta Ads Agency BD",
      accountNumber: "115-110-38491",
      routingNumber: "090272185",
      swift: "DBBLBDDH",
      tag: "NexusPay / Rocket / NPSB",
      instructions:
        "Transfer via NexusPay App, Rocket to Bank transfer, or standard NPSB / BEFTN from any bank. Enter your Phone Number or Order ID in the transaction reference.",
      brandColor: "#008751",
    },
  };

  const current = bankAccount
    ? {
        name: bankAccount.bankName,
        branch: bankAccount.branch || "Head Office / Principal Branch",
        accountName: bankAccount.accountName,
        accountNumber: bankAccount.accountNumber,
        routingNumber: bankAccount.routingNumber || "Available upon request",
        swift: bankAccount.swiftCode || "N/A",
        tag: bankAccount.tag || "NPSB / BEFTN / Online Banking",
        instructions:
          bankAccount.instructions ||
          "Transfer via online banking or any bank's NPSB instant transfer. Reference: Your Phone Number or Order ID.",
        brandColor: "#3858F6",
      }
    : (bankData[bankKey] || bankData["City Bank"]);

  const lowerName = current.name.toLowerCase();
  const isCity = lowerName.includes("city");
  const isBrac = lowerName.includes("brac");
  const isDbbl = lowerName.includes("dutch") || lowerName.includes("dbbl");

  const handleCopy = (text: string, fieldKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleProceed = () => {
    if (onConfirmBank) {
      onConfirmBank(bankAccount || bankKey);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Backdrop click */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#E7ECF3] overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        {/* Header with bank brand styling */}
        <div className="px-6 pt-6 pb-5 border-b border-[#E7ECF3] bg-[#F6F8FC] relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center border border-[#E7ECF3] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-4 pr-10">
            {/* Authentic brand logo in white container */}
            <div className="w-20 h-14 bg-white rounded-2xl border border-[#E7ECF3] p-2 shadow-sm flex items-center justify-center shrink-0">
              {isCity && <CityBankLogo className="w-full h-full" />}
              {isBrac && <BracBankLogo className="w-full h-full" />}
              {isDbbl && <DbblLogo className="w-full h-full" />}
              {!isCity && !isBrac && !isDbbl && (
                <div className="w-10 h-10 rounded-xl bg-[#EEF2FF] text-[#3858F6] flex items-center justify-center">
                  <Building className="w-6 h-6" />
                </div>
              )}
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-[10px] font-bold mb-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                Verified Corporate Account
              </div>
              <h3 className="text-base sm:text-lg font-bold text-[#172033] leading-snug">
                {current.name}
              </h3>
              <p className="text-xs text-slate-500 font-medium">{current.branch}</p>
            </div>
          </div>
        </div>

        {/* Modal Body / Information List */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Account Title */}
          <div className="p-3 bg-white rounded-2xl border border-[#E7ECF3] flex items-center justify-between gap-3 shadow-3xs">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Account Name / Title
              </span>
              <div className="text-sm font-bold text-[#172033] mt-0.5">
                {current.accountName}
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleCopy(current.accountName, "name")}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-50 hover:bg-[#EBF2FF] hover:text-[#0866FF] rounded-xl text-slate-600 transition-colors text-xs font-semibold border border-slate-200"
            >
              {copiedField === "name" ? (
                <Check className="w-3.5 h-3.5 text-[#12A875]" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>{copiedField === "name" ? "Copied" : "Copy"}</span>
            </button>
          </div>

          {/* Account Number - Highlighted */}
          <div className="p-3.5 bg-[#EBF2FF]/60 rounded-2xl border border-[#0866FF]/30 flex items-center justify-between gap-3 shadow-3xs">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#0866FF]">
                Account Number (A/C No)
              </span>
              <div className="text-base sm:text-lg font-mono font-extrabold text-[#0866FF] mt-0.5 tracking-wide">
                {current.accountNumber}
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleCopy(current.accountNumber, "acc")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0866FF] hover:bg-[#0052CC] text-white rounded-xl transition-colors text-xs font-bold shadow-xs"
            >
              {copiedField === "acc" ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>{copiedField === "acc" ? "Copied!" : "Copy Number"}</span>
            </button>
          </div>

          {/* Routing Number & SWIFT Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 bg-white rounded-2xl border border-[#E7ECF3] flex items-center justify-between gap-2 shadow-3xs">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Routing Number
                </span>
                <div className="font-mono font-bold text-slate-800 text-sm mt-0.5">
                  {current.routingNumber}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(current.routingNumber, "routing")}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-colors"
                title="Copy routing number"
              >
                {copiedField === "routing" ? (
                  <Check className="w-3.5 h-3.5 text-[#12A875]" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            <div className="p-3 bg-white rounded-2xl border border-[#E7ECF3] flex items-center justify-between gap-2 shadow-3xs">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  SWIFT Code
                </span>
                <div className="font-mono font-bold text-slate-800 text-sm mt-0.5">
                  {current.swift}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(current.swift, "swift")}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-colors"
                title="Copy SWIFT code"
              >
                {copiedField === "swift" ? (
                  <Check className="w-3.5 h-3.5 text-[#12A875]" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Instructions Box */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-[#E7ECF3] space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <Info className="w-3.5 h-3.5 text-[#0866FF]" />
              Transfer Instructions
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              {current.instructions}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-[#E7ECF3] flex items-center justify-between gap-3">
          <div className="text-[11px] text-slate-500 hidden sm:block">
            Support: Instant NPSB, BEFTN & RTGS
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-200/50 transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleProceed}
              className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-[#0866FF] hover:bg-[#0052CC] text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
            >
              <span>Done, Proceed with {bankKey}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
