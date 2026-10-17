import React from "react";

export const CityBankLogo: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
    <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="20" fill="#E61E24" />
      {/* City Bank Diamond Emblem */}
      <path d="M50 16L82 50L50 84L18 50Z" fill="#FFFFFF" />
      <path d="M50 26L74 50L50 74L26 50Z" fill="#0B2B67" />
      <path d="M50 36L64 50L50 64L36 50Z" fill="#E61E24" />
    </svg>
  </div>
);

export const BracBankLogo: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
    <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="20" fill="#005CA9" />
      {/* BRAC Bank Yellow Triangle Mark */}
      <path d="M22 24L78 24L50 76Z" fill="#FDB913" />
      <path d="M35 34L65 34L50 62Z" fill="#005CA9" />
    </svg>
  </div>
);

export const DbblLogo: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
    <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="20" fill="#008751" />
      {/* DBBL Banyan Leaf Emblem */}
      <circle cx="50" cy="50" r="34" fill="#FFFFFF" />
      <circle cx="50" cy="50" r="28" fill="#008751" />
      <path
        d="M50 28C42 36 34 44 42 58C46 65 54 65 58 58C66 44 58 36 50 28Z"
        fill="#E31B23"
      />
    </svg>
  </div>
);

export const BkashLogo: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
    <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="20" fill="#E2136E" />
      {/* bKash Origami Bird */}
      <path d="M24 64L44 32L68 46L46 72Z" fill="#FFFFFF" fillOpacity="0.95" />
      <path d="M44 32L76 26L68 46Z" fill="#FFFFFF" fillOpacity="0.75" />
    </svg>
  </div>
);

export const NagadLogo: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
    <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="20" fill="#ED1C24" />
      {/* Nagad Gold Coin Flame */}
      <circle cx="50" cy="50" r="28" fill="#F7941D" />
      <circle cx="50" cy="50" r="18" fill="#FFFFFF" />
      <path d="M50 24C46 36 40 44 50 62C58 48 54 36 50 24Z" fill="#ED1C24" />
    </svg>
  </div>
);
