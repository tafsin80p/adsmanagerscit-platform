"use client";

import React, { useState, useEffect } from "react";
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
  Layers,
  Sparkles,
  RefreshCw,
  Loader2,
  AlertCircle,
  Camera,
  UploadCloud,
  Check,
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

  const [connectedPage, setConnectedPage] = useState({
    name: profile.connectedPage?.name || profile.businessName || "My Facebook Page",
    id: profile.connectedPage?.id || "110132735345674",
    followers: profile.connectedPage?.followers || "12.8K followers",
    category: profile.connectedPage?.category || "Shopping & Retail",
    verified: profile.connectedPage?.verified !== false,
    avatar: profile.connectedPage?.avatar || profile.avatar || "https://lookaside.fbsbx.com/lookaside/crawler/media/?media_id=100090491619527",
  });

  const [notifications, setNotifications] = useState(profile.notifications);
  const [savedFeedback, setSavedFeedback] = useState(false);
  const [isSyncingFb, setIsSyncingFb] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // Cloudinary Avatar & Asset Upload states
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingPageLogo, setIsUploadingPageLogo] = useState(false);
  const [avatarUploadSuccess, setAvatarUploadSuccess] = useState<string | null>(null);
  const [avatarUploadError, setAvatarUploadError] = useState<string | null>(null);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>, isPageLogo = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (isPageLogo) {
      setIsUploadingPageLogo(true);
    } else {
      setIsUploadingAvatar(true);
    }
    setAvatarUploadError(null);
    setAvatarUploadSuccess(null);

    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "avatars");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: fd,
      });

      const data = await res.json();
      if (data.success && data.url) {
        if (isPageLogo) {
          const updatedPage = {
            ...connectedPage,
            avatar: data.url,
          };
          setConnectedPage(updatedPage);
          updateProfile({
            connectedPage: updatedPage,
          });
          setAvatarUploadSuccess("Facebook Page logo updated successfully!");
        } else {
          updateProfile({
            avatar: data.url,
          });
          setAvatarUploadSuccess(
            data.storage === "cloudinary"
              ? "Profile picture uploaded to Cloudinary!"
              : "Profile picture updated successfully!"
          );
        }
        setTimeout(() => setAvatarUploadSuccess(null), 3500);
      } else {
        setAvatarUploadError(data.error || "Failed to upload image");
        setTimeout(() => setAvatarUploadError(null), 4000);
      }
    } catch (err: unknown) {
      const error = err as Error;
      setAvatarUploadError(error.message || "Network error uploading image");
      setTimeout(() => setAvatarUploadError(null), 4000);
    } finally {
      setIsUploadingAvatar(false);
      setIsUploadingPageLogo(false);
      // Reset input value so re-selecting same file triggers onChange
      e.target.value = "";
    }
  };

  useEffect(() => {
    setFormData({
      name: profile.name,
      email: profile.email,
      phone: profile.phone,
      businessName: profile.businessName,
    });
    setConnectedPage({
      name: profile.connectedPage?.name || profile.businessName || "My Facebook Page",
      id: profile.connectedPage?.id || "110132735345674",
      followers: profile.connectedPage?.followers || "12.8K followers",
      category: profile.connectedPage?.category || "Shopping & Retail",
      verified: profile.connectedPage?.verified !== false,
      avatar: profile.connectedPage?.avatar || profile.avatar || "https://lookaside.fbsbx.com/lookaside/crawler/media/?media_id=100090491619527",
    });
    setNotifications(profile.notifications);
  }, [profile]);

  // Real-time Facebook Page detection & sync
  const handleSyncWithFacebook = async () => {
    setIsSyncingFb(true);
    setSyncFeedback(null);
    try {
      const targetQuery = connectedPage.id || connectedPage.name || "110132735345674";
      const res = await fetch(`/api/facebook/page-info?query=${encodeURIComponent(targetQuery)}`);
      const data = await res.json();
      if (data.success && data.page) {
        const updated = {
          ...connectedPage,
          name: data.page.name || connectedPage.name,
          id: data.page.id || connectedPage.id,
          followers: data.page.followers || connectedPage.followers,
          category: data.page.category || connectedPage.category,
          avatar: data.page.avatar || connectedPage.avatar,
          verified: true,
        };
        setConnectedPage(updated);
        updateProfile({
          connectedPage: updated,
          avatar: updated.avatar || profile.avatar,
          businessName: updated.name,
        });
        setSyncFeedback(`Verified Facebook Page "${updated.name}"! Real Followers: ${updated.followers}`);
      } else {
        setSyncFeedback("Could not find public page. Please verify your Facebook page link.");
      }
    } catch {
      setSyncFeedback("Network error connecting to Facebook API.");
    } finally {
      setIsSyncingFb(false);
      setTimeout(() => setSyncFeedback(null), 4000);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      ...formData,
      businessName: connectedPage.name || formData.businessName,
      connectedPage,
      notifications,
    });
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2500);
  };

  return (
    <DashboardLayout pageTitle="Profile">
      <div className="space-y-6 w-full">
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
          <div className="relative group/avatar w-20 h-20 rounded-2xl overflow-hidden ring-4 ring-[#0866FF]/20 bg-slate-100 shrink-0 shadow-sm cursor-pointer">
            <Image
              src={profile.avatar || profile.connectedPage?.avatar || "/images/avatar.jpg"}
              alt={profile.name}
              fill
              unoptimized={true}
              className="object-cover group-hover/avatar:scale-105 transition-transform"
              sizes="80px"
              priority
            />
            {/* Camera Overlay */}
            <label className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer z-10">
              <Camera className="w-5 h-5 mb-0.5" />
              <span className="text-[9px] font-bold">Change</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleAvatarUpload(e, false)}
                disabled={isUploadingAvatar}
                className="hidden"
              />
            </label>
            {isUploadingAvatar && (
              <div className="absolute inset-0 bg-slate-900/75 flex flex-col items-center justify-center text-white z-20">
                <Loader2 className="w-5 h-5 animate-spin text-[#00E5FF]" />
                <span className="text-[8px] font-bold mt-1 text-center">Uploading...</span>
              </div>
            )}
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
            <div className="text-xs text-slate-400 pt-0.5">
              Client ID: <span className="font-mono text-slate-700 font-semibold">CL-88910</span>
            </div>

            {/* Cloudinary Upload Action */}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F6F8FC] hover:bg-[#EEF4FF] text-[#0866FF] border border-[#D8E4FC] hover:border-[#0866FF]/40 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-3xs">
                {isUploadingAvatar ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Uploading to Cloud...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Upload Profile Photo</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleAvatarUpload(e, false)}
                  disabled={isUploadingAvatar}
                  className="hidden"
                />
              </label>
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                Cloudinary Cloud Asset
              </span>
            </div>

            {/* Feedback Notifications */}
            {avatarUploadSuccess && (
              <div className="mt-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl flex items-center gap-2 animate-in fade-in">
                <Check className="w-3.5 h-3.5 shrink-0" />
                <span>{avatarUploadSuccess}</span>
              </div>
            )}
            {avatarUploadError && (
              <div className="mt-2 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{avatarUploadError}</span>
              </div>
            )}
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-[#172033] flex items-center gap-2">
                  <Globe className="w-4 h-4 text-[#0866FF]" />
                  Connected Facebook Page & Ad Assets
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Your All Boost dashboard, campaign reports, and Meta Graph API analytics link directly to this Facebook Page.
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#E8F8F2] text-[#12A875] text-xs font-bold rounded-lg self-start sm:self-auto">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Active Meta Link
              </span>
            </div>

            {/* Live Facebook Card Preview */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-[#F6F8FC] to-[#EEF4FF] border border-[#D8E4FC] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {connectedPage.avatar ? (
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden ring-2 ring-[#0866FF]/30 shrink-0 shadow-sm bg-slate-100">
                    <Image
                      src={connectedPage.avatar}
                      alt={connectedPage.name}
                      fill
                      unoptimized={true}
                      className="object-cover"
                      sizes="48px"
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-[#0866FF] text-white flex items-center justify-center font-black text-xl shadow-sm shrink-0">
                    f
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#172033]">
                      {connectedPage.name || "Enter Page Name"}
                    </span>
                    <span className="w-2 h-2 rounded-full bg-[#12A875]" title="Connected" />
                  </div>
                  <div className="text-xs text-slate-600 font-medium">
                    {connectedPage.category} • <span className="font-bold text-[#0866FF]">{connectedPage.followers}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                    Page ID: {connectedPage.id}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-3xs transition-colors cursor-pointer">
                  {isUploadingPageLogo ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0866FF]" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-3.5 h-3.5 text-[#0866FF]" />
                      <span>Upload Page Logo</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleAvatarUpload(e, true)}
                    disabled={isUploadingPageLogo}
                    className="hidden"
                  />
                </label>
                <button
                  type="button"
                  onClick={handleSyncWithFacebook}
                  disabled={isSyncingFb}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0866FF] hover:bg-[#0052CC] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-60"
                  title="Detect real followers count, page logo, and details directly from Facebook"
                >
                  {isSyncingFb ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Detecting...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Sync Real Facebook Data</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Sync Feedback Message */}
            {syncFeedback && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">{syncFeedback}</span>
              </div>
            )}

            {/* Edit Facebook Page Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Facebook Page Name *
                </label>
                <input
                  type="text"
                  value={connectedPage.name}
                  onChange={(e) => setConnectedPage({ ...connectedPage, name: e.target.value })}
                  placeholder="e.g. Min Mart BD, Aarong Silk"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E7ECF3] focus:border-[#0866FF] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Facebook Page ID or Link
                </label>
                <input
                  type="text"
                  value={connectedPage.id}
                  onChange={(e) => setConnectedPage({ ...connectedPage, id: e.target.value })}
                  placeholder="e.g. 110132735345674 or page link"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E7ECF3] focus:border-[#0866FF] focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Page Business Category
                </label>
                <select
                  value={connectedPage.category}
                  onChange={(e) => setConnectedPage({ ...connectedPage, category: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E7ECF3] focus:border-[#0866FF] focus:outline-none cursor-pointer"
                >
                  <option value="Shopping & Retail">Shopping & Retail / E-commerce</option>
                  <option value="Clothing & Apparel">Clothing & Fashion</option>
                  <option value="Electronics & Gadgets">Electronics & Gadgets</option>
                  <option value="Beauty & Cosmetics">Beauty & Cosmetics</option>
                  <option value="Food & Restaurant">Food & Restaurant</option>
                  <option value="Jewelry & Accessories">Jewelry & Accessories</option>
                  <option value="Digital Agency & Services">Digital Agency & Services</option>
                  <option value="Health & Medical">Health & Medical</option>
                  <option value="Other Business">Other Business</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Page Followers Count
                </label>
                <input
                  type="text"
                  value={connectedPage.followers}
                  onChange={(e) => setConnectedPage({ ...connectedPage, followers: e.target.value })}
                  placeholder="e.g. 18.5K followers"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E7ECF3] focus:border-[#0866FF] focus:outline-none"
                />
              </div>
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
              <h4 className="text-sm font-bold text-white mt-1">Shopno IT Specialist</h4>
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
