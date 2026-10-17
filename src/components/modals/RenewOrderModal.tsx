"use client";

import React, { useState } from "react";
import { X, Check, Repeat, Sparkles, DollarSign } from "lucide-react";
import { usePortal } from "@/context/PortalContext";

export const RenewOrderModal: React.FC = () => {
  const {
    selectedOrderForRenew,
    setSelectedOrderForRenew,
    isRenewModalOpen,
    setIsRenewModalOpen,
    renewOrder,
    exchangeRateBDT,
  } = usePortal();

  const [days, setDays] = useState<number>(3);
  const [successMessage, setSuccessMessage] = useState(false);

  if (!isRenewModalOpen || !selectedOrderForRenew) return null;

  const order = selectedOrderForRenew;
  const renewalCostUSD = order.dailyBudgetUSD * days;
  const renewalCostBDT = Math.round(renewalCostUSD * exchangeRateBDT * 1.05);

  const handleConfirmRenew = () => {
    renewOrder(order.id, days);
    setSuccessMessage(true);
    setTimeout(() => {
      setSuccessMessage(false);
      setIsRenewModalOpen(false);
      setSelectedOrderForRenew(null);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
        onClick={() => {
          setIsRenewModalOpen(false);
          setSelectedOrderForRenew(null);
        }}
      />

      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 z-10 border border-[#E7ECF3] animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-[#E7ECF3]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#EBF2FF] text-[#0866FF] flex items-center justify-center">
              <Repeat className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#172033]">Renew Boost Campaign</h3>
              <p className="text-xs text-slate-400">Order #{order.id}</p>
            </div>
          </div>
          <button
            onClick={() => {
              setIsRenewModalOpen(false);
              setSelectedOrderForRenew(null);
            }}
            className="text-slate-400 hover:text-slate-700 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {successMessage ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 bg-[#E8F8F2] text-[#12A875] rounded-full flex items-center justify-center mx-auto">
              <Check className="w-6 h-6 stroke-[3]" />
            </div>
            <h4 className="text-sm font-bold text-[#172033]">Boost Renewed Successfully!</h4>
            <p className="text-xs text-slate-500">
              Your boost has been extended for {days} days. Our ad team is continuing delivery.
            </p>
          </div>
        ) : (
          <div className="py-4 space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Select Renewal Duration
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[1, 3, 5, 7].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDays(d)}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                      days === d
                        ? "bg-[#0866FF] text-white border-[#0866FF] shadow-xs"
                        : "bg-white text-slate-600 border-[#E7ECF3] hover:border-[#0866FF]/40"
                    }`}
                  >
                    +{d} Day{d > 1 ? "s" : ""}
                  </button>
                ))}
              </div>
            </div>

            {/* Cost Summary Box */}
            <div className="p-3.5 bg-[#F6F8FC] rounded-xl border border-[#E7ECF3] space-y-2">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Daily rate</span>
                <span className="font-semibold text-slate-700">${order.dailyBudgetUSD.toFixed(2)}/day</span>
              </div>
              <div className="flex justify-between text-xs text-slate-500">
                <span>Total Added Budget</span>
                <span className="font-semibold text-[#0866FF]">${renewalCostUSD.toFixed(2)} USD</span>
              </div>
              <div className="pt-2 border-t border-[#E7ECF3] flex justify-between text-xs font-bold text-[#172033]">
                <span>Payable Amount (BDT)</span>
                <span className="text-sm text-[#0866FF]">≈ ৳{renewalCostBDT.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsRenewModalOpen(false);
                  setSelectedOrderForRenew(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRenew}
                className="px-4 py-2 text-xs font-semibold bg-[#0866FF] hover:bg-[#0052CC] text-white rounded-xl shadow-xs transition-colors"
              >
                Confirm Renewal
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
