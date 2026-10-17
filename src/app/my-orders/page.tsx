"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Search,
  Filter,
  PlusCircle,
  ExternalLink,
  Repeat,
  MoreVertical,
  Calendar,
  DollarSign,
  ArrowUpDown,
  Eye,
  SlidersHorizontal,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { usePortal } from "@/context/PortalContext";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { OrderStatus, Order } from "@/types";

export default function MyOrdersPage() {
  const {
    orders,
    setSelectedOrderForModal,
    setSelectedOrderForRenew,
    setIsRenewModalOpen,
  } = usePortal();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const statuses = ["All", "Active", "Pending", "Confirmed", "Paused", "Completed", "Rejected"];

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        order.campaignName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (order.transactionId && order.transactionId.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus = statusFilter === "All" || order.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, searchQuery, statusFilter]);

  return (
    <DashboardLayout pageTitle="My Orders">
      <div className="space-y-6">
        {/* Page Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#172033] tracking-tight">
              Order Management
            </h1>
            <p className="text-xs sm:text-sm text-[#667085] mt-1">
              Track the progress, payment verification, and performance of all your boost orders.
            </p>
          </div>

          <Link
            href="/create-order"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0866FF] hover:bg-[#0052CC] text-white text-xs font-bold rounded-xl shadow-xs transition-colors self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create New Boost</span>
          </Link>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-[#E7ECF3] shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Order ID (#AD-1001), campaign name..."
                className="w-full bg-[#F6F8FC] focus:bg-white text-xs text-[#172033] pl-10 pr-4 py-2.5 rounded-xl border border-transparent focus:border-[#0866FF] focus:outline-none transition-all"
              />
            </div>

            <div className="text-xs text-slate-500 font-medium">
              Showing <span className="font-bold text-[#172033]">{filteredOrders.length}</span> of {orders.length} orders
            </div>
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-t border-slate-100 pt-3">
            {statuses.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  statusFilter === s
                    ? "bg-[#0866FF] text-white shadow-2xs"
                    : "bg-[#F6F8FC] text-slate-600 hover:bg-slate-200/70"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Orders List / Table */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E7ECF3] p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-[#172033]">No orders match your criteria</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Try adjusting your search query or status filter to find the orders you are looking for.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("All");
              }}
              className="text-xs font-semibold text-[#0866FF] hover:underline"
            >
              Reset all filters
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#E7ECF3] shadow-2xs overflow-hidden">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E7ECF3] bg-[#F6F8FC]/60 text-[11px] font-semibold text-[#667085] uppercase tracking-wider">
                    <th className="py-3.5 px-6">Campaign & Post</th>
                    <th className="py-3.5 px-4">Date Placed</th>
                    <th className="py-3.5 px-4">Daily Budget</th>
                    <th className="py-3.5 px-4">Total (USD)</th>
                    <th className="py-3.5 px-4">Payment</th>
                    <th className="py-3.5 px-4">Ad Status</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E7ECF3] text-xs">
                  {filteredOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-[#F6F8FC]/60 transition-colors group"
                    >
                      {/* Post & Campaign */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="relative w-11 h-11 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                            <Image
                              src={order.thumbnail}
                              alt={order.campaignName}
                              fill
                              className="object-cover"
                              sizes="44px"
                            />
                          </div>
                          <div>
                            <div className="font-bold text-[#172033] group-hover:text-[#0866FF] transition-colors">
                              {order.campaignName}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              #{order.id} • {order.postType}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-4 px-4 text-slate-600 font-medium">
                        {order.createdAt}
                      </td>

                      {/* Daily Budget */}
                      <td className="py-4 px-4 font-semibold text-slate-800">
                        ${order.dailyBudgetUSD.toFixed(2)}/day
                      </td>

                      {/* Total */}
                      <td className="py-4 px-4 font-bold text-[#0866FF]">
                        ${order.totalBudgetUSD.toFixed(2)}
                      </td>

                      {/* Payment */}
                      <td className="py-4 px-4">
                        <StatusBadge status={order.paymentStatus} size="sm" />
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        <StatusBadge status={order.status} />
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedOrderForModal(order)}
                            className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-[#E7ECF3] text-slate-700 font-semibold rounded-lg shadow-2xs transition-colors"
                          >
                            View
                          </button>
                          {order.isEligibleForRenew && (
                            <button
                              onClick={() => {
                                setSelectedOrderForRenew(order);
                                setIsRenewModalOpen(true);
                              }}
                              className="px-2.5 py-1.5 text-[#0866FF] hover:bg-[#EBF2FF] rounded-lg font-semibold transition-colors"
                              title="Renew this campaign"
                            >
                              <Repeat className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-[#E7ECF3]">
              {filteredOrders.map((order) => (
                <div key={order.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                        <Image
                          src={order.thumbnail}
                          alt={order.campaignName}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-[#172033]">
                          {order.campaignName}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          #{order.id} • {order.createdAt}
                        </div>
                      </div>
                    </div>
                    <StatusBadge status={order.status} />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-[#F6F8FC] p-2.5 rounded-xl border border-[#E7ECF3]">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Budget</span>
                      <span className="font-semibold text-slate-800">${order.dailyBudgetUSD.toFixed(2)}/day</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Total USD</span>
                      <span className="font-bold text-[#0866FF]">${order.totalBudgetUSD.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1.5">
                      <StatusBadge status={order.paymentStatus} size="sm" />
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedOrderForModal(order)}
                        className="px-3.5 py-1.5 bg-white hover:bg-slate-100 border border-[#E7ECF3] text-xs font-semibold text-slate-800 rounded-lg shadow-2xs"
                      >
                        View Details
                      </button>
                      {order.isEligibleForRenew && (
                        <button
                          onClick={() => {
                            setSelectedOrderForRenew(order);
                            setIsRenewModalOpen(true);
                          }}
                          className="p-1.5 text-[#0866FF] hover:bg-[#EBF2FF] rounded-lg"
                        >
                          <Repeat className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
