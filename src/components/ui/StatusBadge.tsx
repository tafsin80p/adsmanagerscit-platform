import React from "react";
import { OrderStatus, PaymentStatus } from "@/types";

interface StatusBadgeProps {
  status: OrderStatus | PaymentStatus;
  size?: "sm" | "md";
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = "md" }) => {
  const getBadgeStyle = () => {
    switch (status) {
      case "Active":
      case "Verified":
        return {
          bg: "bg-[#E8F8F2]",
          text: "text-[#12A875]",
          dot: "bg-[#12A875]",
        };
      case "Pending":
      case "Awaiting Verification":
      case "Under Review":
        return {
          bg: "bg-[#FFF4E5]",
          text: "text-[#D97706]",
          dot: "bg-[#D97706]",
        };
      case "Paused":
        return {
          bg: "bg-[#FEF7EA]",
          text: "text-[#F59E0B]",
          dot: "bg-[#F59E0B]",
        };
      case "Completed":
        return {
          bg: "bg-[#EEF2FF]",
          text: "text-[#3858F6]",
          dot: "bg-[#3858F6]",
        };
      case "Confirmed":
        return {
          bg: "bg-[#EBF7FF]",
          text: "text-[#0284C7]",
          dot: "bg-[#0284C7]",
        };
      case "Rejected":
      case "Failed":
        return {
          bg: "bg-[#FDECEC]",
          text: "text-[#DC4545]",
          dot: "bg-[#DC4545]",
        };
      default:
        return {
          bg: "bg-gray-100",
          text: "text-gray-600",
          dot: "bg-gray-400",
        };
    }
  };

  const style = getBadgeStyle();
  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-xs font-medium" : "px-2.5 py-1 text-xs font-semibold";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full ${style.bg} ${style.text} ${sizeClasses} transition-colors`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {status}
    </span>
  );
};
