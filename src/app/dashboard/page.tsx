"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TrendingUp, LogOut, User, Plus, Trash2, Loader2, AlertCircle, Newspaper, Radio, ExternalLink, Clock, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { authClient } from "~/server/better-auth/client";
import { api } from "~/trpc/react";

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const [eventTicker, setEventTicker] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [betToDelete, setBetToDelete] = useState<{ id: string; title: string } | null>(null);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const toggleCardExpanded = (betId: string) => {
    setExpandedCards((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(betId)) {
        newSet.delete(betId);
      } else {
        newSet.add(betId);
      }
      return newSet;
    });
  };

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
    onError: (error) => {
      setShowAddForm(false);
      setErrorMessage(error.message);
    },
  });

  const deleteBet = api.bet.delete.useMutation({
    onSuccess: () => {
      utils.bet.list.invalidate();
      setBetToDelete(null);
    },
  });

  const handleDeleteBet = () => {
    if (!betToDelete) return;
    deleteBet.mutate({ id: betToDelete.id });
  };

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

        {/* Error Modal */}
        <AnimatePresence>
          {errorMessage && (
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
                className="mx-4 w-full max-w-md rounded-2xl border border-red-800 bg-gray-900 p-6"
              >
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-900/50">
                    <AlertCircle className="h-5 w-5 text-red-400" />
                  </div>
                  <h2 className="text-xl font-semibold text-white">Cannot Add Bet</h2>
                </div>
                <p className="mb-6 text-gray-400">{errorMessage}</p>
                <button
                  onClick={() => setErrorMessage(null)}
                  className="cursor-pointer w-full rounded-lg bg-gray-700 py-3 font-medium text-white transition-colors hover:bg-gray-600"
                >
                  Got it
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {betToDelete && (
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
                className="mx-4 w-full max-w-md rounded-2xl border border-gray-800 bg-gray-900 p-6"
              >
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-900/50">
                    <Trash2 className="h-5 w-5 text-red-400" />
                  </div>
                  <h2 className="text-xl font-semibold text-white">Delete Bet</h2>
                </div>
                <p className="mb-6 text-gray-400">
                  Are you sure you want to delete <span className="font-medium text-white">{betToDelete.title}</span>? This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setBetToDelete(null)}
                    className="cursor-pointer flex-1 rounded-lg border border-gray-700 py-3 text-gray-300 transition-colors hover:border-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteBet}
                    disabled={deleteBet.isPending}
                    className="cursor-pointer flex-1 rounded-lg bg-red-600 py-3 font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {deleteBet.isPending ? "Deleting..." : "Delete"}
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
              <motion.div
                key={bet.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-gray-800 bg-gray-900 overflow-hidden"
              >
                {/* Card Header */}
                <div className="flex items-center justify-between p-6 pb-4">
                  <div className="flex-1">
                    <div className="mb-1 text-xs text-[#CDFF00]">{bet.category}</div>
                    <div className="text-lg font-medium text-white">{bet.title}</div>
                    {bet.subtitle && (
                      <div className="text-sm text-gray-400">{bet.subtitle}</div>
                    )}
                    <div className="mt-2 text-xs text-gray-500">{bet.eventTicker}</div>
                  </div>
                  <button
                    onClick={() => setBetToDelete({ id: bet.id, title: bet.title })}
                    className="cursor-pointer rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-red-400"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>

                {/* News Scanning Section */}
                <div className="border-t border-gray-800 bg-gray-950/50">
                  {/* Clickable Header */}
                  <button
                    onClick={() => toggleCardExpanded(bet.id)}
                    className="cursor-pointer w-full flex items-center gap-2 px-6 py-4 transition-colors hover:bg-gray-900/30"
                  >
                    {/* Pulsing Scanning Icon */}
                    <div className="relative flex items-center justify-center">
                      <Radio className="h-4 w-4 text-[#CDFF00]" />
                      <span className="absolute inline-flex h-full w-full rounded-full bg-[#CDFF00] opacity-30 animate-[pulse_1.5s_ease-in-out_infinite]" />
                      <span className="absolute inline-flex h-[150%] w-[150%] rounded-full bg-[#CDFF00] opacity-15 animate-[pulse_1.5s_ease-in-out_infinite_0.3s]" />
                    </div>
                    <span className="text-xs text-gray-400">Scanning for news...</span>

                    {/* Alert Count Badge (visible when collapsed) */}
                    {!expandedCards.has(bet.id) && (
                      <span className="flex items-center gap-1 rounded-full bg-[#CDFF00]/10 px-2 py-0.5 text-xs font-medium text-[#CDFF00]">
                        3 alerts
                      </span>
                    )}

                    <div className="ml-auto flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <div className="h-1.5 w-1.5 rounded-full bg-[#CDFF00] animate-[pulse_2s_ease-in-out_infinite]" />
                        <span className="text-xs text-gray-500">Live</span>
                      </div>
                      <motion.div
                        animate={{ rotate: expandedCards.has(bet.id) ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown className="h-4 w-4 text-gray-500" />
                      </motion.div>
                    </div>
                  </button>

                  {/* Collapsible News Articles */}
                  <AnimatePresence initial={false}>
                    {expandedCards.has(bet.id) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-2 px-6 pb-4">
                          {/* Sample Article 1 */}
                          <a
                            href="#"
                            className="group flex items-start gap-3 rounded-lg bg-gray-900/50 p-3 border border-gray-800/50 transition-all hover:border-gray-700 hover:bg-gray-900"
                          >
                            <Newspaper className="h-4 w-4 text-[#CDFF00] mt-0.5 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-white group-hover:text-[#CDFF00] transition-colors line-clamp-2">
                                Breaking: Major developments reported as analysts weigh in on market implications
                              </p>
                              <div className="flex items-center gap-2 mt-1.5">
                                <span className="text-xs text-gray-500">Reuters</span>
                                <span className="text-gray-600">•</span>
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                  <Clock className="h-3 w-3" />
                                  <span>2 min ago</span>
                                </div>
                              </div>
                            </div>
                            <ExternalLink className="h-4 w-4 text-gray-600 group-hover:text-gray-400 shrink-0 mt-0.5" />
                          </a>

                          {/* Sample Article 2 */}
                          <a
                            href="#"
                            className="group flex items-start gap-3 rounded-lg bg-gray-900/50 p-3 border border-gray-800/50 transition-all hover:border-gray-700 hover:bg-gray-900"
                          >
                            <Newspaper className="h-4 w-4 text-[#CDFF00] mt-0.5 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-white group-hover:text-[#CDFF00] transition-colors line-clamp-2">
                                Expert analysis: What the latest trends mean for prediction markets
                              </p>
                              <div className="flex items-center gap-2 mt-1.5">
                                <span className="text-xs text-gray-500">Bloomberg</span>
                                <span className="text-gray-600">•</span>
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                  <Clock className="h-3 w-3" />
                                  <span>15 min ago</span>
                                </div>
                              </div>
                            </div>
                            <ExternalLink className="h-4 w-4 text-gray-600 group-hover:text-gray-400 shrink-0 mt-0.5" />
                          </a>

                          {/* Sample Article 3 */}
                          <a
                            href="#"
                            className="group flex items-start gap-3 rounded-lg bg-gray-900/50 p-3 border border-gray-800/50 transition-all hover:border-gray-700 hover:bg-gray-900"
                          >
                            <Newspaper className="h-4 w-4 text-[#CDFF00] mt-0.5 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-white group-hover:text-[#CDFF00] transition-colors line-clamp-2">
                                Market update: Key indicators suggest shifting sentiment among traders
                              </p>
                              <div className="flex items-center gap-2 mt-1.5">
                                <span className="text-xs text-gray-500">AP News</span>
                                <span className="text-gray-600">•</span>
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                  <Clock className="h-3 w-3" />
                                  <span>1 hour ago</span>
                                </div>
                              </div>
                            </div>
                            <ExternalLink className="h-4 w-4 text-gray-600 group-hover:text-gray-400 shrink-0 mt-0.5" />
                          </a>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
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
