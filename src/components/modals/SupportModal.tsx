"use client";

import React, { useState } from "react";
import { X, Headphones, Send, CheckCircle2, MessageSquare, Phone, Mail } from "lucide-react";
import { usePortal } from "@/context/PortalContext";

export const SupportModal: React.FC = () => {
  const { isSupportModalOpen, setIsSupportModalOpen } = usePortal();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (!isSupportModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setSubject("");
      setMessage("");
      setIsSupportModalOpen(false);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
        onClick={() => setIsSupportModalOpen(false)}
      />

      <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 z-10 border border-[#E7ECF3] animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-[#E7ECF3]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EEF2FF] text-[#3858F6] flex items-center justify-center">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#172033]">SCIT Ads Specialist Support</h3>
              <p className="text-xs text-slate-400">Direct response within 15 minutes</p>
            </div>
          </div>
          <button
            onClick={() => setIsSupportModalOpen(false)}
            className="text-slate-400 hover:text-slate-700 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Contact Chips */}
        <div className="grid grid-cols-2 gap-2.5 py-4">
          <a
            href="https://wa.me/8801712889900"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 p-3 rounded-xl bg-[#E8F8F2] hover:bg-[#D5F3E7] text-[#12A875] text-xs font-semibold transition-colors"
          >
            <MessageSquare className="w-4 h-4 shrink-0" />
            <div className="truncate">
              <div>WhatsApp Support</div>
              <div className="text-[10px] font-normal opacity-90">+880 1712-889900</div>
            </div>
          </a>
          <a
            href="tel:+8801712889900"
            className="flex items-center gap-2.5 p-3 rounded-xl bg-[#F6F8FC] hover:bg-[#EEF3FB] text-slate-700 text-xs font-semibold transition-colors"
          >
            <Phone className="w-4 h-4 text-[#3858F6] shrink-0" />
            <div className="truncate">
              <div>Helpline</div>
              <div className="text-[10px] font-normal text-slate-400">9 AM – 11 PM (Daily)</div>
            </div>
          </a>
        </div>

        {submitted ? (
          <div className="py-8 text-center space-y-2">
            <CheckCircle2 className="w-12 h-12 text-[#12A875] mx-auto" />
            <h4 className="text-sm font-bold text-[#172033]">Support Request Received!</h4>
            <p className="text-xs text-slate-500">
              Our SCIT Ads specialist has received your message and will update you shortly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Order or Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Question regarding Order #AD-1001 or Payment"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E7ECF3] focus:border-[#3858F6] focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                How can we assist you?
              </label>
              <textarea
                required
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your question, boost targeting request, or payment clarification..."
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E7ECF3] focus:border-[#3858F6] focus:outline-none resize-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsSupportModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-[#3858F6] hover:bg-[#2542D9] text-white rounded-xl shadow-xs transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                Send Inquiry
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
