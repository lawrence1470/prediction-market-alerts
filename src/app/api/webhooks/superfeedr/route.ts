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

    for (const item of items) {
      const article: ArticleData = {
        title: item.title ?? "News Update",
        summary: item.summary,
        url: item.permalinkUrl ?? "#",
        source: item.actor?.displayName,
        publishedAt: item.published ? new Date(item.published * 1000) : undefined,
      };

      // Send email to each user (continue on failure)
      for (const alert of userAlerts) {
        const result = await sendNewsAlert(alert.user.email, eventTitle, article);
        if (result.success) {
          emailsSent++;
        } else {
          emailsFailed++;
          console.error("[Webhook] Failed to send email:", {
            userId: alert.userId,
            eventTicker: eventWebhook.eventTicker,
            error: result.error,
          });
        }
      }
    }

    console.log("[Webhook] Processed notification:", {
      eventTicker: eventWebhook.eventTicker,
      items: items.length,
      users: userAlerts.length,
      emailsSent,
      emailsFailed,
    });

    // Always return 200 to acknowledge receipt
    return NextResponse.json({
      received: true,
      items: items.length,
      users: userAlerts.length,
      emailsSent,
      emailsFailed,
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

/**
 * Format an event ticker into a human-readable title
 *
 * @example "KXNFLSPREAD-25DEC04DALDET" -> "NFL: DAL vs DET"
 */
function formatEventTitle(eventTicker: string): string {
  const parts = eventTicker.split("-");
  const series = parts[0] ?? "";

  // NFL format
  if (series.includes("NFL")) {
    const eventPart = parts[1] ?? "";
    // Extract team codes from event part (after 7-char date prefix)
    const teamsPart = eventPart.slice(7);
    if (teamsPart.length >= 6) {
      const team1 = teamsPart.slice(0, 3);
      const team2 = teamsPart.slice(3, 6);
      return `NFL: ${team1} vs ${team2}`;
    }
    return `NFL Event`;
  }

  // Crypto format
  if (series.includes("BTC")) return "Bitcoin Price";
  if (series.includes("ETH")) return "Ethereum Price";
  if (series.includes("SOL")) return "Solana Price";

  // Economic format
  if (series.includes("FED")) return "Federal Reserve";
  if (series.includes("CPI")) return "CPI / Inflation";
  if (series.includes("GDP")) return "GDP Report";

  // Fallback
  return eventTicker;
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
