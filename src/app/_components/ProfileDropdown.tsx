"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  LogOut,
  Phone,
  CreditCard,
  ChevronDown,
  Crown,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { authClient } from "~/server/better-auth/client";
import { api } from "~/trpc/react";

interface ProfileDropdownProps {
  email: string;
  tier: "FREE" | "PRO";
  onOpenPhoneSettings?: () => void;
}

export function ProfileDropdown({
  email,
  tier,
  onOpenPhoneSettings,
}: ProfileDropdownProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const createPortal = api.subscription.createPortalSession.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
  });

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen]);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await authClient.signOut();
    router.push("/");
  };

  const handleBilling = () => {
    setIsOpen(false);
    createPortal.mutate();
  };

  const handlePhoneSettings = () => {
    setIsOpen(false);
    onOpenPhoneSettings?.();
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="flex items-center gap-2 rounded-full bg-gray-800 px-4 py-2 text-gray-300 transition-colors hover:bg-gray-700"
      >
        <User className="h-4 w-4 text-gray-400" />
        <span className="hidden text-sm sm:inline">{email}</span>
        <ChevronDown
          className={`h-4 w-4 text-gray-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full z-50 mt-2 w-64 origin-top-right rounded-xl border border-gray-800 bg-gray-900 py-2 shadow-xl"
            role="menu"
            aria-orientation="vertical"
          >
            {/* User Info */}
            <div className="border-b border-gray-800 px-4 py-3">
              <p className="truncate text-sm font-medium text-white">{email}</p>
              <div className="mt-1 flex items-center gap-1.5">
                {tier === "PRO" ? (
                  <>
                    <Crown className="h-3.5 w-3.5 text-[#CDFF00]" />
                    <span className="text-xs text-[#CDFF00]">Pro</span>
                  </>
                ) : (
                  <span className="text-xs text-gray-500">Free Plan</span>
                )}
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-1">
              <button
                onClick={handlePhoneSettings}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-300 transition-colors hover:bg-gray-800 hover:text-white"
                role="menuitem"
              >
                <Phone className="h-4 w-4 text-gray-400" />
                Phone Settings
              </button>

              {tier === "PRO" ? (
                <button
                  onClick={handleBilling}
                  disabled={createPortal.isPending}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-300 transition-colors hover:bg-gray-800 hover:text-white disabled:opacity-50"
                  role="menuitem"
                >
                  {createPortal.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                  ) : (
                    <CreditCard className="h-4 w-4 text-gray-400" />
                  )}
                  Manage Billing
                </button>
              ) : (
                <Link
                  href="/pricing"
                  onClick={() => setIsOpen(false)}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-[#CDFF00] transition-colors hover:bg-gray-800"
                  role="menuitem"
                >
                  <Crown className="h-4 w-4" />
                  Upgrade to Pro
                </Link>
              )}
            </div>

            {/* Sign Out */}
            <div className="border-t border-gray-800 pt-1">
              <button
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-300 transition-colors hover:bg-gray-800 hover:text-white disabled:opacity-50"
                role="menuitem"
              >
                {isSigningOut ? (
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                ) : (
                  <LogOut className="h-4 w-4 text-gray-400" />
                )}
                {isSigningOut ? "Signing out..." : "Sign out"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
