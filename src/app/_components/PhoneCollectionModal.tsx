"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Phone,
  X,
  Loader2,
  AlertCircle,
  Check,
  Smartphone,
  Zap,
  Shield,
} from "lucide-react";
import { api } from "~/trpc/react";

interface PhoneCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  eventTitle?: string;
}

export function PhoneCollectionModal({
  isOpen,
  onClose,
  onSuccess,
  eventTitle,
}: PhoneCollectionModalProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const utils = api.useUtils();

  const setPhoneMutation = api.user.setPhoneNumber.useMutation({
    onSuccess: () => {
      void utils.user.getPreferences.invalidate();
      onSuccess();
    },
    onError: (err) => {
      setError(err.message || "Failed to save phone number. Please try again.");
    },
  });

  const dismissMutation = api.user.dismissPhonePrompt.useMutation({
    onSuccess: () => {
      void utils.user.getPreferences.invalidate();
      onClose();
    },
  });

  // Format phone number as user types (US format)
  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, "");
    const limited = digits.slice(0, 10);

    if (limited.length === 0) return "";
    if (limited.length <= 3) return `(${limited}`;
    if (limited.length <= 6)
      return `(${limited.slice(0, 3)}) ${limited.slice(3)}`;
    return `(${limited.slice(0, 3)}) ${limited.slice(3, 6)}-${limited.slice(6)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
    setError(null);
  };

  const handleSubmit = () => {
    const digits = phoneNumber.replace(/\D/g, "");
    if (digits.length !== 10) {
      setError("Please enter a valid 10-digit phone number");
      return;
    }
    setPhoneMutation.mutate({ phone: phoneNumber });
  };

  const handleDismiss = () => {
    dismissMutation.mutate();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && isValidPhone) {
      handleSubmit();
    }
  };

  const isValidPhone = phoneNumber.replace(/\D/g, "").length === 10;
  const truncatedTitle = eventTitle
    ? eventTitle.length > 35
      ? `${eventTitle.slice(0, 35)}...`
      : eventTitle
    : null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
          onClick={handleDismiss}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-[420px] overflow-hidden rounded-2xl border border-gray-800 bg-gradient-to-b from-gray-900 to-gray-950 shadow-2xl"
          >
            {/* Subtle gradient accent at top */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#CDFF00]/50 to-transparent" />

            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="absolute right-4 top-4 rounded-full p-1 text-gray-500 transition-colors hover:bg-gray-800 hover:text-gray-300"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="p-6 pt-8">
              {/* Header with animated icon */}
              <div className="mb-5 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 15,
                    delay: 0.1,
                  }}
                  className="relative mx-auto mb-4 flex h-16 w-16 items-center justify-center"
                >
                  {/* Outer glow ring */}
                  <div className="absolute inset-0 rounded-full bg-[#CDFF00]/10" />
                  <div className="absolute inset-1 rounded-full bg-[#CDFF00]/20" />
                  {/* Icon container */}
                  <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-[#CDFF00]">
                    <Smartphone className="h-6 w-6 text-black" />
                  </div>
                  {/* Animated pulse */}
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-[#CDFF00]/40"
                    animate={{ scale: [1, 1.2], opacity: [0.5, 0] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeOut",
                    }}
                  />
                </motion.div>

                <h2 className="text-xl font-semibold tracking-tight text-white">
                  Get Instant SMS Alerts
                </h2>
                <p className="mt-1.5 text-sm text-gray-400">
                  Breaking news delivered to your phone in seconds
                </p>
              </div>

              {/* SMS Preview - styled like an actual text message */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="mb-5"
              >
                <div className="rounded-xl bg-gray-800/50 p-3">
                  {/* SMS bubble */}
                  <div className="relative rounded-2xl rounded-tl-sm bg-[#1a1a1a] border border-gray-700/50 p-3.5 shadow-sm">
                    {/* Sender label */}
                    <div className="mb-1.5 flex items-center gap-1.5">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#CDFF00]">
                        <Zap className="h-3 w-3 text-black" />
                      </div>
                      <span className="text-xs font-medium text-[#CDFF00]">
                        Kalshi Tracker
                      </span>
                      <span className="ml-auto text-[10px] text-gray-500">
                        now
                      </span>
                    </div>
                    {/* Message content */}
                    <p className="text-[13px] leading-relaxed text-gray-200">
                      {truncatedTitle ? (
                        <>
                          <span className="font-medium text-white">
                            BREAKING:
                          </span>{" "}
                          New development in &ldquo;{truncatedTitle}&rdquo;
                        </>
                      ) : (
                        <>
                          <span className="font-medium text-white">
                            BREAKING:
                          </span>{" "}
                          Major announcement affecting your tracked market
                        </>
                      )}
                    </p>
                    {/* Delivery indicator */}
                    <div className="mt-2 flex items-center gap-1 text-[10px] text-gray-500">
                      <Zap className="h-3 w-3 text-[#CDFF00]" />
                      <span>Delivered in ~30 seconds</span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Phone Input */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-5"
              >
                <label
                  htmlFor="phone"
                  className="mb-2 block text-sm font-medium text-gray-300"
                >
                  Your mobile number
                </label>
                <div className="relative">
                  <div
                    className={`pointer-events-none absolute left-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg transition-colors ${
                      isFocused || phoneNumber
                        ? "bg-[#CDFF00]/20 text-[#CDFF00]"
                        : "bg-gray-700/50 text-gray-500"
                    }`}
                  >
                    <Phone className="h-4 w-4" />
                  </div>
                  <input
                    id="phone"
                    type="tel"
                    value={phoneNumber}
                    onChange={handlePhoneChange}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    onKeyDown={handleKeyDown}
                    placeholder="(555) 123-4567"
                    autoComplete="tel"
                    autoFocus
                    className={`w-full rounded-xl border-2 bg-gray-800/50 py-3.5 pl-14 pr-12 text-base text-white placeholder-gray-500 transition-all focus:outline-none ${
                      error
                        ? "border-red-500/50 focus:border-red-500"
                        : isValidPhone
                          ? "border-green-500/50 focus:border-green-500"
                          : "border-gray-700/50 focus:border-[#CDFF00]"
                    }`}
                  />
                  {/* Validation indicator */}
                  <AnimatePresence>
                    {isValidPhone && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-green-500/20"
                      >
                        <Check className="h-4 w-4 text-green-400" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                {/* Error message */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="mt-2 flex items-center gap-1.5 text-sm text-red-400"
                    >
                      <AlertCircle className="h-4 w-4" />
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Trust indicators */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 }}
                className="mb-5 flex items-center justify-center gap-4 text-[11px] text-gray-500"
              >
                <span className="flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  Real-time alerts
                </span>
                <span className="h-3 w-px bg-gray-700" />
                <span className="flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  Never sold
                </span>
                <span className="h-3 w-px bg-gray-700" />
                <span>Unsubscribe anytime</span>
              </motion.div>

              {/* Actions */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-3"
              >
                <button
                  onClick={handleSubmit}
                  disabled={!isValidPhone || setPhoneMutation.isPending}
                  className="group relative flex w-full cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-xl bg-[#CDFF00] py-3.5 font-semibold text-black transition-all hover:bg-[#d4ff33] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {/* Shine effect on hover */}
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
                  {setPhoneMutation.isPending ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Enabling...
                    </>
                  ) : (
                    <>
                      <Zap className="h-5 w-5" />
                      Enable SMS Alerts
                    </>
                  )}
                </button>

                <button
                  onClick={handleDismiss}
                  disabled={dismissMutation.isPending}
                  className="w-full cursor-pointer py-2.5 text-sm text-gray-400 transition-colors hover:text-gray-300 disabled:opacity-50"
                >
                  Maybe later
                </button>

                <p className="text-center text-[11px] text-gray-600">
                  You can always enable this in Settings
                </p>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
