"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  ExternalLink,
  ThumbsUp,
  MessageCircle,
  Share2,
  CheckCircle,
  Globe,
  MoreHorizontal,
  Eye,
  AlertCircle,
  Loader2,
  Sparkles,
} from "lucide-react";

interface FacebookPostPreviewProps {
  postUrl: string;
  pageName?: string;
  pageAvatar?: string;
  thumbnail?: string;
  campaignName?: string;
  objective?: string;
  compact?: boolean;
}

interface PostMetadata {
  pageName: string;
  title: string;
  description: string;
  image: string | null;
  url: string;
}

export const FacebookPostPreview: React.FC<FacebookPostPreviewProps> = ({
  postUrl,
  pageName = "Facebook Page",
  pageAvatar = "/images/profile-avatar.jpg",
  thumbnail = "/images/winter-collection.jpg",
  campaignName = "",
  objective = "Messages",
  compact = false,
}) => {
  // Default to live embed or dynamic mockup
  const [activeTab, setActiveTab] = useState<"embed" | "mockup">("embed");
  const [metadata, setMetadata] = useState<PostMetadata | null>(null);
  const [isLoadingMeta, setIsLoadingMeta] = useState(false);

  // Validate if input is a plausible Facebook link
  const isFbLink =
    postUrl.trim().length > 0 &&
    (postUrl.includes("facebook.com") ||
      postUrl.includes("fb.watch") ||
      postUrl.includes("fb.me") ||
      postUrl.includes("fb.com"));

  // Fetch real post OpenGraph metadata from our server API
  useEffect(() => {
    if (!postUrl.trim() || !isFbLink) {
      setMetadata(null);
      return;
    }

    let isMounted = true;
    setIsLoadingMeta(true);

    fetch(`/api/fetch-post-meta?url=${encodeURIComponent(postUrl.trim())}`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.success && data.data) {
          setMetadata(data.data);
        }
      })
      .catch((err) => {
        console.warn("Could not fetch Facebook post metadata:", err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingMeta(false);
      });

    return () => {
      isMounted = false;
    };
  }, [postUrl, isFbLink]);

  // Extract post ID or identifier from URL
  const getPostIdentifier = (url: string) => {
    try {
      const parsed = new URL(url);
      const parts = parsed.pathname.split("/").filter(Boolean);
      if (parts.includes("posts") && parts.length > parts.indexOf("posts") + 1) {
        return `Post #${parts[parts.indexOf("posts") + 1]}`;
      }
      if (parts.includes("videos") && parts.length > parts.indexOf("videos") + 1) {
        return `Video #${parts[parts.indexOf("videos") + 1]}`;
      }
      if (parts.includes("photos") && parts.length > parts.indexOf("photos") + 1) {
        return `Photo #${parts[parts.indexOf("photos") + 1]}`;
      }
      if (parts.length > 0) {
        return parts[parts.length - 1];
      }
      return "Facebook Post";
    } catch {
      return "Facebook Post";
    }
  };

  if (!postUrl.trim()) {
    return (
      <div className="p-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 text-center space-y-2">
        <div className="w-9 h-9 rounded-full bg-[#EBF2FF] text-[#0866FF] flex items-center justify-center mx-auto">
          <Eye className="w-4 h-4" />
        </div>
        <p className="text-xs font-semibold text-slate-700">Live Facebook Post Preview</p>
        <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
          Paste a Facebook post link above to see the real post content and how your ad will appear.
        </p>
      </div>
    );
  }

  if (!isFbLink) {
    return (
      <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/70 flex items-start gap-2.5 text-xs text-amber-800">
        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Not a recognized Facebook URL:</span>
          <p className="text-[11px] text-amber-700 mt-0.5">
            Please provide a valid Facebook link (e.g.{" "}
            <span className="font-mono">https://www.facebook.com/yourpage/posts/123456789</span>).
          </p>
        </div>
      </div>
    );
  }

  // Official Facebook Post Plugin Iframe Embed
  const fbEmbedIframeUrl = `https://www.facebook.com/plugins/post.php?href=${encodeURIComponent(
    postUrl
  )}&width=500&show_text=true&appId=`;

  // Display values prioritizing real scraped metadata
  const effectivePageName = metadata?.pageName || pageName;
  const effectiveCaption =
    metadata?.description ||
    metadata?.title ||
    campaignName ||
    "Check out this official Facebook post.";
  const effectiveImage = metadata?.image || thumbnail;

  return (
    <div className="rounded-2xl border border-[#E2E8F0] bg-white shadow-sm overflow-hidden transition-all">
      {/* Preview Header & Controls */}
      <div className="px-4 py-3 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[#0866FF] flex items-center justify-center text-white shrink-0">
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#121826]">
              {getPostIdentifier(postUrl)}
            </span>
            {isLoadingMeta ? (
              <span className="inline-flex items-center gap-1 text-[10px] text-[#0866FF] bg-[#EBF2FF] px-2 py-0.5 rounded-full font-semibold animate-pulse">
                <Loader2 className="w-3 h-3 animate-spin" />
                Reading Post...
              </span>
            ) : metadata?.title || metadata?.description ? (
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Live Post Synced
              </span>
            ) : (
              <span className="text-[10px] text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded-full">
                Meta Post Link
              </span>
            )}
          </div>
        </div>

        {/* View mode toggle + External link button */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-200/70 p-0.5 rounded-lg flex text-[11px] font-semibold text-slate-600">
            <button
              type="button"
              onClick={() => setActiveTab("embed")}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                activeTab === "embed"
                  ? "bg-white text-[#0866FF] shadow-xs font-bold"
                  : "hover:text-slate-900"
              }`}
            >
              🌐 Live Facebook Post
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("mockup")}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                activeTab === "mockup"
                  ? "bg-white text-[#0866FF] shadow-xs font-bold"
                  : "hover:text-slate-900"
              }`}
            >
              📱 Ad Feed Preview
            </button>
          </div>

          <a
            href={postUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0866FF] hover:bg-[#EEF2FF] px-2.5 py-1 rounded-lg border border-[#0866FF]/20 transition-colors"
            title="Open exact post on Facebook in a new tab"
          >
            <span>Open on FB</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Mode 1: Real Official Facebook Post Embed */}
      {activeTab === "embed" && (
        <div className="p-4 sm:p-6 bg-[#F0F2F5] flex flex-col items-center">
          <div className="w-full max-w-[500px] bg-white rounded-2xl shadow-sm overflow-hidden border border-[#E4E6EB] min-h-[380px] flex items-center justify-center relative">
            <iframe
              src={fbEmbedIframeUrl}
              width="100%"
              height="480"
              style={{ border: "none", overflow: "hidden" }}
              scrolling="no"
              frameBorder="0"
              allowFullScreen={true}
              allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
              title="Official Facebook Post Embed"
              className="w-full"
            />
          </div>
          <div className="mt-3 text-center max-w-md">
            <p className="text-[11px] text-slate-500">
              ⚡ This is the real, live Facebook post rendered directly from Meta&apos;s servers.
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              (Note: If the Facebook post privacy is set to private, friends-only, or country-restricted, use the &apos;Ad Feed Preview&apos; tab or click &apos;Open on FB&apos;).
            </p>
          </div>
        </div>
      )}

      {/* Mode 2: Realistic Meta Feed Ad Mockup with Dynamic Metadata */}
      {activeTab === "mockup" && (
        <div className="p-4 sm:p-5 bg-slate-50 flex justify-center">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-[#E4E6EB] overflow-hidden text-[#050505] text-xs">
            {/* Post Header */}
            <div className="p-3 sm:p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="relative w-9 h-9 rounded-full overflow-hidden bg-slate-200 ring-1 ring-black/5 shrink-0 flex items-center justify-center font-bold text-[#0866FF]">
                  {pageAvatar && !pageAvatar.includes("profile-avatar") ? (
                    <Image
                      src={pageAvatar}
                      alt={effectivePageName}
                      fill
                      className="object-cover"
                      sizes="36px"
                    />
                  ) : (
                    <span>{effectivePageName.charAt(0)}</span>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1 font-bold text-sm text-[#050505] leading-tight">
                    <span>{effectivePageName}</span>
                    <CheckCircle className="w-3.5 h-3.5 text-[#0866FF] fill-[#0866FF] text-white" />
                  </div>
                  <div className="text-[11px] text-[#65676B] flex items-center gap-1 mt-0.5">
                    <span className="font-semibold text-slate-700">Sponsored</span>
                    <span>•</span>
                    <Globe className="w-3 h-3 text-[#65676B]" />
                  </div>
                </div>
              </div>

              <div className="text-[#65676B] p-1.5 rounded-full hover:bg-slate-100 cursor-pointer">
                <MoreHorizontal className="w-4 h-4" />
              </div>
            </div>

            {/* Dynamic Post Caption */}
            <div className="px-3.5 pb-3 text-xs sm:text-[13px] text-[#050505] leading-relaxed">
              <p className="font-medium whitespace-pre-line line-clamp-4">
                {effectiveCaption}
              </p>
            </div>

            {/* Post Creative Image (Real or fallback) */}
            <div className="relative w-full aspect-[4/3] bg-slate-100 overflow-hidden border-y border-[#E4E6EB] flex items-center justify-center">
              {effectiveImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={effectiveImage}
                  alt="Post Creative"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="text-center p-6 text-slate-400">
                  <Eye className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">Post Creative Image</p>
                </div>
              )}
              <div className="absolute top-2.5 right-2.5 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>Sponsored Ad</span>
              </div>
            </div>

            {/* Call To Action Bar */}
            <div className="p-3 bg-[#F0F2F5] flex items-center justify-between gap-3 border-b border-[#E4E6EB]">
              <div className="min-w-0">
                <div className="text-[10px] text-[#65676B] uppercase tracking-wide truncate">
                  {effectivePageName.toLowerCase().replace(/\s+/g, "")}.com
                </div>
                <div className="text-xs font-bold text-[#050505] truncate">
                  {objective === "Messages"
                    ? "Chat with us on WhatsApp & Messenger"
                    : objective === "Traffic"
                    ? "Visit Official Online Store"
                    : objective === "Leads"
                    ? "Sign Up & Get Special Offer"
                    : "Exclusive Limited Promotion"}
                </div>
              </div>

              <div className="shrink-0">
                <span className="px-3 py-1.5 bg-[#0866FF] text-white text-xs font-bold rounded-lg shadow-2xs inline-flex items-center gap-1 transition-colors">
                  {objective === "Messages"
                    ? "Send Message"
                    : objective === "Traffic"
                    ? "Shop Now"
                    : objective === "Leads"
                    ? "Apply Now"
                    : "Learn More"}
                </span>
              </div>
            </div>

            {/* Interaction Footer */}
            <div className="px-3 py-2 flex items-center justify-between text-[11px] text-[#65676B]">
              <div className="flex items-center gap-1.5">
                <div className="flex -space-x-1">
                  <span className="w-4 h-4 rounded-full bg-[#1877F2] text-white flex items-center justify-center text-[9px] shadow-xs">
                    👍
                  </span>
                  <span className="w-4 h-4 rounded-full bg-[#FA3E3E] text-white flex items-center justify-center text-[9px] shadow-xs">
                    ❤️
                  </span>
                </div>
                <span className="font-semibold text-slate-700">120+</span>
              </div>
              <div className="flex items-center gap-3">
                <span>Comments</span>
                <span>•</span>
                <span>Shares</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="px-3 py-1 border-t border-[#E4E6EB] grid grid-cols-3 text-center text-[#65676B] font-semibold text-xs">
              <div className="py-1.5 flex items-center justify-center gap-1.5 hover:bg-slate-100 rounded-lg cursor-pointer">
                <ThumbsUp className="w-3.5 h-3.5" />
                <span>Like</span>
              </div>
              <div className="py-1.5 flex items-center justify-center gap-1.5 hover:bg-slate-100 rounded-lg cursor-pointer">
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Comment</span>
              </div>
              <div className="py-1.5 flex items-center justify-center gap-1.5 hover:bg-slate-100 rounded-lg cursor-pointer">
                <Share2 className="w-3.5 h-3.5" />
                <span>Share</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
