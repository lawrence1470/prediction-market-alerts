/**
 * SMS Service
 *
 * Sends news alert SMS messages via Twilio.
 * Returns success/error status instead of throwing to enable graceful degradation.
 */

import twilio from "twilio";
import { env } from "~/env";

// Initialize Twilio client (lazy - only when credentials are available)
function getTwilioClient() {
  if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN) {
    return null;
  }
  return twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
}

export interface SmsResult {
  success: boolean;
  error?: string;
  messageSid?: string;
}

/**
 * Send a news alert SMS to a user
 *
 * @param to - Recipient phone number (E.164 format, e.g., +15551234567)
 * @param eventTitle - Title of the tracked event (e.g., "Cowboys vs Lions")
 * @param articleTitle - Title of the news article
 * @param articleUrl - URL to the full article
 * @returns SmsResult with success status and optional error message
 */
export async function sendSmsAlert(
  to: string,
  eventTitle: string,
  articleTitle: string,
  articleUrl: string,
): Promise<SmsResult> {
  const client = getTwilioClient();

  if (!client || !env.TWILIO_PHONE_NUMBER) {
    console.warn("[SMS] Twilio not configured, skipping SMS");
    return {
      success: false,
      error: "Twilio not configured",
    };
  }

  // Build concise SMS message (160 char limit for single segment)
  const message = buildSmsMessage(eventTitle, articleTitle, articleUrl);

  try {
    const result = await Promise.race([
      client.messages.create({
        body: message,
        to,
        from: env.TWILIO_PHONE_NUMBER,
      }),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error("SMS timeout")),
          env.TWILIO_TIMEOUT_MS,
        ),
      ),
    ]);

    console.log("[SMS] Alert sent successfully:", {
      to: maskPhone(to),
      eventTitle,
      messageSid: result.sid,
      status: result.status,
    });

    return {
      success: true,
      messageSid: result.sid,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    console.error("[SMS] Failed to send alert:", {
      to: maskPhone(to),
      eventTitle,
      error: errorMessage,
    });

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Build a concise SMS message
 * Keeps message under 160 characters when possible for single SMS segment
 */
function buildSmsMessage(
  eventTitle: string,
  articleTitle: string,
  articleUrl: string,
): string {
  // Truncate event title if too long
  const maxEventLength = 30;
  const truncatedEvent =
    eventTitle.length > maxEventLength
      ? `${eventTitle.slice(0, maxEventLength - 3)}...`
      : eventTitle;

  // Truncate article title to fit
  const prefix = `📰 ${truncatedEvent}\n`;
  const suffix = `\n${articleUrl}`;
  const availableForTitle = 160 - prefix.length - suffix.length - 3; // 3 for "..."

  const truncatedTitle =
    articleTitle.length > availableForTitle
      ? `${articleTitle.slice(0, availableForTitle)}...`
      : articleTitle;

  return `${prefix}${truncatedTitle}${suffix}`;
}

/**
 * Mask phone number for logging (show last 4 digits only)
 */
function maskPhone(phone: string): string {
  if (phone.length <= 4) return "****";
  return `***${phone.slice(-4)}`;
}
