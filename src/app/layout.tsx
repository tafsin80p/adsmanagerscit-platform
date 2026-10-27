import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { PortalProvider } from "@/context/PortalContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SHOPNO IT Ads Manager — Client Growth & Meta Ads Portal",
  description: "Enterprise SHOPNO IT Ads Manager portal for ordering Meta, Facebook & Instagram post boosts, tracking payments, and monitoring live campaign performance.",
  icons: {
    icon: [
      { url: "/favicon.svg?v=2", type: "image/svg+xml" },
      { url: "/images/favicon-round.png?v=2", type: "image/png", sizes: "512x512" },
      { url: "/favicon-32x32.png?v=2", type: "image/png", sizes: "32x32" },
      { url: "/favicon-16x16.png?v=2", type: "image/png", sizes: "16x16" },
      { url: "/favicon.ico?v=2" },
    ],
    shortcut: "/images/favicon-round.png?v=2",
    apple: [
      { url: "/apple-touch-icon.png?v=2", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body
        className="min-h-full flex flex-col font-sans bg-[#EEF1F7] text-[#121826] selection:bg-[#3858F6]/15 selection:text-[#3858F6]"
        suppressHydrationWarning
      >
        <PortalProvider>{children}</PortalProvider>
      </body>
    </html>
  );
}
