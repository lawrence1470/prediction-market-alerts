"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  ArrowLeft,
  Plus,
} from "lucide-react";
import { motion } from "framer-motion";
import { authClient } from "~/server/better-auth/client";
import { api } from "~/trpc/react";
import { AlertGroup } from "~/app/_components/AlertGroup";

export default function AlertsPage() {
  const router = useRouter();
  const { data: session, isPending: sessionPending } = authClient.useSession();

  const { data: alertsData, isLoading: alertsLoading } = api.alert.getAlertsWithArticles.useQuery(
    { articlesPerAlert: 3 },
    { enabled: !!session }
  );

  if (sessionPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#CDFF00] border-t-transparent" />
      </div>
    );
  }

  if (!session) {
    router.push("/login");
    return null;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Back to Dashboard */}
      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">News Alerts</h1>
          <p className="mt-2 text-gray-400">
            Real-time news for your Kalshi events
          </p>
        </div>
        <motion.button
          onClick={() => router.push("/dashboard")}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
          className="cursor-pointer flex items-center gap-2 rounded-full bg-[#CDFF00] px-6 py-3 font-medium text-black transition-colors hover:bg-[#b8e600]"
        >
          <Plus className="h-5 w-5" />
          Add Alert
        </motion.button>
      </div>

      {/* Alerts List */}
      {alertsLoading ? (
        <div className="space-y-4">
          {/* Skeleton loading */}
          {[1, 2].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-2xl border border-white/10 bg-white/5 p-4"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-5 w-40 rounded bg-white/10" />
                  <div className="h-4 w-60 rounded bg-white/5" />
                </div>
                <div className="h-8 w-8 rounded bg-white/5" />
              </div>
              <div className="mt-4 space-y-3 border-t border-white/5 pt-4">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="flex gap-4">
                    <div className="h-20 w-32 rounded-lg bg-white/5" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-3/4 rounded bg-white/10" />
                      <div className="h-3 w-1/2 rounded bg-white/5" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : alertsData && alertsData.length > 0 ? (
        <div className="space-y-6">
          {alertsData.map((alertWithArticles) => (
            <motion.div
              key={alertWithArticles.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <AlertGroup
                alert={alertWithArticles}
                articles={alertWithArticles.articles}
                totalArticles={alertWithArticles.totalArticles}
              />
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-gray-800 bg-gray-900 p-12 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gray-800">
            <Bell className="h-10 w-10 text-[#CDFF00]" />
          </div>
          <h2 className="mb-2 text-xl font-semibold text-white">No alerts yet</h2>
          <p className="mx-auto mb-8 max-w-md text-gray-400">
            Add alerts from your bets on the dashboard to receive real-time news updates via email.
          </p>
          <motion.button
            onClick={() => router.push("/dashboard")}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className="cursor-pointer rounded-full bg-[#CDFF00] px-8 py-3 font-medium text-black transition-colors hover:bg-[#b8e600]"
          >
            Go to Dashboard
          </motion.button>
        </div>
      )}
    </div>
  );
}
