"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePortal } from "@/context/PortalContext";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { OrderDetailsModal } from "@/components/modals/OrderDetailsModal";
import { RenewOrderModal } from "@/components/modals/RenewOrderModal";
import { SupportModal } from "@/components/modals/SupportModal";
import { NotificationDrawer } from "./NotificationDrawer";
import { AnimatedToast, ToastData } from "@/components/ui/AnimatedToast";

interface DashboardLayoutProps {
  children: React.ReactNode;
  pageTitle?: string;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  pageTitle = "Dashboard",
}) => {
  const router = useRouter();
  const { isAuthenticated, isAuthLoading } = usePortal();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [landingToast, setLandingToast] = useState<ToastData | null>(null);

  // Check for post-login/register welcome toast or unauthorized admin attempt
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("scit_auth_toast");
      if (stored) {
        sessionStorage.removeItem("scit_auth_toast");
        const parsed = JSON.parse(stored);
        setLandingToast(parsed);
      }
    } catch {}

    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("unauthorized") === "admin_restricted") {
        setLandingToast({
          type: "error",
          title: "Access Restricted ⛔",
          message: "Client accounts are not authorized to access the Admin Operations Console.",
          duration: 5000,
        });
        window.history.replaceState({}, "", window.location.pathname);
      }
    }
  }, []);

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthLoading, isAuthenticated, router]);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-[#0866FF] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-400 font-medium">Checking session...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex bg-[#EEF1F7]">
      {/* Sidebar (Desktop Fixed & Mobile Drawer) */}
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col md:ml-[260px] min-w-0 min-h-screen">
        <Header
          onMobileMenuToggle={() => setMobileMenuOpen((prev) => !prev)}
          pageTitle={pageTitle}
        />

        <main className="flex-1 px-3.5 sm:px-6 lg:px-8 py-4 sm:py-6 w-full animate-in fade-in duration-200 max-w-[1600px] mx-auto">
          {children}
        </main>
      </div>

      {/* Global Interactive Modals & Drawers */}
      <OrderDetailsModal />
      <RenewOrderModal />
      <SupportModal />
      <NotificationDrawer isAdmin={false} />

      {/* Landing Toast Notification */}
      <AnimatedToast toast={landingToast} onClose={() => setLandingToast(null)} />
    </div>
  );
};
