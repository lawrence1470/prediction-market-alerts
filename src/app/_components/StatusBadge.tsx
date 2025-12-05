"use client";

// Define status types to match Prisma enums
type UserAlertStatus = "ACTIVE" | "PAUSED" | "EXPIRED";
type EventWebhookStatus = "ACTIVE" | "PENDING" | "FAILED" | "UNSUBSCRIBED" | "EXPIRED";
type Status = UserAlertStatus | EventWebhookStatus;

interface StatusBadgeProps {
  status: Status;
  size?: "sm" | "md";
}

const statusConfig: Record<Status, { label: string; className: string }> = {
  ACTIVE: {
    label: "Active",
    className: "bg-[#CDFF00] text-black",
  },
  PAUSED: {
    label: "Paused",
    className: "bg-white/20 text-white/60",
  },
  EXPIRED: {
    label: "Expired",
    className: "bg-white/10 text-white/40",
  },
  PENDING: {
    label: "Pending",
    className: "bg-yellow-500/20 text-yellow-400",
  },
  FAILED: {
    label: "Failed",
    className: "bg-red-500/20 text-red-400",
  },
  UNSUBSCRIBED: {
    label: "Ended",
    className: "bg-white/10 text-white/40",
  },
};

export function StatusBadge({ status, size = "sm" }: StatusBadgeProps) {
  const config = statusConfig[status];
  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm";

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${sizeClasses} ${config.className}`}
    >
      {config.label}
    </span>
  );
}
