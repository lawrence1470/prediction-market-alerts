"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, MoreHorizontal, Pause, Play, Trash2, Newspaper } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "~/trpc/react";
import { NewsArticleCard } from "./NewsArticleCard";
import { StatusBadge } from "./StatusBadge";
import { formatEventTitle } from "~/server/utils/event-title";

type UserAlertStatus = "ACTIVE" | "PAUSED" | "EXPIRED";
type EventWebhookStatus = "ACTIVE" | "PENDING" | "FAILED" | "UNSUBSCRIBED" | "EXPIRED";

interface NewsArticle {
  id: string;
  title: string;
  summary: string | null;
  url: string;
  imageUrl: string | null;
  source: string | null;
  publishedAt: Date | null;
  createdAt: Date;
}

interface AlertGroupProps {
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
  articles: NewsArticle[];
  totalArticles: number;
}

export function AlertGroup({ alert, articles, totalArticles }: AlertGroupProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [loadedArticles, setLoadedArticles] = useState<NewsArticle[]>(articles);
  const [cursor, setCursor] = useState<string | undefined>(
    articles.length > 0 ? articles[articles.length - 1]?.id : undefined
  );

  const utils = api.useUtils();

  const toggleMutation = api.alert.toggleAlert.useMutation({
    onSuccess: async () => {
      await utils.alert.getAlertsWithArticles.invalidate();
      setIsMenuOpen(false);
    },
  });

  const removeMutation = api.alert.removeAlert.useMutation({
    onSuccess: async () => {
      await utils.alert.getAlertsWithArticles.invalidate();
    },
  });

  const loadMoreQuery = api.alert.getMoreArticles.useQuery(
    {
      eventTicker: alert.eventTicker,
      cursor,
      limit: 10,
    },
    {
      enabled: false, // Manual trigger only
    }
  );

  const handleLoadMore = async () => {
    const result = await loadMoreQuery.refetch();
    if (result.data) {
      setLoadedArticles([...loadedArticles, ...result.data.articles]);
      setCursor(result.data.nextCursor);
    }
  };

  const isEventActive = alert.eventWebhook.status === "ACTIVE";
  const isAlertActive = alert.status === "ACTIVE";
  const hasMoreArticles = totalArticles > loadedArticles.length;
  const remainingArticles = totalArticles - loadedArticles.length;

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
      {/* Header */}
      <div
        className="flex cursor-pointer items-center justify-between p-4"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-white">
              {formatEventTitle(alert.eventTicker)}
            </h3>
            <StatusBadge status={alert.status} />
            {!isEventActive && (
              <StatusBadge status={alert.eventWebhook.status} />
            )}
          </div>
          <p className="mt-1 text-sm text-white/50">
            Tracking: {alert.eventWebhook.searchQuery}{" "}
            <span className="text-white/30">
              • {totalArticles} article{totalArticles !== 1 ? "s" : ""} found
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Manage Dropdown */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen(!isMenuOpen);
              }}
              className="rounded-lg p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
            >
              <MoreHorizontal className="h-5 w-5" />
            </button>

            <AnimatePresence>
              {isMenuOpen && (
                <>
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 z-10"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMenuOpen(false);
                    }}
                  />

                  {/* Menu */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full z-20 mt-1 w-44 overflow-hidden rounded-lg border border-white/10 bg-gray-900 shadow-xl"
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleMutation.mutate({ alertId: alert.id });
                      }}
                      disabled={toggleMutation.isPending || !isEventActive}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-white/80 transition-colors hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isAlertActive ? (
                        <>
                          <Pause className="h-4 w-4" />
                          Pause Alert
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4" />
                          Resume Alert
                        </>
                      )}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm("Remove this alert? You can add it again later.")) {
                          removeMutation.mutate({ alertId: alert.id });
                        }
                      }}
                      disabled={removeMutation.isPending}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-400 transition-colors hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove Alert
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Expand/Collapse */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="rounded-lg p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          >
            {isExpanded ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Articles List */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="border-t border-white/5 px-4 pb-4">
              {loadedArticles.length > 0 ? (
                <div className="space-y-3 pt-4">
                  {loadedArticles.map((article) => (
                    <NewsArticleCard key={article.id} article={article} />
                  ))}

                  {/* Load More */}
                  {hasMoreArticles && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLoadMore();
                      }}
                      disabled={loadMoreQuery.isFetching}
                      className="mt-2 w-full rounded-lg border border-white/10 py-2.5 text-sm font-medium text-white/60 transition-colors hover:border-white/20 hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {loadMoreQuery.isFetching
                        ? "Loading..."
                        : `Show ${remainingArticles} more article${remainingArticles !== 1 ? "s" : ""}`}
                    </button>
                  )}
                </div>
              ) : (
                /* Empty State */
                <div className="flex flex-col items-center py-8 text-center">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/5">
                    <Newspaper className="h-6 w-6 text-white/30" />
                  </div>
                  <p className="text-sm font-medium text-white/60">No articles yet</p>
                  <p className="mt-1 text-xs text-white/40">
                    We're monitoring for news about this event.
                    <br />
                    You'll be notified when articles are published.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
