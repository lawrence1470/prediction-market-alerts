"use client";

import { api } from "~/trpc/react";
import { StatusBadge } from "./StatusBadge";

// Define status types to match Prisma enums
type UserAlertStatus = "ACTIVE" | "PAUSED" | "EXPIRED";
type EventWebhookStatus = "ACTIVE" | "PENDING" | "FAILED" | "UNSUBSCRIBED" | "EXPIRED";

interface AlertCardProps {
  alert: {
    id: string;
    eventTicker: string;
    marketTicker: string;
    status: UserAlertStatus;
    createdAt: Date;
    eventWebhook: {
      eventTicker: string;
      status: EventWebhookStatus;
      searchQuery: string;
    };
  };
}

export function AlertCard({ alert }: AlertCardProps) {
  const utils = api.useUtils();

  const toggleMutation = api.alert.toggleAlert.useMutation({
    onSuccess: async () => {
      await utils.alert.getAlerts.invalidate();
    },
  });

  const removeMutation = api.alert.removeAlert.useMutation({
    onSuccess: async () => {
      await utils.alert.getAlerts.invalidate();
    },
  });

  const formatEventTitle = (eventTicker: string) => {
    const parts = eventTicker.split("-");
    const series = parts[0] ?? "";
    const eventPart = parts[1] ?? "";

    // NFL format
    if (series.includes("NFL")) {
      const teamsPart = eventPart.slice(7);
      if (teamsPart.length >= 6) {
        const team1 = teamsPart.slice(0, 3);
        const team2 = teamsPart.slice(3, 6);
        return `NFL: ${team1} vs ${team2}`;
      }
      return "NFL Event";
    }

    // Crypto format
    if (series.includes("BTC")) return "Bitcoin Price";
    if (series.includes("ETH")) return "Ethereum Price";
    if (series.includes("SOL")) return "Solana Price";

    // Economic format
    if (series.includes("FED")) return "Federal Reserve";
    if (series.includes("CPI")) return "CPI / Inflation";
    if (series.includes("GDP")) return "GDP Report";

    return eventTicker;
  };

  const isEventActive = alert.eventWebhook.status === "ACTIVE";
  const isAlertActive = alert.status === "ACTIVE";

  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-white">
              {formatEventTitle(alert.eventTicker)}
            </h3>
            <StatusBadge status={alert.status} />
            {!isEventActive && (
              <StatusBadge status={alert.eventWebhook.status} />
            )}
          </div>
          <p className="mt-1 text-sm text-white/60">{alert.marketTicker}</p>
          <p className="mt-2 text-xs text-white/40">
            Tracking: {alert.eventWebhook.searchQuery}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle Button */}
          <button
            onClick={() => toggleMutation.mutate({ alertId: alert.id })}
            disabled={toggleMutation.isPending || !isEventActive}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              isAlertActive
                ? "bg-white/10 text-white hover:bg-white/20"
                : "bg-[#CDFF00]/20 text-[#CDFF00] hover:bg-[#CDFF00]/30"
            } disabled:cursor-not-allowed disabled:opacity-50`}
            title={isAlertActive ? "Pause alerts" : "Resume alerts"}
          >
            {toggleMutation.isPending
              ? "..."
              : isAlertActive
                ? "Pause"
                : "Resume"}
          </button>

          {/* Remove Button */}
          <button
            onClick={() => {
              if (confirm("Remove this alert? You can add it again later.")) {
                removeMutation.mutate({ alertId: alert.id });
              }
            }}
            disabled={removeMutation.isPending}
            className="rounded-lg bg-red-500/10 px-3 py-1.5 text-sm font-medium text-red-400 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {removeMutation.isPending ? "..." : "Remove"}
          </button>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-4 text-xs text-white/40">
        <span>
          Added{" "}
          {new Date(alert.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </span>
      </div>
    </div>
  );
}
