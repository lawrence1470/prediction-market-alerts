/**
 * Stripe Webhook Handler
 *
 * Handles Stripe webhook events for subscription management.
 * Events: checkout.session.completed, subscription.updated, subscription.deleted, invoice.payment_failed
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "~/server/db";
import { env } from "~/env";
import { TIER_LIMITS } from "~/server/stripe/client";

// Initialize Stripe
const stripe = env.STRIPE_SECRET_KEY
  ? new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-11-17.clover",
    })
  : null;

export async function POST(req: Request) {
  if (!stripe || !env.STRIPE_WEBHOOK_SECRET) {
    console.error("[Stripe Webhook] Stripe not configured");
    return NextResponse.json(
      { error: "Stripe not configured" },
      { status: 500 }
    );
  }

  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    console.error("[Stripe Webhook] No signature");
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("[Stripe Webhook] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  console.log("[Stripe Webhook] Received:", event.type);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        await handleCheckoutCompleted(event.data.object);
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.created": {
        await handleSubscriptionUpdate(event.data.object);
        break;
      }

      case "customer.subscription.deleted": {
        await handleSubscriptionDeleted(event.data.object);
        break;
      }

      case "invoice.payment_failed": {
        await handlePaymentFailed(event.data.object);
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Stripe Webhook] Handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  if (!userId) {
    console.error("[Stripe Webhook] No userId in checkout session metadata");
    return;
  }

  const subscriptionId = session.subscription as string;
  if (!subscriptionId || !stripe) return;

  const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);
  await updateSubscription(userId, stripeSubscription);

  console.log("[Stripe Webhook] Checkout completed:", { userId, subscriptionId });
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const dbSubscription = await db.subscription.findUnique({
    where: { stripeCustomerId: customerId },
  });

  if (!dbSubscription) {
    console.error("[Stripe Webhook] No subscription found for customer:", customerId);
    return;
  }

  await updateSubscription(dbSubscription.userId, subscription);
  console.log("[Stripe Webhook] Subscription updated:", { userId: dbSubscription.userId });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const dbSubscription = await db.subscription.findUnique({
    where: { stripeCustomerId: customerId },
  });

  if (!dbSubscription) {
    console.error("[Stripe Webhook] No subscription found for customer:", customerId);
    return;
  }

  // Downgrade to free tier
  await db.subscription.update({
    where: { userId: dbSubscription.userId },
    data: {
      tier: "FREE",
      status: "CANCELED",
      stripeSubscriptionId: null,
      stripePriceId: null,
      maxAlerts: TIER_LIMITS.FREE.maxAlerts,
      maxNotificationsPerAlert: TIER_LIMITS.FREE.maxNotificationsPerAlert,
      currentPeriodStart: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    },
  });

  // Pause excess alerts (keep most recent, pause others)
  const alerts = await db.userAlert.findMany({
    where: { userId: dbSubscription.userId, status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
  });

  if (alerts.length > TIER_LIMITS.FREE.maxAlerts) {
    const alertsToPause = alerts.slice(TIER_LIMITS.FREE.maxAlerts);
    await db.userAlert.updateMany({
      where: {
        id: { in: alertsToPause.map((a) => a.id) },
      },
      data: { status: "PAUSED" },
    });

    console.log("[Stripe Webhook] Paused excess alerts:", {
      userId: dbSubscription.userId,
      pausedCount: alertsToPause.length,
    });
  }

  console.log("[Stripe Webhook] Subscription deleted, downgraded to FREE:", {
    userId: dbSubscription.userId,
  });
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  const dbSubscription = await db.subscription.findUnique({
    where: { stripeCustomerId: customerId },
  });

  if (!dbSubscription) {
    console.error("[Stripe Webhook] No subscription found for customer:", customerId);
    return;
  }

  await db.subscription.update({
    where: { userId: dbSubscription.userId },
    data: { status: "PAST_DUE" },
  });

  console.log("[Stripe Webhook] Payment failed, marked as PAST_DUE:", {
    userId: dbSubscription.userId,
  });

  // TODO: Send email notification to user about failed payment
}

async function updateSubscription(
  userId: string,
  stripeSubscription: Stripe.Subscription
) {
  const subscriptionItem = stripeSubscription.items.data[0];
  const priceId = subscriptionItem?.price.id;

  // Get billing period from subscription item (new API structure)
  const currentPeriodStart = subscriptionItem?.current_period_start
    ? new Date(subscriptionItem.current_period_start * 1000)
    : null;
  const currentPeriodEnd = subscriptionItem?.current_period_end
    ? new Date(subscriptionItem.current_period_end * 1000)
    : null;

  // Map status
  const statusMap: Record<string, "ACTIVE" | "PAST_DUE" | "CANCELED" | "INCOMPLETE" | "TRIALING"> = {
    active: "ACTIVE",
    past_due: "PAST_DUE",
    canceled: "CANCELED",
    incomplete: "INCOMPLETE",
    trialing: "TRIALING",
    incomplete_expired: "CANCELED",
    unpaid: "PAST_DUE",
    paused: "CANCELED",
  };

  const status = statusMap[stripeSubscription.status] ?? "ACTIVE";

  await db.subscription.upsert({
    where: { userId },
    create: {
      userId,
      stripeCustomerId: stripeSubscription.customer as string,
      stripeSubscriptionId: stripeSubscription.id,
      stripePriceId: priceId,
      tier: "PRO",
      status,
      maxAlerts: TIER_LIMITS.PRO.maxAlerts,
      maxNotificationsPerAlert: TIER_LIMITS.PRO.maxNotificationsPerAlert,
      currentPeriodStart,
      currentPeriodEnd,
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
    },
    update: {
      stripeSubscriptionId: stripeSubscription.id,
      stripePriceId: priceId,
      tier: "PRO",
      status,
      maxAlerts: TIER_LIMITS.PRO.maxAlerts,
      maxNotificationsPerAlert: TIER_LIMITS.PRO.maxNotificationsPerAlert,
      currentPeriodStart,
      currentPeriodEnd,
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
    },
  });
}
