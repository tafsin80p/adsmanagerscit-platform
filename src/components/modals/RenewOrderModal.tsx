"use client";

import React, { useState } from "react";
import { X, Check, Repeat, DollarSign } from "lucide-react";
import { usePortal } from "@/context/PortalContext";

export const RenewOrderModal: React.FC = () => {
  const {
    selectedOrderForRenew,
    setSelectedOrderForRenew,
    isRenewModalOpen,
    setIsRenewModalOpen,
    renewOrder,
    exchangeRateBDT,
    bkashCashoutPercent,
    nagadCashoutPercent,
  } = usePortal();

  const [days, setDays] = useState<number>(3);
  const [successMessage, setSuccessMessage] = useState(false);

  if (!isRenewModalOpen || !selectedOrderForRenew) return null;

  const order = selectedOrderForRenew;
  const renewalCostUSD = order.dailyBudgetUSD * days;
  const baseRenewalCostBDT = Math.round(renewalCostUSD * exchangeRateBDT);
  const cashoutPercent =
    order.paymentMethod === "bKash"
      ? bkashCashoutPercent
      : order.paymentMethod === "Nagad"
      ? nagadCashoutPercent
      : 0;
  const cashoutChargeBDT = Math.round((baseRenewalCostBDT * cashoutPercent) / 100);
  const renewalCostBDT = baseRenewalCostBDT + cashoutChargeBDT;

  const handleConfirmRenew = () => {
    renewOrder(order.id, days);
    setSuccessMessage(true);
    try {
      sessionStorage.setItem(
        "scit_auth_toast",
        JSON.stringify({
          type: "success",
          title: "Boost Renewed Successfully! 🚀",
          message: `Order #${order.id} has been extended for ${days} days. Our team is continuing ad delivery.`,
          duration: 4500,
        })
      );
    } catch {}
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
            <div className="w-8 h-8 rounded-lg bg-[#EEF2FF] text-[#3858F6] flex items-center justify-center">
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
                        ? "bg-[#3858F6] text-white border-[#3858F6] shadow-xs"
                        : "bg-white text-slate-600 border-[#E7ECF3] hover:border-[#3858F6]/40"
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
                <span className="font-semibold text-[#3858F6]">${renewalCostUSD.toFixed(2)} USD</span>
              </div>
              {cashoutChargeBDT > 0 && (
                <div className="flex justify-between text-xs text-slate-500">
                  <span>{order.paymentMethod} Cashout (+{cashoutPercent}%)</span>
                  <span className="font-semibold text-amber-600">+৳{cashoutChargeBDT.toLocaleString()} BDT</span>
                </div>
              )}
              <div className="pt-2 border-t border-[#E7ECF3] flex justify-between text-xs font-bold text-[#172033]">
                <span>Payable Amount (BDT)</span>
                <span className="text-sm text-[#3858F6]">≈ ৳{renewalCostBDT.toLocaleString()}</span>
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
                className="px-4 py-2 text-xs font-semibold bg-[#3858F6] hover:bg-[#2542D9] text-white rounded-xl shadow-xs transition-colors"
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
