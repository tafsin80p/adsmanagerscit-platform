"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Wallet,
  CheckCircle2,
  Clock,
  AlertCircle,
  Download,
  Search,
  ExternalLink,
  ShieldCheck,
  CreditCard,
  FileText,
  Printer,
  X,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { usePortal } from "@/context/PortalContext";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { PaymentTransaction } from "@/types";

export default function PaymentHistoryPage() {
  const { payments, profile, exchangeRateBDT } = usePortal();
  const [searchQuery, setSearchQuery] = useState("");
  const [methodFilter, setMethodFilter] = useState("All");
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentTransaction | null>(null);

  const filteredPayments = payments.filter((p) => {
    const matchesSearch =
      p.transactionId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.campaignName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMethod = methodFilter === "All" || p.method === methodFilter;
    return matchesSearch && matchesMethod;
  });

  const totalVerifiedBDT = payments
    .filter((p) => p.status === "Verified")
    .reduce((sum, p) => sum + p.amountBDT, 0);

  const pendingVerificationBDT = payments
    .filter((p) => p.status === "Under Review")
    .reduce((sum, p) => sum + p.amountBDT, 0);

  return (
    <DashboardLayout pageTitle="Payment History">
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#172033] tracking-tight">
              Payment & Invoicing History
            </h1>
            <p className="text-xs sm:text-sm text-[#667085] mt-1">
              Verify your bKash, Nagad, and Bank Transfer receipts and billing statements.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium bg-white px-3 py-1.5 rounded-xl border border-[#E7ECF3] shadow-2xs">
              Exchange Rate: <strong className="text-[#0866FF]">1 USD = ৳{exchangeRateBDT} BDT</strong>
            </span>
          </div>
        </div>

        {/* 3 Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-[#E7ECF3] shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#E8F8F2] text-[#12A875] flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-slate-500 font-medium">Total Paid (BDT)</span>
                <div className="text-xl font-bold text-[#172033]">
                  ৳{totalVerifiedBDT.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#E7ECF3] shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FFF4E5] text-[#F59E0B] flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-slate-500 font-medium">Under Verification</span>
                <div className="text-xl font-bold text-[#D97706]">
                  ৳{pendingVerificationBDT.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#E7ECF3] shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#EBF2FF] text-[#0866FF] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-slate-500 font-medium">Billing Account</span>
                <div className="text-sm font-bold text-[#172033]">{profile.businessName}</div>
                <div className="text-[11px] text-slate-400">Verified Client</div>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="bg-white p-4 rounded-2xl border border-[#E7ECF3] shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Transaction ID (BK...), Order ID (#AD-1001)..."
              className="w-full bg-[#F6F8FC] focus:bg-white text-xs text-[#172033] pl-10 pr-4 py-2.5 rounded-xl border border-transparent focus:border-[#0866FF] focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {["All", "bKash", "Nagad", "Bank Transfer"].map((m) => (
              <button
                key={m}
                onClick={() => setMethodFilter(m)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                  methodFilter === m
                    ? "bg-[#0866FF] text-white"
                    : "bg-[#F6F8FC] text-slate-600 hover:bg-slate-200"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-2xl border border-[#E7ECF3] shadow-2xs overflow-hidden">
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E7ECF3] bg-[#F6F8FC]/60 text-[11px] font-semibold text-[#667085] uppercase tracking-wider">
                  <th className="py-3.5 px-6">Transaction ID</th>
                  <th className="py-3.5 px-4">Order ID & Campaign</th>
                  <th className="py-3.5 px-4">Method</th>
                  <th className="py-3.5 px-4">Date & Time</th>
                  <th className="py-3.5 px-4">USD Budget</th>
                  <th className="py-3.5 px-4">Payable (BDT)</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-6 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7ECF3] text-xs">
                {filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-[#F6F8FC]/60 transition-colors">
                    <td className="py-4 px-6 font-mono font-bold text-[#0866FF]">
                      {p.transactionId}
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-semibold text-slate-800">{p.campaignName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">#{p.orderId}</div>
                    </td>
                    <td className="py-4 px-4 font-medium text-slate-700">
                      {p.method}
                    </td>
                    <td className="py-4 px-4 text-slate-500 font-medium">
                      {p.date}
                    </td>
                    <td className="py-4 px-4 font-semibold text-slate-800">
                      ${p.amountUSD.toFixed(2)}
                    </td>
                    <td className="py-4 px-4 font-bold text-slate-900">
                      ৳{p.amountBDT.toLocaleString()}
                    </td>
                    <td className="py-4 px-4">
                      <StatusBadge status={p.status} size="sm" />
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => setSelectedReceipt(p)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 border border-[#E7ECF3] text-xs font-semibold text-slate-700 rounded-lg shadow-2xs transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5 text-[#0866FF]" />
                        <span>Receipt</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-[#E7ECF3]">
            {filteredPayments.map((p) => (
              <div key={p.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-xs font-bold text-[#0866FF]">
                      {p.transactionId}
                    </span>
                    <div className="text-xs font-bold text-[#172033] mt-0.5">{p.campaignName}</div>
                    <div className="text-[10px] text-slate-400">Order #{p.orderId} • {p.method}</div>
                  </div>
                  <StatusBadge status={p.status} size="sm" />
                </div>

                <div className="flex items-center justify-between text-xs bg-[#F6F8FC] p-2.5 rounded-xl">
                  <div>
                    <span className="text-[10px] text-slate-400 block">USD Budget</span>
                    <span className="font-semibold text-slate-800">${p.amountUSD.toFixed(2)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">BDT Total</span>
                    <span className="font-bold text-[#0866FF]">৳{p.amountBDT.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-400">{p.date}</span>
                  <button
                    onClick={() => setSelectedReceipt(p)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#0866FF] hover:underline"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    View Receipt
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Printable/Viewable Receipt Modal */}
        {selectedReceipt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
              onClick={() => setSelectedReceipt(null)}
            />
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 z-10 border border-[#E7ECF3] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E7ECF3]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#0866FF] text-white flex items-center justify-center font-bold text-xs">
                    M
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#172033]">Payment Receipt</h3>
                    <p className="text-[10px] text-slate-400 font-mono">Invoice #{selectedReceipt.id}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedReceipt(null)}
                  className="text-slate-400 hover:text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Receipt Content */}
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-[#F6F8FC] rounded-xl space-y-1.5 border border-[#E7ECF3]">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Client:</span>
                    <span className="font-semibold text-slate-800">{profile.name} ({profile.businessName})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Campaign:</span>
                    <span className="font-semibold text-slate-800">{selectedReceipt.campaignName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Order ID:</span>
                    <span className="font-mono text-slate-800">#{selectedReceipt.orderId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Payment Gateway:</span>
                    <span className="font-semibold text-slate-800">{selectedReceipt.method}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Transaction ID:</span>
                    <span className="font-mono font-bold text-[#0866FF]">{selectedReceipt.transactionId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Timestamp:</span>
                    <span className="text-slate-600">{selectedReceipt.date}</span>
                  </div>
                </div>

                <div className="space-y-1.5 pt-1 border-t border-slate-100">
                  <div className="flex justify-between text-slate-500">
                    <span>Base Amount (USD)</span>
                    <span className="font-semibold text-slate-800">${selectedReceipt.amountUSD.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Exchange Conversion Rate</span>
                    <span className="text-slate-800">1 USD = ৳{selectedReceipt.exchangeRate} BDT</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Service & Payment Processing</span>
                    <span className="text-slate-800">৳{selectedReceipt.serviceChargeBDT} BDT</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm text-[#172033] pt-2 border-t border-[#E7ECF3]">
                    <span>Total Amount Paid</span>
                    <span className="text-[#0866FF]">৳{selectedReceipt.amountBDT.toLocaleString()} BDT</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print
                </button>
                <button
                  onClick={() => setSelectedReceipt(null)}
                  className="px-4 py-1.5 text-xs font-semibold bg-[#0866FF] text-white rounded-xl hover:bg-[#0052CC]"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
