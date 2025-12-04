"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TrendingUp, LogOut, User, Plus, Trash2, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { authClient } from "~/server/better-auth/client";
import { api } from "~/trpc/react";

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const [eventTicker, setEventTicker] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  const utils = api.useUtils();

  const { data: bets, isLoading: betsLoading } = api.bet.list.useQuery(
    undefined,
    { enabled: !!session }
  );

  const {
    data: eventPreview,
    isLoading: eventLoading,
    error: eventError,
    refetch: fetchEvent,
  } = api.kalshi.getEvent.useQuery(
    { eventTicker },
    { enabled: false }
  );

  const createBet = api.bet.create.useMutation({
    onSuccess: () => {
      utils.bet.list.invalidate();
      setEventTicker("");
      setShowAddForm(false);
    },
  });

  const deleteBet = api.bet.delete.useMutation({
    onSuccess: () => {
      utils.bet.list.invalidate();
    },
  });

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/");
  };

  const handleLookup = async () => {
    if (!eventTicker.trim()) return;
    fetchEvent();
  };

  const handleAddBet = () => {
    if (!eventPreview) return;
    createBet.mutate({
      eventTicker: eventPreview.event.event_ticker,
      title: eventPreview.event.title,
      subtitle: eventPreview.event.sub_title,
      category: eventPreview.event.category,
    });
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
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Your Bets</h1>
            <p className="mt-2 text-gray-400">Track your Kalshi positions</p>
          </div>
          <motion.button
            onClick={() => setShowAddForm(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className="cursor-pointer flex items-center gap-2 rounded-full bg-[#CDFF00] px-6 py-3 font-medium text-black transition-colors hover:bg-[#b8e600]"
          >
            <Plus className="h-5 w-5" />
            Add Bet
          </motion.button>
        </div>

        {/* Add Bet Modal */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0, y: 20 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="mx-4 w-full max-w-lg rounded-2xl border border-gray-800 bg-gray-900 p-6"
              >
              <h2 className="mb-4 text-xl font-semibold text-white">Add Your Kalshi Bet</h2>

              <div className="mb-4">
                <label className="mb-2 block text-sm text-gray-400">Event ID</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={eventTicker}
                    onChange={(e) => setEventTicker(e.target.value.toUpperCase())}
                    placeholder="e.g. KXTRUMPMENTIONB-25DEC05"
                    className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white placeholder-gray-500 focus:border-[#CDFF00] focus:outline-none"
                  />
                  <button
                    onClick={handleLookup}
                    disabled={!eventTicker.trim() || eventLoading}
                    className="cursor-pointer rounded-lg bg-gray-700 px-4 py-3 text-white transition-colors hover:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {eventLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      "Look up"
                    )}
                  </button>
                </div>
              </div>

              {eventError && (
                <div className="mb-4 rounded-lg bg-red-900/30 p-3 text-sm text-red-400">
                  Event not found. Check the ID and try again.
                </div>
              )}

              {eventPreview && (
                <div className="mb-4 rounded-lg border border-gray-700 bg-gray-800 p-4">
                  <div className="mb-1 text-xs text-[#CDFF00]">{eventPreview.event.category}</div>
                  <div className="mb-1 text-lg font-medium text-white">{eventPreview.event.title}</div>
                  {eventPreview.event.sub_title && (
                    <div className="text-sm text-gray-400">{eventPreview.event.sub_title}</div>
                  )}
                  <div className="mt-2 text-xs text-gray-500">
                    {eventPreview.event.markets?.length ?? 0} markets
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setEventTicker("");
                  }}
                  className="cursor-pointer flex-1 rounded-lg border border-gray-700 py-3 text-gray-300 transition-colors hover:border-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddBet}
                  disabled={!eventPreview || createBet.isPending}
                  className="cursor-pointer flex-1 rounded-lg bg-[#CDFF00] py-3 font-medium text-black transition-colors hover:bg-[#b8e600] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {createBet.isPending ? "Adding..." : "Add Bet"}
                </button>
              </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bets List */}
        {betsLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#CDFF00]" />
          </div>
        ) : bets && bets.length > 0 ? (
          <div className="relative grid gap-4">
            {/* Loading overlay when adding a bet */}
            <AnimatePresence>
              {createBet.isPending && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-black/50 backdrop-blur-sm"
                >
                  <div className="flex items-center gap-3 rounded-full bg-gray-900 px-6 py-3">
                    <Loader2 className="h-5 w-5 animate-spin text-[#CDFF00]" />
                    <span className="text-sm text-white">Adding bet...</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            {bets.map((bet) => (
              <div
                key={bet.id}
                className="flex items-center justify-between rounded-xl border border-gray-800 bg-gray-900 p-6"
              >
                <div>
                  <div className="mb-1 text-xs text-[#CDFF00]">{bet.category}</div>
                  <div className="text-lg font-medium text-white">{bet.title}</div>
                  {bet.subtitle && (
                    <div className="text-sm text-gray-400">{bet.subtitle}</div>
                  )}
                  <div className="mt-2 text-xs text-gray-500">{bet.eventTicker}</div>
                </div>
                <button
                  onClick={() => deleteBet.mutate({ id: bet.id })}
                  disabled={deleteBet.isPending}
                  className="cursor-pointer rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-red-400"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-gray-800 bg-gray-900 p-12 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gray-800">
              <TrendingUp className="h-10 w-10 text-[#CDFF00]" />
            </div>
            <h2 className="mb-2 text-xl font-semibold text-white">No bets yet</h2>
            <p className="mx-auto mb-8 max-w-md text-gray-400">
              Add your Kalshi event IDs to start tracking your positions.
            </p>
            <motion.button
              onClick={() => setShowAddForm(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              className="cursor-pointer rounded-full bg-[#CDFF00] px-8 py-3 font-medium text-black transition-colors hover:bg-[#b8e600]"
            >
              Add Your First Bet
            </motion.button>
          </div>
        )}
      </main>
    </div>
  );
}
