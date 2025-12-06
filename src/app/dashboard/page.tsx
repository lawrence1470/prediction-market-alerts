"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TrendingUp, Plus, Trash2, Loader2, AlertCircle, Radio, Bell, Trophy, Lock, Check, Search, Hash, Clock, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { authClient } from "~/server/better-auth/client";
import { api } from "~/trpc/react";
import { PhoneCollectionModal } from "~/app/_components/PhoneCollectionModal";

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
  const [showSportsNotification, setShowSportsNotification] = useState(false);
  const [inputMode, setInputMode] = useState<"search" | "eventId">("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [betFilter, setBetFilter] = useState<"active" | "past">("active");
  const [selectedEvent, setSelectedEvent] = useState<{
    eventTicker: string;
    title: string;
    subTitle: string;
    category: string;
  } | null>(null);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [lastAddedEventTitle, setLastAddedEventTitle] = useState<string | null>(null);
  const utils = api.useUtils();

  // Fetch user preferences for sports interest
  const { data: userPrefs } = api.user.getPreferences.useQuery(undefined, {
    enabled: !!session,
  });

  // Mutation to update sports interest
  const setSportsInterest = api.user.setSportsInterest.useMutation({
    onSuccess: () => {
      void utils.user.getPreferences.invalidate();
      setShowSportsNotification(false);
      setShowAddForm(false);
      setEventTicker("");
    },
    onError: (error) => {
      setMutationError({
        title: "Failed to Save Preference",
        message: error.message || "Could not save your notification preference. Please try again."
      });
    },
  });

  const wantsSportsAlerts = userPrefs?.wantsSportsAlerts ?? false;

  const { data: bets, isLoading: betsLoading, error: betsError, refetch: refetchBets } = api.bet.list.useQuery(
    undefined,
    { enabled: !!session }
  );

  // Filter bets based on active/past status
  const filteredBets = bets?.filter((bet) => {
    if (betFilter === "active") {
      return bet.isActive;
    } else {
      return !bet.isActive;
    }
  }) ?? [];

  // Count for each category
  const activeBetsCount = bets?.filter((b) => b.isActive).length ?? 0;
  const pastBetsCount = bets?.filter((b) => !b.isActive).length ?? 0;

  const { data: alerts, error: alertsError, refetch: refetchAlerts } = api.alert.getAlerts.useQuery(
    undefined,
    { enabled: !!session }
  );

  // Fetch all open events for search
  const { data: allEvents, isLoading: eventsLoading } = api.kalshi.getEvents.useQuery(
    undefined,
    { enabled: !!session && showAddForm && inputMode === "search" }
  );

  // Filter events based on search query (only show results when user has typed something)
  const filteredEvents = searchQuery.trim()
    ? (allEvents?.filter((event) => {
        const query = searchQuery.toLowerCase();
        return (
          event.title.toLowerCase().includes(query) ||
          event.subTitle.toLowerCase().includes(query) ||
          event.eventTicker.toLowerCase().includes(query)
        );
      }).slice(0, 20) ?? [])
    : [];

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
      setShowAddForm(false);

      // Check if we should prompt for phone number
      const shouldPrompt = !userPrefs?.phone &&
        (userPrefs?.phonePromptDismissCount ?? 0) < 3;

      if (shouldPrompt) {
        // Store the event title for the modal
        const title = inputMode === "search"
          ? selectedEvent?.title
          : eventPreview?.event.title;
        setLastAddedEventTitle(title ?? null);
        setShowPhoneModal(true);
      }

      setEventTicker("");
      setSelectedEvent(null);
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

  // Show sports notification when a sports event is detected
  useEffect(() => {
    if (eventPreview?.event.category === "Sports" && !wantsSportsAlerts) {
      setShowSportsNotification(true);
    }
  }, [eventPreview, wantsSportsAlerts]);

  const handleDeleteBet = () => {
    if (!betToDelete) return;
    deleteBet.mutate({ id: betToDelete.id });
  };

  const handleLookup = () => {
    if (!trimmedTicker) return;
    void fetchEvent();
  };

  const handleAddBet = () => {
    if (inputMode === "search" && selectedEvent) {
      createBet.mutate({
        eventTicker: selectedEvent.eventTicker,
        title: selectedEvent.title,
        subtitle: selectedEvent.subTitle,
        category: selectedEvent.category,
      });
    } else if (inputMode === "eventId" && eventPreview) {
      createBet.mutate({
        eventTicker: eventPreview.event.event_ticker,
        title: eventPreview.event.title,
        subtitle: eventPreview.event.sub_title,
        category: eventPreview.event.category,
      });
    }
  };

  const handleSelectSearchEvent = (event: typeof filteredEvents[0]) => {
    setSelectedEvent({
      eventTicker: event.eventTicker,
      title: event.title,
      subTitle: event.subTitle,
      category: event.category,
    });
  };

  const handleCloseModal = () => {
    setShowAddForm(false);
    setEventTicker("");
    setSearchQuery("");
    setSelectedEvent(null);
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
    <>
      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Your Bets</h1>
            <p className="mt-2 text-gray-400">Track your Kalshi positions</p>
          </div>
          <div className="flex items-center gap-4">
            {/* Active/Past Filter Toggle */}
            {bets && bets.length > 0 && (
              <div className="flex gap-1 rounded-lg bg-gray-800 p-1">
                <button
                  onClick={() => setBetFilter("active")}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition ${
                    betFilter === "active"
                      ? "bg-[#CDFF00] text-black"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  <Clock className="h-3.5 w-3.5" />
                  Active
                  {activeBetsCount > 0 && (
                    <span className={`ml-1 rounded-full px-1.5 py-0.5 text-xs ${
                      betFilter === "active" ? "bg-black/20" : "bg-gray-700"
                    }`}>
                      {activeBetsCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setBetFilter("past")}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition ${
                    betFilter === "past"
                      ? "bg-[#CDFF00] text-black"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  <CheckCircle className="h-3.5 w-3.5" />
                  Past
                  {pastBetsCount > 0 && (
                    <span className={`ml-1 rounded-full px-1.5 py-0.5 text-xs ${
                      betFilter === "past" ? "bg-black/20" : "bg-gray-700"
                    }`}>
                      {pastBetsCount}
                    </span>
                  )}
                </button>
              </div>
            )}
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

              {/* Mode Toggle */}
              <div className="mb-4 flex gap-2 rounded-lg bg-gray-800 p-1">
                <button
                  onClick={() => {
                    setInputMode("search");
                    setSelectedEvent(null);
                  }}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition ${
                    inputMode === "search"
                      ? "bg-[#CDFF00] text-black"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  <Search className="h-4 w-4" />
                  Search
                </button>
                <button
                  onClick={() => {
                    setInputMode("eventId");
                    setSearchQuery("");
                    setSelectedEvent(null);
                  }}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition ${
                    inputMode === "eventId"
                      ? "bg-[#CDFF00] text-black"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  <Hash className="h-4 w-4" />
                  Event ID
                </button>
              </div>

              {/* Search Mode */}
              {inputMode === "search" && (
                <div className="mb-4">
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setSelectedEvent(null);
                      }}
                      placeholder="Search events..."
                      className="w-full rounded-lg border border-gray-700 bg-gray-800 py-3 pl-10 pr-4 text-white placeholder-gray-500 focus:border-[#CDFF00] focus:outline-none"
                    />
                  </div>

                  {/* Search Results */}
                  {eventsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-[#CDFF00]" />
                    </div>
                  ) : selectedEvent ? (
                    <div className="rounded-lg border-2 border-[#CDFF00] bg-gray-800 p-4">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="text-xs text-[#CDFF00]">{selectedEvent.category}</span>
                        {selectedEvent.category === "Sports" && (
                          <span className="rounded-full bg-amber-900/50 px-2 py-0.5 text-[10px] font-medium text-amber-400">
                            Coming Soon
                          </span>
                        )}
                        <Check className="ml-auto h-4 w-4 text-[#CDFF00]" />
                      </div>
                      <div className="text-lg font-medium text-white">{selectedEvent.title}</div>
                      {selectedEvent.subTitle && (
                        <div className="text-sm text-gray-400">{selectedEvent.subTitle}</div>
                      )}
                      <button
                        onClick={() => setSelectedEvent(null)}
                        className="mt-2 text-xs text-gray-400 underline hover:text-gray-300"
                      >
                        Change selection
                      </button>
                    </div>
                  ) : (
                    <div className="max-h-64 space-y-2 overflow-y-auto">
                      {filteredEvents.length === 0 ? (
                        <div className="py-8 text-center text-sm text-gray-500">
                          {searchQuery ? "No events found" : "Start typing to search"}
                        </div>
                      ) : (
                        filteredEvents.map((event) => (
                          <button
                            key={event.eventTicker}
                            onClick={() => handleSelectSearchEvent(event)}
                            className="w-full rounded-lg border border-gray-700 bg-gray-800 p-3 text-left transition hover:border-[#CDFF00]/50 hover:bg-gray-750"
                          >
                            <div className="mb-1 flex items-center gap-2">
                              <span className="text-xs text-[#CDFF00]">{event.category}</span>
                              {event.category === "Sports" && (
                                <span className="rounded-full bg-amber-900/50 px-2 py-0.5 text-[10px] font-medium text-amber-400">
                                  Coming Soon
                                </span>
                              )}
                              <span className="ml-auto text-xs text-gray-500">
                                {event.totalVolume.toLocaleString()} vol
                              </span>
                            </div>
                            <div className="font-medium text-white">{event.title}</div>
                            {event.subTitle && (
                              <div className="text-sm text-gray-400">{event.subTitle}</div>
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Event ID Mode */}
              {inputMode === "eventId" && (
                <>
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
                    <div className="mb-4 space-y-3">
                      <div className="rounded-lg border border-gray-700 bg-gray-800 p-4">
                        <div className="mb-1 flex items-center gap-2">
                          <span className="text-xs text-[#CDFF00]">{eventPreview.event.category}</span>
                          {eventPreview.event.category === "Sports" && (
                            <span className="rounded-full bg-amber-900/50 px-2 py-0.5 text-[10px] font-medium text-amber-400">
                              Coming Soon
                            </span>
                          )}
                        </div>
                        <div className="mb-1 text-lg font-medium text-white">{eventPreview.event.title}</div>
                        {eventPreview.event.sub_title && (
                          <div className="text-sm text-gray-400">{eventPreview.event.sub_title}</div>
                        )}
                        <div className="mt-2 text-xs text-gray-500">
                          {eventPreview.event.markets?.length ?? 0} markets
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleCloseModal}
                  className="cursor-pointer flex-1 rounded-lg border border-gray-700 py-3 text-gray-300 transition-colors hover:border-gray-600"
                >
                  Cancel
                </button>
                {(inputMode === "search" ? selectedEvent?.category : eventPreview?.event.category) === "Sports" ? (
                  <button
                    disabled
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gray-700 py-3 font-medium text-gray-400 opacity-60 cursor-not-allowed"
                  >
                    <Lock className="h-4 w-4" />
                    Not Available Yet
                  </button>
                ) : (
                  <button
                    onClick={handleAddBet}
                    disabled={
                      (inputMode === "search" ? !selectedEvent : !eventPreview) ||
                      createBet.isPending
                    }
                    className="cursor-pointer flex-1 rounded-lg bg-[#CDFF00] py-3 font-medium text-black transition-colors hover:bg-[#b8e600] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {createBet.isPending ? "Adding..." : "Add Bet"}
                  </button>
                )}
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

        {/* Sports Notification Toast */}
        <AnimatePresence>
          {showSportsNotification && (
            <motion.div
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="fixed bottom-8 right-8 z-50 w-80"
            >
              <div className="rounded-xl border border-amber-800/50 bg-gray-900 p-4 shadow-2xl">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-amber-900/50">
                    <Trophy className="h-5 w-5 text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-amber-200">Sports Coming Soon!</h3>
                    <p className="mt-1 text-sm text-amber-200/70">
                      Want to be notified when sports tracking is available?
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        onClick={() => setSportsInterest.mutate({ interested: true })}
                        disabled={setSportsInterest.isPending}
                        className="flex items-center gap-1.5 rounded-lg bg-amber-700/50 px-3 py-1.5 text-sm font-medium text-amber-100 transition-colors hover:bg-amber-700/70 disabled:opacity-50"
                      >
                        <Bell className="h-3.5 w-3.5" />
                        {setSportsInterest.isPending ? "Saving..." : "Notify me"}
                      </button>
                      <button
                        onClick={() => setShowSportsNotification(false)}
                        className="rounded-lg px-3 py-1.5 text-sm text-gray-400 transition-colors hover:text-gray-300"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowSportsNotification(false)}
                    className="cursor-pointer text-gray-500 hover:text-gray-400"
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

        {/* Phone Collection Modal */}
        <PhoneCollectionModal
          isOpen={showPhoneModal}
          onClose={() => setShowPhoneModal(false)}
          onSuccess={() => setShowPhoneModal(false)}
          eventTitle={lastAddedEventTitle ?? undefined}
        />

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
          filteredBets.length > 0 ? (
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
            {filteredBets.map((bet) => (
              <motion.div
                key={bet.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-gray-800 bg-gray-900 overflow-hidden"
              >
                {/* Card Header */}
                <div className="flex items-center justify-between p-6 pb-4">
                  <div className="flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="text-xs text-[#CDFF00]">{bet.category}</span>
                      {!bet.isActive && (
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          bet.result === "yes"
                            ? "bg-green-900/50 text-green-400"
                            : bet.result === "no"
                            ? "bg-red-900/50 text-red-400"
                            : "bg-gray-700 text-gray-400"
                        }`}>
                          {bet.result === "yes" ? "Resolved: Yes" : bet.result === "no" ? "Resolved: No" : "Closed"}
                        </span>
                      )}
                    </div>
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
            // Empty state for filtered results (bets exist but none match filter)
            <div className="rounded-xl border border-gray-800 bg-gray-900 p-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-800">
                {betFilter === "active" ? (
                  <Clock className="h-8 w-8 text-gray-500" />
                ) : (
                  <CheckCircle className="h-8 w-8 text-gray-500" />
                )}
              </div>
              <h2 className="mb-2 text-lg font-semibold text-white">
                {betFilter === "active" ? "No active bets" : "No past bets"}
              </h2>
              <p className="text-sm text-gray-400">
                {betFilter === "active"
                  ? "All your bets have been resolved."
                  : "You don't have any resolved bets yet."}
              </p>
              <button
                onClick={() => setBetFilter(betFilter === "active" ? "past" : "active")}
                className="mt-4 text-sm text-[#CDFF00] hover:underline"
              >
                View {betFilter === "active" ? "past" : "active"} bets
              </button>
            </div>
          )
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
      </div>
    </>
  );
}
