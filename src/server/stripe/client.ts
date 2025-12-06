import Stripe from "stripe";
import { env } from "~/env";

// Initialize Stripe client (only if secret key is available)
export const stripe = env.STRIPE_SECRET_KEY
  ? new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-11-17.clover",
      typescript: true,
    })
  : null;

// Tier configuration
export const TIER_LIMITS = {
  FREE: {
    maxAlerts: 1,
    maxNotificationsPerAlert: 3,
  },
  PRO: {
    maxAlerts: 20,
    maxNotificationsPerAlert: -1, // unlimited
  },
} as const;

// Price IDs from environment
export const STRIPE_PRICES = {
  PRO_MONTHLY: env.STRIPE_PRO_MONTHLY_PRICE_ID,
  PRO_YEARLY: env.STRIPE_PRO_YEARLY_PRICE_ID,
} as const;

// Helper to check if user is on pro tier
export function isProTier(tier: string): boolean {
  return tier === "PRO";
}

// Helper to check if user can add more alerts
export function canAddAlert(currentCount: number, maxAlerts: number): boolean {
  return currentCount < maxAlerts;
}

// Helper to check if notification limit reached
export function isNotificationLimitReached(
  sent: number,
  max: number
): boolean {
  if (max === -1) return false; // unlimited
  return sent >= max;
}
