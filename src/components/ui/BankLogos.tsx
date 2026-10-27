import React from "react";

interface LogoProps {
  className?: string;
  alt?: string;
}

/**
 * Real official City Bank PLC logo from public/images/banks/city-bank-logo-1.webp
 */
export const CityBankLogo: React.FC<LogoProps> = ({
  className = "w-6 h-6",
  alt = "City Bank",
}) => (
  <div className={`relative flex items-center justify-center shrink-0 overflow-hidden ${className}`}>
    <img
      src="/images/banks/city-bank-logo-1.webp"
      alt={alt}
      className="w-full h-full object-contain"
      loading="eager"
    />
  </div>
);

/**
 * Real official BRAC Bank PLC logo from public/images/banks/brac-bank-1.webp
 */
export const BracBankLogo: React.FC<LogoProps> = ({
  className = "w-6 h-6",
  alt = "BRAC Bank",
}) => (
  <div className={`relative flex items-center justify-center shrink-0 overflow-hidden ${className}`}>
    <img
      src="/images/banks/brac-bank-1.webp"
      alt={alt}
      className="w-full h-full object-contain"
      loading="eager"
    />
  </div>
);

/**
 * Real official Dutch-Bangla Bank (DBBL) logo from public/images/banks/dbbl-1.webp
 */
export const DbblLogo: React.FC<LogoProps> = ({
  className = "w-6 h-6",
  alt = "Dutch-Bangla Bank",
}) => (
  <div className={`relative flex items-center justify-center shrink-0 overflow-hidden ${className}`}>
    <img
      src="/images/banks/dbbl-1.webp"
      alt={alt}
      className="w-full h-full object-contain"
      loading="eager"
    />
  </div>
);

/**
 * Real official bKash vector logo from public/images/banks/bKash-logo.svg
 */
export const BkashLogo: React.FC<LogoProps> = ({
  className = "w-6 h-6",
  alt = "bKash",
}) => (
  <div className={`relative flex items-center justify-center shrink-0 overflow-hidden ${className}`}>
    <img
      src="/images/banks/bKash-logo.svg"
      alt={alt}
      className="w-full h-full object-contain"
      loading="eager"
    />
  </div>
);

/**
 * Real official Nagad vector logo from public/images/banks/Nagad-Logo.wine.svg
 */
export const NagadLogo: React.FC<LogoProps> = ({
  className = "w-6 h-6",
  alt = "Nagad",
}) => (
  <div className={`relative flex items-center justify-center shrink-0 overflow-hidden ${className}`}>
    <img
      src="/images/banks/Nagad-Logo.wine.svg"
      alt={alt}
      className="w-full h-full object-contain"
      loading="eager"
    />
  </div>
);
