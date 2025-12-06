"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { TrendingUp, LayoutDashboard, Bell, CreditCard, Menu } from "lucide-react";
import { authClient } from "~/server/better-auth/client";
import { api } from "~/trpc/react";
import { ProfileDropdown } from "./ProfileDropdown";
import { MobileNav } from "./MobileNav";
import { PhoneCollectionModal } from "./PhoneCollectionModal";

export function DashboardHeader() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);

  const { data: session } = authClient.useSession();
  const { data: subscription, isLoading: subscriptionLoading } =
    api.subscription.getSubscription.useQuery(undefined, {
      enabled: !!session,
    });
  const { data: alerts } = api.alert.getAlerts.useQuery(undefined, {
    enabled: !!session,
  });

  const tier = subscription?.tier ?? "FREE";
  const activeAlertCount = alerts?.filter((a) => a.status === "ACTIVE").length ?? 0;

  const handleCloseMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  const handleOpenPhoneSettings = useCallback(() => {
    setIsPhoneModalOpen(true);
  }, []);

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

  // Show skeleton while loading session
  if (!session) {
    return (
      <header className="sticky top-0 z-40 border-b border-gray-800 bg-black">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-[73px] items-center justify-between">
            <div className="flex items-center">
              <TrendingUp className="mr-2 h-6 w-6 text-[#CDFF00]" />
              <span className="text-xl font-semibold text-white">Kalshi Tracker</span>
            </div>
            <div className="h-8 w-32 animate-pulse rounded-full bg-gray-800" />
          </div>
        </div>
      </header>
    );
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-gray-800 bg-black">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center">
              <TrendingUp className="mr-2 h-6 w-6 text-[#CDFF00]" />
              <span className="text-xl font-semibold text-white">Kalshi Tracker</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden items-center gap-1 md:flex">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    item.active
                      ? "bg-[#CDFF00]/10 text-[#CDFF00]"
                      : "text-gray-400 hover:bg-gray-800 hover:text-white"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                  {item.badge && (
                    <span className="rounded-full bg-[#CDFF00] px-1.5 py-0.5 text-xs font-medium text-black">
                      {item.badge}
                    </span>
                  )}
                  {item.upgradeBadge && (
                    <span className="rounded-full bg-[#CDFF00]/20 px-1.5 py-0.5 text-xs font-medium text-[#CDFF00]">
                      Upgrade
                    </span>
                  )}
                </Link>
              ))}
            </nav>

            {/* Desktop Profile */}
            <div className="hidden md:block">
              {subscriptionLoading ? (
                <div className="h-10 w-40 animate-pulse rounded-full bg-gray-800" />
              ) : (
                <ProfileDropdown
                  email={session.user.email}
                  tier={tier}
                  onOpenPhoneSettings={handleOpenPhoneSettings}
                />
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white md:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <MobileNav
        isOpen={isMobileMenuOpen}
        onClose={handleCloseMobileMenu}
        email={session.user.email}
        tier={tier}
        activeAlertCount={activeAlertCount}
        onOpenPhoneSettings={handleOpenPhoneSettings}
      />

      {/* Phone Settings Modal */}
      <PhoneCollectionModal
        isOpen={isPhoneModalOpen}
        onClose={() => setIsPhoneModalOpen(false)}
        onSuccess={() => setIsPhoneModalOpen(false)}
      />
    </>
  );
}
