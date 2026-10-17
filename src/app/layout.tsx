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
  title: "Meta Ads Management Portal — Client Dashboard",
  description: "Enterprise Meta Ads Management Portal for ordering Facebook & Instagram boosts, tracking payments, and monitoring live campaign performance.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <body
        className="min-h-full flex flex-col font-sans bg-[#F6F8FC] text-[#172033] selection:bg-[#0866FF]/15 selection:text-[#0866FF]"
        suppressHydrationWarning
      >
        <PortalProvider>{children}</PortalProvider>
      </body>
    </html>
  );
}
