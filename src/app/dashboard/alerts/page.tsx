"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  LogOut,
  User,
  Loader2,
  Bell,
  ArrowLeft,
  Plus,
} from "lucide-react";
import { motion } from "framer-motion";
import { authClient } from "~/server/better-auth/client";
import { api } from "~/trpc/react";
import { AlertCard } from "~/app/_components/AlertCard";

export default function AlertsPage() {
  const router = useRouter();
  const { data: session, isPending: sessionPending } = authClient.useSession();

  const { data: alerts, isLoading: alertsLoading } = api.alert.getAlerts.useQuery(
    undefined,
    { enabled: !!session }
  );

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/");
  };

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
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <Link href="/" className="flex items-center">
              <TrendingUp className="mr-2 h-6 w-6 text-[#CDFF00]" />
              <span className="text-xl font-semibold text-white">Kalshi Tracker</span>
            </Link>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 rounded-full bg-gray-800 px-4 py-2">
                <User className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-300">{session.user.email}</span>
              </div>
              <button
                onClick={handleSignOut}
                className="cursor-pointer flex items-center gap-2 rounded-full border border-gray-700 px-4 py-2 text-gray-300 transition-colors hover:border-gray-600 hover:text-white"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
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
              Manage your real-time news alerts for Kalshi events
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
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#CDFF00]" />
          </div>
        ) : alerts && alerts.length > 0 ? (
          <div className="grid gap-4">
            {alerts.map((alert) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <AlertCard alert={alert} />
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
      </main>
    </div>
  );
}
