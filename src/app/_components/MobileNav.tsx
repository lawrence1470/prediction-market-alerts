"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  X,
  LayoutDashboard,
  Bell,
  CreditCard,
  Phone,
  LogOut,
  Crown,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { authClient } from "~/server/better-auth/client";
import { api } from "~/trpc/react";

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  tier: "FREE" | "PRO";
  activeAlertCount: number;
  onOpenPhoneSettings?: () => void;
}

export function MobileNav({
  isOpen,
  onClose,
  email,
  tier,
  activeAlertCount,
  onOpenPhoneSettings,
}: MobileNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const createPortal = api.subscription.createPortalSession.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
  });

  // Close on route change
  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      closeButtonRef.current?.focus();
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, onClose]);

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/");
  };

  const handleBilling = () => {
    onClose();
    createPortal.mutate();
  };

  const handlePhoneSettings = () => {
    onClose();
    onOpenPhoneSettings?.();
  };

  const navItems = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      active: pathname === "/dashboard",
    },
    {
      href: "/dashboard/alerts",
      label: "Alerts",
      icon: Bell,
      active: pathname === "/dashboard/alerts",
      badge: activeAlertCount > 0 ? activeAlertCount : undefined,
    },
    {
      href: "/pricing",
      label: "Pricing",
      icon: CreditCard,
      active: pathname === "/pricing",
      upgradeBadge: tier === "FREE",
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden"
          />

          {/* Slide-out Menu */}
          <motion.div
            ref={menuRef}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-y-0 right-0 z-50 w-72 bg-gray-900 shadow-xl md:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-800 p-4">
              <div>
                <p className="truncate text-sm font-medium text-white">{email}</p>
                <div className="mt-0.5 flex items-center gap-1.5">
                  {tier === "PRO" ? (
                    <>
                      <Crown className="h-3 w-3 text-[#CDFF00]" />
                      <span className="text-xs text-[#CDFF00]">Pro</span>
                    </>
                  ) : (
                    <span className="text-xs text-gray-500">Free Plan</span>
                  )}
                </div>
              </div>
              <button
                ref={closeButtonRef}
                onClick={onClose}
                className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Navigation Links */}
            <nav className="p-4">
              <ul className="space-y-1">
                {navItems.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                        item.active
                          ? "bg-[#CDFF00]/10 text-[#CDFF00]"
                          : "text-gray-300 hover:bg-gray-800 hover:text-white"
                      }`}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.label}
                      {item.badge && (
                        <span className="ml-auto rounded-full bg-[#CDFF00] px-2 py-0.5 text-xs font-medium text-black">
                          {item.badge}
                        </span>
                      )}
                      {item.upgradeBadge && (
                        <span className="ml-auto rounded-full bg-[#CDFF00]/20 px-2 py-0.5 text-xs font-medium text-[#CDFF00]">
                          Upgrade
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Account Actions */}
            <div className="border-t border-gray-800 p-4">
              <ul className="space-y-1">
                <li>
                  <button
                    onClick={handlePhoneSettings}
                    className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm text-gray-300 transition-colors hover:bg-gray-800 hover:text-white"
                  >
                    <Phone className="h-5 w-5" />
                    Phone Settings
                  </button>
                </li>
                {tier === "PRO" && (
                  <li>
                    <button
                      onClick={handleBilling}
                      disabled={createPortal.isPending}
                      className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm text-gray-300 transition-colors hover:bg-gray-800 hover:text-white disabled:opacity-50"
                    >
                      {createPortal.isPending ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <CreditCard className="h-5 w-5" />
                      )}
                      Manage Billing
                    </button>
                  </li>
                )}
                <li>
                  <button
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm text-gray-300 transition-colors hover:bg-gray-800 hover:text-white"
                  >
                    <LogOut className="h-5 w-5" />
                    Sign out
                  </button>
                </li>
              </ul>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
