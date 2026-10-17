"use client";

import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { OrderDetailsModal } from "@/components/modals/OrderDetailsModal";
import { RenewOrderModal } from "@/components/modals/RenewOrderModal";
import { SupportModal } from "@/components/modals/SupportModal";

interface DashboardLayoutProps {
  children: React.ReactNode;
  pageTitle?: string;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  pageTitle = "Dashboard",
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-[#F6F8FC]">
      {/* Sidebar (Desktop Fixed & Mobile Drawer) */}
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col md:ml-[240px] min-w-0 min-h-screen transition-all">
        <Header
          onMobileMenuToggle={() => setMobileMenuOpen((prev) => !prev)}
          pageTitle={pageTitle}
        />

        <main className="flex-1 px-3 sm:px-5 md:px-6 py-4 sm:py-5 w-full animate-in fade-in duration-200">
          {children}
        </main>
      </div>

      {/* Global Interactive Modals */}
      <OrderDetailsModal />
      <RenewOrderModal />
      <SupportModal />
    </div>
  );
};
