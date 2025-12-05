/**
 * Superfeedr Webhook Test Endpoint
 *
 * Allows testing the webhook flow without waiting for real Superfeedr notifications.
 * Bypasses signature verification for development/testing purposes.
 *
 * SECURITY: Only enabled in development or when explicitly allowed.
 */

import { NextResponse } from "next/server";
import { db } from "~/server/db";
import { sendNewsAlert, type ArticleData } from "~/server/services/email";

export async function POST(request: Request) {
  // Only allow in development or with explicit test mode
  const isDev = process.env.NODE_ENV === "development";
  const testModeEnabled = process.env.ENABLE_WEBHOOK_TEST === "true";

  if (!isDev && !testModeEnabled) {
    return NextResponse.json(
      { error: "Test endpoint disabled in production" },
      { status: 403 }
    );
  }

  try {
    const body = (await request.json()) as {
      eventTicker?: string;
      article?: {
        title?: string;
        summary?: string;
        url?: string;
        source?: string;
      };
    };

    const eventTicker = body.eventTicker;
    if (!eventTicker) {
      return NextResponse.json(
        { error: "eventTicker is required" },
        { status: 400 }
      );
    }

    // Find the webhook for this event
    const eventWebhook = await db.eventWebhook.findFirst({
      where: { eventTicker },
    });

    if (!eventWebhook) {
      return NextResponse.json(
        { error: `No webhook found for event: ${eventTicker}` },
        { status: 404 }
      );
    }

    // Find all active user alerts for this event
    const userAlerts = await db.userAlert.findMany({
      where: {
        eventTicker,
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
      return NextResponse.json({
        success: true,
        message: "No active alerts found for this event",
        eventTicker,
        usersNotified: 0,
      });
    }

    // Build test article
    const article: ArticleData = {
      title: body.article?.title ?? `Test Alert: ${eventTicker}`,
      summary:
        body.article?.summary ??
        "This is a test notification to verify your webhook integration is working correctly.",
      url: body.article?.url ?? "https://example.com/test-article",
      source: body.article?.source ?? "Webhook Test",
      publishedAt: new Date(),
    };

    // Format event title
    const eventTitle = formatEventTitle(eventTicker);

    // Send emails
    let emailsSent = 0;
    let emailsFailed = 0;
    const results: Array<{ email: string; success: boolean; error?: string }> = [];

    for (const alert of userAlerts) {
      const result = await sendNewsAlert(alert.user.email, eventTitle, article);
      if (result.success) {
        emailsSent++;
        results.push({ email: alert.user.email, success: true });
      } else {
        emailsFailed++;
        results.push({
          email: alert.user.email,
          success: false,
          error: result.error,
        });
      }
    }

    console.log("[Webhook Test] Sent test notifications:", {
      eventTicker,
      emailsSent,
      emailsFailed,
    });

    return NextResponse.json({
      success: true,
      eventTicker,
      eventTitle,
      article,
      usersNotified: userAlerts.length,
      emailsSent,
      emailsFailed,
      results,
    });
  } catch (error) {
    console.error("[Webhook Test] Error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}

function formatEventTitle(eventTicker: string): string {
  const parts = eventTicker.split("-");
  const series = parts[0] ?? "";

  if (series.includes("NFL")) {
    const eventPart = parts[1] ?? "";
    const teamsPart = eventPart.slice(7);
    if (teamsPart.length >= 6) {
      const team1 = teamsPart.slice(0, 3);
      const team2 = teamsPart.slice(3, 6);
      return `NFL: ${team1} vs ${team2}`;
    }
    return `NFL Event`;
  }

  if (series.includes("NBA")) {
    const eventPart = parts[1] ?? "";
    const teamsPart = eventPart.slice(7);
    if (teamsPart.length >= 6) {
      const team1 = teamsPart.slice(0, 3);
      const team2 = teamsPart.slice(3, 6);
      return `NBA: ${team1} vs ${team2}`;
    }
    return `NBA Event`;
  }

  if (series.includes("BTC")) return "Bitcoin Price";
  if (series.includes("ETH")) return "Ethereum Price";
  if (series.includes("FED")) return "Federal Reserve";
  if (series.includes("CPI")) return "CPI / Inflation";

  return eventTicker;
}

// GET endpoint for quick health check
export async function GET() {
  const isDev = process.env.NODE_ENV === "development";
  const testModeEnabled = process.env.ENABLE_WEBHOOK_TEST === "true";

  return NextResponse.json({
    status: "Webhook test endpoint",
    enabled: isDev || testModeEnabled,
    usage: "POST with { eventTicker: 'YOUR_EVENT_TICKER' }",
  });
}
