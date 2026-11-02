"use client";

import React, { useState, useEffect } from "react";

// Deterministic initials generator
export function getAvatarInitials(name: string): string {
  if (!name) return "CL";
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

// Deterministic vibrant gradient based on name string
export function getAvatarGradient(name: string): string {
  const gradients = [
    "from-blue-600 to-indigo-600",
    "from-indigo-600 to-purple-600",
    "from-purple-600 to-pink-600",
    "from-emerald-500 to-teal-600",
    "from-cyan-500 to-blue-600",
    "from-amber-500 to-orange-600",
    "from-rose-500 to-red-600",
    "from-violet-600 to-indigo-700",
  ];
  let hash = 0;
  for (let i = 0; i < (name || "").length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return gradients[Math.abs(hash) % gradients.length];
}

/**
 * Optimizes image URLs for cross-browser reliability.
 * Converts Cloudinary .avif to .png and adds /f_auto,q_auto/ to ensure universal
 * rendering across all Windows, macOS, Android, and iOS browsers.
 */
export function optimizeAvatarUrl(url?: string | null): string {
  if (!url || typeof url !== "string") return "";
  let clean = url.trim();
  if (!clean) return "";

  // Cloudinary optimization
  if (clean.includes("res.cloudinary.com")) {
    // Some browsers on Windows fail to decode .avif natively; Cloudinary converts on-the-fly to .png
    if (clean.endsWith(".avif")) {
      clean = clean.replace(/\.avif$/, ".png");
    }

    // Insert automatic format & compression if not already present
    if (!clean.includes("/f_auto") && clean.includes("/image/upload/")) {
      clean = clean.replace("/image/upload/", "/image/upload/f_auto,q_auto/");
    }
  }

  return clean;
}

export interface ClientAvatarProps {
  avatarUrl?: string | null;
  fallbackUrl?: string | null;
  name: string;
  className?: string;
  textSize?: string;
  title?: string;
}

/**
 * Universal Avatar component for Clients, Staff, and Brand logos.
 * Handles Cloudinary, Facebook CDN images, local paths, and fallback initials.
 */
export function ClientAvatar({
  avatarUrl,
  fallbackUrl,
  name,
  className = "w-12 h-12 rounded-2xl",
  textSize = "text-base",
  title,
}: ClientAvatarProps) {
  const primary = optimizeAvatarUrl(avatarUrl);
  const secondary = optimizeAvatarUrl(fallbackUrl);

  const [currentSrc, setCurrentSrc] = useState<string | null>(primary || secondary || null);
  const [hasTriedSecondary, setHasTriedSecondary] = useState<boolean>(false);
  const [failed, setFailed] = useState<boolean>(false);

  // Synchronize whenever avatarUrl or fallbackUrl prop changes
  useEffect(() => {
    const p = optimizeAvatarUrl(avatarUrl);
    const s = optimizeAvatarUrl(fallbackUrl);
    setCurrentSrc(p || s || null);
    setHasTriedSecondary(false);
    setFailed(false);
  }, [avatarUrl, fallbackUrl]);

  const initials = getAvatarInitials(name);
  const gradient = getAvatarGradient(name);

  const handleError = () => {
    if (!hasTriedSecondary && secondary && currentSrc !== secondary) {
      setHasTriedSecondary(true);
      setCurrentSrc(secondary);
    } else {
      setFailed(true);
    }
  };

  if (currentSrc && !failed) {
    return (
      <div
        className={`relative ${className} overflow-hidden shrink-0 shadow-xs bg-slate-100 border border-slate-200/80 flex items-center justify-center`}
        title={title || name}
      >
        <img
          src={currentSrc}
          alt={name}
          className="w-full h-full object-cover"
          onError={handleError}
          referrerPolicy="no-referrer"
          crossOrigin="anonymous"
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div
      className={`relative ${className} bg-gradient-to-tr ${gradient} flex items-center justify-center text-white font-black ${textSize} shadow-xs shrink-0 select-none`}
      title={title || name}
    >
      {initials}
    </div>
  );
}

export default ClientAvatar;

