"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TrendingUp, LogOut, User, Plus, Trash2, Loader2, AlertCircle, Radio, Bell, RefreshCw } from "lucide-react";
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
  const [pendingAlertTicker, setPendingAlertTicker] = useState<string | null>(null);
  const [pendingToggleAlertId, setPendingToggleAlertId] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<{ title: string; message: string } | null>(null);

  const utils = api.useUtils();

  const { data: bets, isLoading: betsLoading, error: betsError, refetch: refetchBets } = api.bet.list.useQuery(
    undefined,
    { enabled: !!session }
  );

  const { data: alerts, error: alertsError, refetch: refetchAlerts } = api.alert.getAlerts.useQuery(
    undefined,
    { enabled: !!session }
  );

  // Helper to find alert for a specific event ticker
  const getAlertForBet = (eventTicker: string) => {
    return alerts?.find((alert) => alert.eventTicker === eventTicker);
  };

  const trimmedTicker = eventTicker.trim();
  const {
    data: eventPreview,
    isLoading: eventLoading,
    error: eventError,
    refetch: fetchEvent,
  } = api.kalshi.getEvent.useQuery(
    { eventTicker: trimmedTicker },
    { enabled: false, retry: false }
  );

  const createBet = api.bet.create.useMutation({
    onSuccess: () => {
      void utils.bet.list.invalidate();
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
      void utils.bet.list.invalidate();
      setBetToDelete(null);
    },
    onError: (error) => {
      setBetToDelete(null);
      setMutationError({
        title: "Failed to Delete Bet",
        message: error.message || "Could not delete bet. Please try again."
      });
    },
  });

  const addAlert = api.alert.addAlert.useMutation({
    onSuccess: () => {
      void utils.alert.getAlerts.invalidate();
      setPendingAlertTicker(null);
    },
    onError: (error) => {
      setPendingAlertTicker(null);
      setMutationError({
        title: "Failed to Enable Alerts",
        message: error.message || "Could not enable news alerts. Please try again."
      });
    },
  });

  const toggleAlert = api.alert.toggleAlert.useMutation({
    onSuccess: () => {
      void utils.alert.getAlerts.invalidate();
      setPendingToggleAlertId(null);
    },
    onError: (error) => {
      setPendingToggleAlertId(null);
      setMutationError({
        title: "Failed to Update Alert",
        message: error.message || "Could not update alert status. Please try again."
      });
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

  const handleLookup = () => {
    if (!trimmedTicker) return;
    void fetchEvent();
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
              <Link
                href="/dashboard/alerts"
                className="flex items-center gap-2 rounded-full border border-gray-700 px-4 py-2 text-gray-300 transition-colors hover:border-[#CDFF00] hover:text-[#CDFF00]"
              >
                <Bell className="h-4 w-4" />
                Alerts
              </Link>
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
                    disabled={!trimmedTicker || eventLoading}
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
                <div className="mb-4 rounded-lg border border-red-800/50 bg-red-900/30 p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-400" />
                    <div className="flex-1">
                      <p className="text-sm text-red-400">Event not found. Check the ID and try again.</p>
                      <button
                        onClick={handleLookup}
                        disabled={eventLoading}
                        className="mt-2 text-xs text-red-300 underline hover:text-red-200 disabled:opacity-50"
                      >
                        Retry lookup
                      </button>
                    </div>
                  </div>
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

        {/* Create Bet Error Modal */}
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

        {/* Mutation Error Toast */}
        <AnimatePresence>
          {mutationError && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed bottom-8 right-8 z-50 max-w-md"
            >
              <div className="rounded-xl border border-red-800 bg-gray-900 p-4 shadow-2xl">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-red-900/50">
                    <AlertCircle className="h-4 w-4 text-red-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-white">{mutationError.title}</h3>
                    <p className="mt-1 text-sm text-gray-400">{mutationError.message}</p>
                  </div>
                  <button
                    onClick={() => setMutationError(null)}
                    className="cursor-pointer text-gray-400 hover:text-gray-300"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
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
        ) : betsError ? (
          <div className="rounded-xl border border-red-800/50 bg-gray-900 p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-900/30">
              <AlertCircle className="h-8 w-8 text-red-400" />
            </div>
            <h2 className="mb-2 text-xl font-semibold text-white">Failed to Load Bets</h2>
            <p className="mb-6 text-gray-400">
              {betsError.message || "Something went wrong while loading your bets."}
            </p>
            <button
              onClick={() => void refetchBets()}
              className="cursor-pointer inline-flex items-center gap-2 rounded-lg bg-gray-700 px-6 py-3 font-medium text-white transition-colors hover:bg-gray-600"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Try Again
            </button>
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

                {/* News Alerts Section */}
                {(() => {
                  const alert = getAlertForBet(bet.eventTicker);
                  const isAlertActive = alert?.status === "ACTIVE";
                  const isWebhookActive = alert?.eventWebhook.status === "ACTIVE";
                  const hasAlertError = alertsError && !alert;

                  return (
                    <div className="border-t border-gray-800 bg-gray-950/50">
                      {hasAlertError ? (
                        // Alert loading error - show retry
                        <div className="px-6 py-4">
                          <div className="flex items-center gap-2 text-xs text-red-400">
                            <AlertCircle className="h-3 w-3" />
                            <span>Failed to load alerts</span>
                            <button
                              onClick={() => void refetchAlerts()}
                              className="ml-auto text-red-300 underline hover:text-red-200"
                            >
                              Retry
                            </button>
                          </div>
                        </div>
                      ) : alert ? (
                        // Alert exists - show status and controls
                        <div className="flex items-center justify-between px-6 py-4">
                          <div className="flex items-center gap-3">
                            {isAlertActive && isWebhookActive ? (
                              <>
                                <div className="relative flex items-center justify-center">
                                  <Radio className="h-4 w-4 text-[#CDFF00]" />
                                  <span className="absolute inline-flex h-full w-full rounded-full bg-[#CDFF00] opacity-30 animate-[pulse_1.5s_ease-in-out_infinite]" />
                                </div>
                                <span className="text-xs text-gray-400">Scanning for news...</span>
                                <div className="flex items-center gap-1.5">
                                  <div className="h-1.5 w-1.5 rounded-full bg-[#CDFF00] animate-[pulse_2s_ease-in-out_infinite]" />
                                  <span className="text-xs text-gray-500">Live</span>
                                </div>
                              </>
                            ) : (
                              <>
                                <Bell className="h-4 w-4 text-gray-500" />
                                <span className="text-xs text-gray-500">
                                  {alert.status === "PAUSED" ? "Alerts paused" :
                                   alert.eventWebhook.status === "PENDING" ? "Setting up..." :
                                   alert.eventWebhook.status === "FAILED" ? "Setup failed" :
                                   alert.eventWebhook.status === "EXPIRED" ? "Event ended" :
                                   "Alerts inactive"}
                                </span>
                              </>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setPendingToggleAlertId(alert.id);
                                toggleAlert.mutate({ alertId: alert.id });
                              }}
                              disabled={pendingToggleAlertId === alert.id || !isWebhookActive}
                              className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                                isAlertActive
                                  ? "bg-white/10 text-white hover:bg-white/20"
                                  : "bg-[#CDFF00]/20 text-[#CDFF00] hover:bg-[#CDFF00]/30"
                              } disabled:cursor-not-allowed disabled:opacity-50`}
                            >
                              {pendingToggleAlertId === alert.id ? "..." : isAlertActive ? "Pause" : "Resume"}
                            </button>
                          </div>
                        </div>
                      ) : (
                        // No alert - show enable button
                        <div className="flex items-center justify-between px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Bell className="h-4 w-4 text-gray-500" />
                            <span className="text-xs text-gray-500">Get notified when news breaks</span>
                          </div>
                          <button
                            onClick={() => {
                              setPendingAlertTicker(bet.eventTicker);
                              addAlert.mutate({
                                marketTicker: bet.eventTicker,
                                eventTitle: bet.title
                              });
                            }}
                            disabled={pendingAlertTicker === bet.eventTicker}
                            className="cursor-pointer flex items-center gap-1.5 rounded-lg bg-[#CDFF00] px-3 py-1.5 text-xs font-medium text-black transition hover:bg-[#b8e600] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {pendingAlertTicker === bet.eventTicker ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Bell className="h-3 w-3" />
                            )}
                            {pendingAlertTicker === bet.eventTicker ? "Enabling..." : "Enable Alerts"}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })()}
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
