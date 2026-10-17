"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  User,
  Building,
  Mail,
  Phone,
  CheckCircle2,
  Bell,
  Globe,
  Shield,
  Save,
  MessageCircle,
  ExternalLink,
  Smartphone,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { usePortal } from "@/context/PortalContext";

export default function ProfilePage() {
  const { profile, updateProfile, setIsSupportModalOpen } = usePortal();

  const [formData, setFormData] = useState({
    name: profile.name,
    email: profile.email,
    phone: profile.phone,
    businessName: profile.businessName,
  });

  const [notifications, setNotifications] = useState(profile.notifications);
  const [savedFeedback, setSavedFeedback] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      ...formData,
      notifications,
    });
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2000);
  };

  return (
    <DashboardLayout pageTitle="Profile">
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#172033] tracking-tight">
            Client Account & Settings
          </h1>
          <p className="text-xs sm:text-sm text-[#667085] mt-1">
            Manage your brand profile, connected Facebook Page, and notification preferences.
          </p>
        </div>

        {/* Profile Card Header */}
        <div className="bg-white p-6 rounded-2xl border border-[#E7ECF3] shadow-2xs flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <div className="relative w-20 h-20 rounded-full overflow-hidden ring-4 ring-[#0866FF]/20 bg-slate-100 shrink-0">
            <Image
              src={profile.avatar}
              alt={profile.name}
              fill
              className="object-cover"
              sizes="80px"
              priority
            />
          </div>

          <div className="flex-1 text-center sm:text-left space-y-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h2 className="text-lg font-bold text-[#172033]">{profile.name}</h2>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#12A875] bg-[#E8F8F2] px-2.5 py-0.5 rounded-full self-center sm:self-auto">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Verified Business Client
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              {profile.businessName} • {profile.email}
            </p>
            <div className="text-xs text-slate-400 pt-1">
              Client ID: <span className="font-mono text-slate-700 font-semibold">CL-88910</span>
            </div>
          </div>
        </div>

        {/* Account Details Form */}
        <form onSubmit={handleSave} className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-[#E7ECF3] shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-[#172033] flex items-center gap-2">
              <User className="w-4 h-4 text-[#0866FF]" />
              Personal & Business Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E7ECF3] focus:border-[#0866FF] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Brand / Business Name
                </label>
                <input
                  type="text"
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E7ECF3] focus:border-[#0866FF] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E7ECF3] focus:border-[#0866FF] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Mobile / WhatsApp Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E7ECF3] focus:border-[#0866FF] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Connected Facebook Page */}
          <div className="bg-white p-6 rounded-2xl border border-[#E7ECF3] shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-[#172033] flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#0866FF]" />
              Connected Social Media Assets
            </h3>

            <div className="p-4 rounded-xl bg-[#F6F8FC] border border-[#E7ECF3] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#0866FF] text-white flex items-center justify-center font-bold text-lg">
                  f
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#172033]">
                      {profile.connectedPage.name}
                    </span>
                    <span className="w-2 h-2 rounded-full bg-[#12A875]" />
                  </div>
                  <div className="text-xs text-slate-500">
                    {profile.connectedPage.category} • {profile.connectedPage.followers}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                    Page ID: {profile.connectedPage.id}
                  </div>
                </div>
              </div>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#E8F8F2] text-[#12A875] text-xs font-bold rounded-lg self-start sm:self-auto">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Active Link
              </span>
            </div>
          </div>

          {/* Notification Preferences */}
          <div className="bg-white p-6 rounded-2xl border border-[#E7ECF3] shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-[#172033] flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#0866FF]" />
              Order & Payment Notification Preferences
            </h3>

            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 rounded-xl bg-[#F6F8FC] border border-[#E7ECF3] cursor-pointer">
                <div>
                  <div className="text-xs font-bold text-slate-800">WhatsApp Instant Alerts</div>
                  <div className="text-[11px] text-slate-500">Receive order confirmation and delivery status on WhatsApp</div>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.whatsapp}
                  onChange={(e) => setNotifications({ ...notifications, whatsapp: e.target.checked })}
                  className="w-4 h-4 text-[#0866FF] rounded-md focus:ring-0"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-[#F6F8FC] border border-[#E7ECF3] cursor-pointer">
                <div>
                  <div className="text-xs font-bold text-slate-800">SMS Verification Notifications</div>
                  <div className="text-[11px] text-slate-500">SMS notification when payment verification completes</div>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.sms}
                  onChange={(e) => setNotifications({ ...notifications, sms: e.target.checked })}
                  className="w-4 h-4 text-[#0866FF] rounded-md focus:ring-0"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-[#F6F8FC] border border-[#E7ECF3] cursor-pointer">
                <div>
                  <div className="text-xs font-bold text-slate-800">Weekly Performance Email Summary</div>
                  <div className="text-[11px] text-slate-500">Consolidated analytics report sent every Sunday evening</div>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.email}
                  onChange={(e) => setNotifications({ ...notifications, email: e.target.checked })}
                  className="w-4 h-4 text-[#0866FF] rounded-md focus:ring-0"
                />
              </label>
            </div>
          </div>

          {/* Dedicated Ad Specialist Support Card */}
          <div className="bg-gradient-to-r from-[#0B1730] to-[#12213D] p-5 rounded-2xl text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs text-[#0866FF] font-bold uppercase tracking-wider">
                Dedicated Account Specialist
              </div>
              <h4 className="text-sm font-bold text-white mt-1">Sarah Rahman</h4>
              <p className="text-xs text-slate-400">
                Meta Certified Digital Media Buyer & Strategy Lead
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsSupportModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0866FF] hover:bg-[#0052CC] text-white text-xs font-bold rounded-xl shadow-xs transition-colors self-start sm:self-auto"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Direct WhatsApp Chat</span>
            </button>
          </div>

          {/* Save Button */}
          <div className="flex items-center justify-end gap-3 pt-2">
            {savedFeedback && (
              <span className="text-xs font-semibold text-[#12A875] flex items-center gap-1 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4" />
                Settings updated!
              </span>
            )}
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#0866FF] hover:bg-[#0052CC] text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
