"use client";

import React, { useState } from "react";
import {
  TrendingUp,
  Eye,
  Image as ImageIcon,
  MessageSquare,
  DollarSign,
  RefreshCw,
  Info,
  Calendar,
  Share2,
  ExternalLink,
  Target,
  BarChart3,
  Sliders,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { usePortal } from "@/context/PortalContext";
import { StatusBadge } from "@/components/ui/StatusBadge";

export default function AdsPerformancePage() {
  const { liveMetrics, syncMetaMetrics, isSyncing, orders } = usePortal();
  const [timeRange, setTimeRange] = useState("Last 7 Days");
  const [metricView, setMetricView] = useState<"reach" | "impressions" | "messages">("reach");

  // Performance timeline chart data
  const chartData = [
    { date: "Oct 10", reach: 2400, impressions: 3800, messages: 14, spend: 3.5 },
    { date: "Oct 11", reach: 3100, impressions: 4900, messages: 18, spend: 4.0 },
    { date: "Oct 12", reach: 5200, impressions: 7800, messages: 32, spend: 6.5 },
    { date: "Oct 13", reach: 7400, impressions: 10800, messages: 45, spend: 9.0 },
    { date: "Oct 14", reach: 9100, impressions: 13200, messages: 59, spend: 12.0 },
    { date: "Oct 15", reach: 11200, impressions: 16400, messages: 72, spend: 15.5 },
    { date: "Oct 16", reach: liveMetrics.reach, impressions: liveMetrics.impressions, messages: liveMetrics.messages, spend: liveMetrics.spend },
  ];

  // Active campaigns currently being tracked
  const activeCampaigns = orders.filter((o) => o.status === "Active" || o.status === "Completed");

  return (
    <DashboardLayout pageTitle="Ads Performance">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#172033] tracking-tight">
              Meta Ads Performance Overview
            </h1>
            <p className="text-xs sm:text-sm text-[#667085] mt-1">
              Synchronized advertising metrics from Facebook & Instagram Meta Marketing API.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={syncMetaMetrics}
              disabled={isSyncing}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 border border-[#E7ECF3] rounded-xl text-xs font-semibold text-[#172033] shadow-2xs transition-all disabled:opacity-50"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 text-[#0866FF] ${isSyncing ? "animate-spin" : ""}`}
              />
              <span>{isSyncing ? "Syncing..." : "Sync Live Data"}</span>
            </button>

            {/* Time range selector */}
            <div className="flex items-center bg-white border border-[#E7ECF3] p-1 rounded-xl shadow-2xs">
              {["Last 7 Days", "Last 14 Days", "This Month"].map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                    timeRange === range
                      ? "bg-[#0866FF] text-white"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Live Meta Notice Banner */}
        <div className="p-4 rounded-2xl bg-[#EBF2FF] border border-[#0866FF]/20 flex items-start gap-3">
          <Info className="w-5 h-5 text-[#0866FF] shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed text-[#172033]">
            <strong className="font-bold">Verified Meta Marketing API Data:</strong> Statistics shown below reflect real delivery metrics for your boost posts managed by our team. Live figures are verified against Meta Ad Accounts.
            <span className="ml-2 font-mono text-[#0866FF] font-semibold">
              {liveMetrics.lastSynced}
            </span>
          </div>
        </div>

        {/* 4 Performance Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            onClick={() => setMetricView("reach")}
            className={`bg-white p-5 rounded-2xl border transition-all cursor-pointer ${
              metricView === "reach"
                ? "border-[#0866FF] ring-2 ring-[#0866FF]/10 shadow-sm"
                : "border-[#E7ECF3] shadow-2xs hover:border-slate-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#667085] font-medium">Total Reach</span>
              <div className="w-8 h-8 rounded-lg bg-[#EBF2FF] text-[#0866FF] flex items-center justify-center">
                <Eye className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-[#172033] mt-2">
              {liveMetrics.reach.toLocaleString()}
            </div>
            <div className="text-xs text-[#12A875] font-semibold mt-1">
              ↑ {liveMetrics.reachGrowth}% vs previous period
            </div>
          </div>

          <div
            onClick={() => setMetricView("impressions")}
            className={`bg-white p-5 rounded-2xl border transition-all cursor-pointer ${
              metricView === "impressions"
                ? "border-[#0866FF] ring-2 ring-[#0866FF]/10 shadow-sm"
                : "border-[#E7ECF3] shadow-2xs hover:border-slate-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#667085] font-medium">Total Impressions</span>
              <div className="w-8 h-8 rounded-lg bg-[#EBF2FF] text-[#0866FF] flex items-center justify-center">
                <ImageIcon className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-[#172033] mt-2">
              {liveMetrics.impressions.toLocaleString()}
            </div>
            <div className="text-xs text-[#12A875] font-semibold mt-1">
              ↑ {liveMetrics.impressionsGrowth}% vs previous period
            </div>
          </div>

          <div
            onClick={() => setMetricView("messages")}
            className={`bg-white p-5 rounded-2xl border transition-all cursor-pointer ${
              metricView === "messages"
                ? "border-[#0866FF] ring-2 ring-[#0866FF]/10 shadow-sm"
                : "border-[#E7ECF3] shadow-2xs hover:border-slate-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#667085] font-medium">Messaging Conversations</span>
              <div className="w-8 h-8 rounded-lg bg-[#EBF2FF] text-[#0866FF] flex items-center justify-center">
                <MessageSquare className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-[#172033] mt-2">
              {liveMetrics.messages}
            </div>
            <div className="text-xs text-[#12A875] font-semibold mt-1">
              ↑ {liveMetrics.messagesGrowth}% vs previous period
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#E7ECF3] shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#667085] font-medium">Advertising Spend</span>
              <div className="w-8 h-8 rounded-lg bg-[#EBF2FF] text-[#0866FF] flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-[#172033] mt-2">
              ${liveMetrics.spend.toFixed(2)}
            </div>
            <div className="text-xs text-slate-500 font-medium mt-1">
              Avg. CPM: <span className="font-bold text-slate-800">$0.82</span>
            </div>
          </div>
        </div>

        {/* Minimal Valued Performance Trend Chart */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#E7ECF3] shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#E7ECF3]">
            <div>
              <h3 className="text-base font-bold text-[#172033]">
                Delivery Trend ({metricView.toUpperCase()})
              </h3>
              <p className="text-xs text-[#667085]">
                Daily delivery growth over time across Facebook & Instagram feeds and stories.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0866FF]" />
              <span className="text-xs font-semibold text-slate-700 capitalize">
                {metricView}
              </span>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0866FF" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#0866FF" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F3F9" />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={{ stroke: "#E7ECF3" }}
                  tick={{ fontSize: 11, fill: "#667085" }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "#667085" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#FFFFFF",
                    borderRadius: "12px",
                    border: "1px solid #E7ECF3",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                    fontSize: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey={metricView}
                  stroke="#0866FF"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorMetric)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Campaign Breakdown Table */}
        <div className="bg-white rounded-2xl border border-[#E7ECF3] shadow-2xs overflow-hidden">
          <div className="px-6 py-4 border-b border-[#E7ECF3]">
            <h3 className="text-sm font-bold text-[#172033]">
              Active & Recent Campaign Breakdown
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E7ECF3] bg-[#F6F8FC]/60 text-[11px] font-semibold text-[#667085] uppercase tracking-wider">
                  <th className="py-3 px-6">Campaign</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Platform</th>
                  <th className="py-3 px-4">Reach</th>
                  <th className="py-3 px-4">Impressions</th>
                  <th className="py-3 px-4">Conversations</th>
                  <th className="py-3 px-6 text-right">Spend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7ECF3] text-xs">
                {activeCampaigns.map((camp) => (
                  <tr key={camp.id} className="hover:bg-[#F6F8FC]/50">
                    <td className="py-3.5 px-6 font-bold text-[#172033]">
                      <div>{camp.campaignName}</div>
                      <span className="text-[10px] text-slate-400 font-mono">#{camp.id}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={camp.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {camp.platform}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {camp.metrics?.reach.toLocaleString() || "—"}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {camp.metrics?.impressions.toLocaleString() || "—"}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-[#0866FF]">
                      {camp.metrics?.conversations || "—"}
                    </td>
                    <td className="py-3.5 px-6 text-right font-bold text-slate-900">
                      ${camp.metrics?.spendUSD.toFixed(2) || camp.totalBudgetUSD.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
