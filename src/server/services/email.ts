/**
 * Email Service
 *
 * Sends news alert emails via Resend.
 * Returns success/error status instead of throwing to enable graceful degradation.
 */

import { Resend } from "resend";
import { env } from "~/env";

const resend = new Resend(env.RESEND_API_KEY);

export interface ArticleData {
  title: string;
  summary?: string;
  url: string;
  source?: string;
  publishedAt?: Date;
}

export interface EmailResult {
  success: boolean;
  error?: string;
  messageId?: string;
}

/**
 * Send a news alert email to a user
 *
 * @param to - Recipient email address
 * @param eventTitle - Title of the tracked event (e.g., "Cowboys vs Lions")
 * @param article - Article data to include in the email
 * @returns EmailResult with success status and optional error message
 */
export async function sendNewsAlert(
  to: string,
  eventTitle: string,
  article: ArticleData,
): Promise<EmailResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, env.RESEND_TIMEOUT_MS);

  try {
    const { data, error } = await resend.emails.send({
      from: env.EMAIL_FROM,
      to,
      subject: `📰 News Alert: ${eventTitle}`,
      html: buildEmailHtml(eventTitle, article),
      text: buildEmailText(eventTitle, article),
    });

    if (error) {
      console.error("[Email] Resend API error:", {
        to,
        eventTitle,
        error: error.message,
      });
      return {
        success: false,
        error: error.message,
      };
    }

    console.log("[Email] Alert sent successfully:", {
      to,
      eventTitle,
      messageId: data?.id,
    });

    return {
      success: true,
      messageId: data?.id,
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.error("[Email] Timeout sending alert:", { to, eventTitle });
      return {
        success: false,
        error: `Email request timed out after ${env.RESEND_TIMEOUT_MS}ms`,
      };
    }

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("[Email] Failed to send alert:", {
      to,
      eventTitle,
      error: errorMessage,
    });

    return {
      success: false,
      error: errorMessage,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Build the HTML content for a news alert email
 */
function buildEmailHtml(eventTitle: string, article: ArticleData): string {
  const publishedDate = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>News Alert: ${escapeHtml(eventTitle)}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #000; padding: 20px; border-radius: 8px 8px 0 0;">
    <h1 style="color: #CDFF00; margin: 0; font-size: 24px;">📰 News Alert</h1>
    <p style="color: #fff; margin: 8px 0 0 0; font-size: 14px;">${escapeHtml(eventTitle)}</p>
  </div>

  <div style="background: #f8f8f8; padding: 20px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px;">
    <h2 style="margin: 0 0 12px 0; font-size: 20px; color: #1a1a1a;">
      <a href="${escapeHtml(article.url)}" style="color: #1a1a1a; text-decoration: none;">
        ${escapeHtml(article.title)}
      </a>
    </h2>

    ${article.source ? `<p style="margin: 0 0 12px 0; color: #666; font-size: 14px;">Source: ${escapeHtml(article.source)}</p>` : ""}

    ${publishedDate ? `<p style="margin: 0 0 12px 0; color: #666; font-size: 14px;">Published: ${publishedDate}</p>` : ""}

    ${article.summary ? `<p style="margin: 16px 0; color: #333;">${escapeHtml(article.summary)}</p>` : ""}

    <a href="${escapeHtml(article.url)}" style="display: inline-block; background: #CDFF00; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 12px;">
      Read Full Article →
    </a>
  </div>

  <div style="padding: 20px; text-align: center; color: #666; font-size: 12px;">
    <p>You're receiving this because you enabled alerts for this event on Kalshi Tracker.</p>
    <p>
      <a href="#" style="color: #666;">Manage Alerts</a> ·
      <a href="#" style="color: #666;">Unsubscribe</a>
    </p>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Build the plain text content for a news alert email
 */
function buildEmailText(eventTitle: string, article: ArticleData): string {
  const parts = [
    `📰 NEWS ALERT: ${eventTitle}`,
    "",
    article.title,
    "",
  ];

  if (article.source) {
    parts.push(`Source: ${article.source}`);
  }

  if (article.publishedAt) {
    parts.push(
      `Published: ${new Date(article.publishedAt).toLocaleDateString("en-US")}`,
    );
  }

  if (article.summary) {
    parts.push("", article.summary);
  }

  parts.push("", `Read more: ${article.url}`);
  parts.push(
    "",
    "---",
    "You're receiving this because you enabled alerts for this event on Kalshi Tracker.",
  );

  return parts.join("\n");
}

/**
 * Escape HTML special characters to prevent XSS
 */
function escapeHtml(text: string): string {
  const htmlEntities: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return text.replace(/[&<>"']/g, (char) => htmlEntities[char] ?? char);
}
