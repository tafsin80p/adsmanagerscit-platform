"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePortal } from "@/context/PortalContext";
import { AdminSidebar } from "./AdminSidebar";
import { AdminHeader } from "./AdminHeader";
import { OrderDetailsModal } from "@/components/modals/OrderDetailsModal";
import { RenewOrderModal } from "@/components/modals/RenewOrderModal";
import { SupportModal } from "@/components/modals/SupportModal";
import { NotificationDrawer } from "./NotificationDrawer";
import { AnimatedToast, ToastData } from "@/components/ui/AnimatedToast";

interface AdminLayoutProps {
  children: React.ReactNode;
  pageTitle?: string;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  pageTitle = "Admin Operations Console",
}) => {
  const router = useRouter();
  const { profile, isAuthenticated, isAuthLoading } = usePortal();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [landingToast, setLandingToast] = useState<ToastData | null>(null);

  // Check for post-login welcome toast
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("scit_auth_toast");
      if (stored) {
        sessionStorage.removeItem("scit_auth_toast");
        const parsed = JSON.parse(stored);
        setLandingToast(parsed);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (!isAuthLoading) {
      if (!isAuthenticated || profile.role !== "Specialist") {
        router.replace("/admin/login");
      }
    }
  }, [isAuthLoading, isAuthenticated, profile.role, router]);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-[#3858F6] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-400 font-medium">Verifying admin session...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || profile.role !== "Specialist") {
    return null;
  }

  return (
    <div className="min-h-screen flex bg-[#EEF1F7]">
      {/* Admin Sidebar (Desktop Fixed 240px & Mobile Drawer) */}
      <AdminSidebar
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      {/* Main Admin Workspace */}
      <div className="flex-1 flex flex-col md:ml-[260px] min-w-0 min-h-screen">
        <AdminHeader
          onMobileMenuToggle={() => setMobileMenuOpen((prev) => !prev)}
          pageTitle={pageTitle}
        />

        <main className="flex-1 px-3.5 sm:px-6 lg:px-8 py-4 sm:py-6 w-full animate-in fade-in duration-200 max-w-[1600px] mx-auto">
          {children}
        </main>
      </div>

      {/* Global Modals & Drawers */}
      <OrderDetailsModal />
      <RenewOrderModal />
      <SupportModal />
      <NotificationDrawer isAdmin={true} />

      {/* Landing Toast Notification */}
      <AnimatedToast toast={landingToast} onClose={() => setLandingToast(null)} />
    </div>
  );
};
