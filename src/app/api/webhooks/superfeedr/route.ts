/**
 * Superfeedr Webhook Endpoint
 *
 * Receives real-time news notifications from Superfeedr and sends email alerts.
 *
 * Flow:
 * 1. Verify X-Hub-Signature header
 * 2. Parse payload and extract articles
 * 3. Find users subscribed to this event
 * 4. Send email to each user (continue on partial failures)
 * 5. Always return 200 to acknowledge receipt
 */

import { NextResponse } from "next/server";
import { db } from "~/server/db";
import { verifySignature } from "~/server/services/superfeedr";
import { sendNewsAlert, type ArticleData } from "~/server/services/email";
import { sendSmsAlert } from "~/server/services/sms";
import { formatEventTitle } from "~/server/utils/event-title";

interface SuperfeedrItem {
  id: string;
  title: string;
  summary?: string;
  permalinkUrl?: string;
  published?: number;
  actor?: {
    displayName?: string;
  };
}

interface SuperfeedrPayload {
  status?: {
    code?: number;
    feed?: string;
  };
  items?: SuperfeedrItem[];
}

export async function POST(request: Request) {
  try {
    // Get raw body for signature verification
    const rawBody = await request.text();
    const signature = request.headers.get("X-Hub-Signature");

    // Parse the topic URL from status.feed to identify the webhook
    let payload: SuperfeedrPayload;
    try {
      payload = JSON.parse(rawBody) as SuperfeedrPayload;
    } catch {
      console.error("[Webhook] Failed to parse payload");
      // Still return 200 to prevent retries
      return NextResponse.json({ received: true, error: "Invalid JSON" });
    }

    const topicUrl = payload.status?.feed;
    if (!topicUrl) {
      console.error("[Webhook] No topic URL in payload");
      return NextResponse.json({ received: true, error: "No topic URL" });
    }

    // Find the EventWebhook for this topic
    const eventWebhook = await db.eventWebhook.findUnique({
      where: { superfeedrTopic: topicUrl },
    });

    if (!eventWebhook) {
      console.warn("[Webhook] No webhook found for topic:", topicUrl);
      // Stale subscription - return 200 to prevent retries
      return NextResponse.json({ received: true, stale: true });
    }

    // Verify signature
    if (!signature || !verifySignature(rawBody, signature, eventWebhook.superfeedrSecret)) {
      console.error("[Webhook] Invalid signature for topic:", topicUrl);
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Extract articles from payload
    const items = payload.items ?? [];
    if (items.length === 0) {
      console.log("[Webhook] No items in payload for:", eventWebhook.eventTicker);
      return NextResponse.json({ received: true, items: 0 });
    }

    // Find all active user alerts for this event
    const userAlerts = await db.userAlert.findMany({
      where: {
        eventTicker: eventWebhook.eventTicker,
        status: "ACTIVE",
      },
      include: {
        user: {
          select: {
            email: true,
            phone: true,
          },
        },
      },
    });

    if (userAlerts.length === 0) {
      console.log("[Webhook] No active alerts for:", eventWebhook.eventTicker);
      return NextResponse.json({ received: true, alerts: 0 });
    }

    // Build event title from the ticker for email subject
    const eventTitle = formatEventTitle(eventWebhook.eventTicker);

    // Process each article
    let emailsSent = 0;
    let emailsFailed = 0;
    let smsSent = 0;
    let smsFailed = 0;

    for (const item of items) {
      const article: ArticleData = {
        title: item.title ?? "News Update",
        summary: item.summary,
        url: item.permalinkUrl ?? "#",
        source: item.actor?.displayName,
        publishedAt: item.published ? new Date(item.published * 1000) : undefined,
      };

      // Send notifications to each user (continue on failure)
      for (const alert of userAlerts) {
        // Send email notification
        const emailResult = await sendNewsAlert(alert.user.email, eventTitle, article);
        if (emailResult.success) {
          emailsSent++;
        } else {
          emailsFailed++;
          console.error("[Webhook] Failed to send email:", {
            userId: alert.userId,
            eventTicker: eventWebhook.eventTicker,
            error: emailResult.error,
          });
        }

        // Send SMS notification if user has a phone number
        if (alert.user.phone) {
          const smsResult = await sendSmsAlert(
            alert.user.phone,
            eventTitle,
            article.title,
            article.url,
          );
          if (smsResult.success) {
            smsSent++;
          } else {
            smsFailed++;
            console.error("[Webhook] Failed to send SMS:", {
              userId: alert.userId,
              eventTicker: eventWebhook.eventTicker,
              error: smsResult.error,
            });
          }
        }
      }
    }

    console.log("[Webhook] Processed notification:", {
      eventTicker: eventWebhook.eventTicker,
      items: items.length,
      users: userAlerts.length,
      emailsSent,
      emailsFailed,
      smsSent,
      smsFailed,
    });

    // Always return 200 to acknowledge receipt
    return NextResponse.json({
      received: true,
      items: items.length,
      users: userAlerts.length,
      emailsSent,
      emailsFailed,
      smsSent,
      smsFailed,
    });
  } catch (error) {
    console.error("[Webhook] Unhandled error:", error);
    // Still return 200 to prevent Superfeedr retries causing duplicate emails
    return NextResponse.json({
      received: true,
      error: "Internal error - logged for investigation",
    });
  }
}

// Handle GET requests for Superfeedr hub verification
export async function GET(request: Request) {
  const url = new URL(request.url);
  const challenge = url.searchParams.get("hub.challenge");

  if (challenge) {
    // Superfeedr verification - echo back the challenge
    return new NextResponse(challenge, {
      headers: { "Content-Type": "text/plain" },
    });
  }

  return NextResponse.json({ status: "Superfeedr webhook endpoint" });
}
