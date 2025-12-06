"use client";

import { useState } from "react";
import Link from "next/link";
import { TrendingUp, Check, X, Loader2, Zap } from "lucide-react";
import { api } from "~/trpc/react";

const FREE_FEATURES = [
  { text: "1 active alert", included: true },
  { text: "3 notifications per alert", included: true },
  { text: "Email notifications", included: true },
  { text: "Basic news sources", included: true },
  { text: "Unlimited alerts", included: false },
  { text: "Unlimited notifications", included: false },
  { text: "Priority support", included: false },
];

const PRO_FEATURES = [
  { text: "Up to 20 active alerts", included: true },
  { text: "Unlimited notifications", included: true },
  { text: "Email notifications", included: true },
  { text: "All news sources", included: true },
  { text: "SMS notifications (coming soon)", included: true },
  { text: "Priority support", included: true },
  { text: "Early access to new features", included: true },
];

export default function PricingPage() {
  const [interval, setInterval] = useState<"monthly" | "yearly">("monthly");
  const [isLoading, setIsLoading] = useState(false);

  const { data: subscription } = api.subscription.getSubscription.useQuery();
  const createCheckout = api.subscription.createCheckoutSession.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error) => {
      console.error("Checkout error:", error);
      setIsLoading(false);
    },
  });

  const isProUser = subscription?.tier === "PRO";

  const handleUpgrade = () => {
    setIsLoading(true);
    createCheckout.mutate({ interval });
  };

  const monthlyPrice = 4.99;
  const yearlyPrice = 49.99;
  const yearlyMonthly = (yearlyPrice / 12).toFixed(2);
  const yearlySavings = Math.round(((monthlyPrice * 12 - yearlyPrice) / (monthlyPrice * 12)) * 100);

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-800 bg-black">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <Link href="/" className="flex items-center">
              <TrendingUp className="mr-2 h-6 w-6 text-[#CDFF00]" />
              <span className="text-xl font-semibold text-white">Kalshi Tracker</span>
            </Link>
            <div className="flex items-center gap-8">
              <Link href="/dashboard" className="text-gray-400 transition-colors hover:text-white">
                Dashboard
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-[#CDFF00] px-6 py-2.5 font-medium text-black transition-colors hover:bg-[#b8e600]"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mb-6 inline-block rounded-full bg-[#CDFF00] px-4 py-1 text-sm font-medium text-black">
              PRICING
            </div>
            <h1 className="mb-6 text-4xl font-bold text-white sm:text-5xl lg:text-6xl">
              Simple, transparent pricing
            </h1>
            <p className="mx-auto mb-12 max-w-2xl text-lg text-gray-400">
              Start free and upgrade when you need more alerts. Cancel anytime.
            </p>

            {/* Billing Toggle */}
            <div className="mb-16 flex items-center justify-center gap-4">
              <span className={`text-sm ${interval === "monthly" ? "text-white" : "text-gray-500"}`}>
                Monthly
              </span>
              <button
                onClick={() => setInterval(interval === "monthly" ? "yearly" : "monthly")}
                className="relative h-8 w-14 rounded-full bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-[#CDFF00] focus:ring-offset-2 focus:ring-offset-black"
              >
                <span
                  className={`absolute left-1 top-1 h-6 w-6 rounded-full bg-[#CDFF00] transition-transform ${
                    interval === "yearly" ? "translate-x-6" : ""
                  }`}
                />
              </button>
              <span className={`text-sm ${interval === "yearly" ? "text-white" : "text-gray-500"}`}>
                Yearly
              </span>
              {interval === "yearly" && (
                <span className="ml-2 rounded-full bg-green-500/20 px-3 py-1 text-xs font-medium text-green-400">
                  Save {yearlySavings}%
                </span>
              )}
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-2">
            {/* Free Tier */}
            <div className="rounded-3xl border border-gray-800 bg-gray-900 p-8">
              <div className="mb-6">
                <h3 className="mb-2 text-2xl font-bold text-white">Free</h3>
                <p className="text-gray-400">Perfect for getting started</p>
              </div>

              <div className="mb-8">
                <div className="flex items-baseline">
                  <span className="text-5xl font-bold text-white">$0</span>
                  <span className="ml-2 text-gray-400">/month</span>
                </div>
              </div>

              <ul className="mb-8 space-y-4">
                {FREE_FEATURES.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    {feature.included ? (
                      <Check className="h-5 w-5 flex-shrink-0 text-[#CDFF00]" />
                    ) : (
                      <X className="h-5 w-5 flex-shrink-0 text-gray-600" />
                    )}
                    <span className={feature.included ? "text-gray-300" : "text-gray-600"}>
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                href="/signup"
                className="block w-full rounded-full border border-gray-700 bg-transparent py-3 text-center font-medium text-white transition-colors hover:border-gray-600 hover:bg-gray-800"
              >
                Get Started Free
              </Link>
            </div>

            {/* Pro Tier */}
            <div className="relative rounded-3xl border-2 border-[#CDFF00] bg-gray-900 p-8">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="inline-flex items-center gap-1 rounded-full bg-[#CDFF00] px-4 py-1 text-sm font-medium text-black">
                  <Zap className="h-4 w-4" />
                  Most Popular
                </span>
              </div>

              <div className="mb-6">
                <h3 className="mb-2 text-2xl font-bold text-white">Pro</h3>
                <p className="text-gray-400">For serious traders</p>
              </div>

              <div className="mb-8">
                <div className="flex items-baseline">
                  <span className="text-5xl font-bold text-white">
                    ${interval === "monthly" ? monthlyPrice : yearlyMonthly}
                  </span>
                  <span className="ml-2 text-gray-400">/month</span>
                </div>
                {interval === "yearly" && (
                  <p className="mt-2 text-sm text-gray-400">
                    Billed ${yearlyPrice} annually
                  </p>
                )}
              </div>

              <ul className="mb-8 space-y-4">
                {PRO_FEATURES.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <Check className="h-5 w-5 flex-shrink-0 text-[#CDFF00]" />
                    <span className="text-gray-300">{feature.text}</span>
                  </li>
                ))}
              </ul>

              {isProUser ? (
                <div className="w-full rounded-full bg-gray-700 py-3 text-center font-medium text-gray-300">
                  Current Plan
                </div>
              ) : (
                <button
                  onClick={handleUpgrade}
                  disabled={isLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-[#CDFF00] py-3 font-medium text-black transition-colors hover:bg-[#b8e600] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Redirecting...
                    </>
                  ) : (
                    <>
                      Upgrade to Pro
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="border-t border-gray-800 py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-12 text-center text-3xl font-bold text-white">
            Frequently Asked Questions
          </h2>

          <div className="space-y-8">
            <div>
              <h3 className="mb-3 text-lg font-semibold text-white">
                Can I cancel anytime?
              </h3>
              <p className="text-gray-400">
                Yes! You can cancel your subscription at any time. You&apos;ll continue to have access
                to Pro features until the end of your billing period.
              </p>
            </div>

            <div>
              <h3 className="mb-3 text-lg font-semibold text-white">
                What happens to my alerts if I downgrade?
              </h3>
              <p className="text-gray-400">
                If you downgrade from Pro to Free, we&apos;ll pause your excess alerts (keeping your most recent one active).
                Your alert configurations are preserved and can be reactivated when you upgrade again.
              </p>
            </div>

            <div>
              <h3 className="mb-3 text-lg font-semibold text-white">
                What payment methods do you accept?
              </h3>
              <p className="text-gray-400">
                We accept all major credit cards (Visa, Mastercard, American Express) through our
                secure payment provider, Stripe.
              </p>
            </div>

            <div>
              <h3 className="mb-3 text-lg font-semibold text-white">
                Is there a free trial?
              </h3>
              <p className="text-gray-400">
                Our Free tier is essentially a perpetual trial! You can use 1 alert with up to 3
                notifications for free, forever. Upgrade to Pro when you need more.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-gray-400">
            &copy; {new Date().getFullYear()} Kalshi Tracker. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
