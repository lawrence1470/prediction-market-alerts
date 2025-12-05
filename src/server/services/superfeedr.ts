/**
 * Superfeedr Service
 *
 * Handles PubSubHubbub subscription management for real-time news tracking.
 * Uses Superfeedr's Track API for keyword-based RSS monitoring.
 */

import crypto from "crypto";
import { env } from "~/env";

// Custom error types for better error handling
export class SuperfeedrSubscriptionError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly response?: string,
  ) {
    super(message);
    this.name = "SuperfeedrSubscriptionError";
  }
}

export class SuperfeedrTimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SuperfeedrTimeoutError";
  }
}

const SUPERFEEDR_HUB_URL = "https://push.superfeedr.com";

/**
 * Subscribe to a Superfeedr track feed topic
 *
 * @param topic - The Superfeedr track feed URL (e.g., http://track.superfeedr.com/?query=...)
 * @param callback - The webhook URL that will receive notifications
 * @param secret - HMAC secret for signature verification
 * @returns Promise that resolves on successful subscription
 * @throws SuperfeedrSubscriptionError on API errors
 * @throws SuperfeedrTimeoutError on timeout
 */
export async function subscribe(
  topic: string,
  callback: string,
  secret: string,
): Promise<void> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, env.SUPERFEEDR_TIMEOUT_MS);

  try {
    const formData = new URLSearchParams({
      "hub.mode": "subscribe",
      "hub.topic": topic,
      "hub.callback": callback,
      "hub.secret": secret,
      "hub.verify": "sync",
      format: "json",
    });

    const response = await fetch(SUPERFEEDR_HUB_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${env.SUPERFEEDR_LOGIN}:${env.SUPERFEEDR_TOKEN}`).toString("base64")}`,
      },
      body: formData.toString(),
      signal: controller.signal,
    });

    if (!response.ok) {
      const responseText = await response.text();
      console.error("[Superfeedr] Subscribe failed:", {
        topic,
        status: response.status,
        response: responseText,
      });
      throw new SuperfeedrSubscriptionError(
        `Failed to subscribe to topic: ${response.statusText}`,
        response.status,
        responseText,
      );
    }

    console.log("[Superfeedr] Successfully subscribed to topic:", topic);
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.error("[Superfeedr] Subscribe timeout:", { topic });
      throw new SuperfeedrTimeoutError(
        `Subscription request timed out after ${env.SUPERFEEDR_TIMEOUT_MS}ms`,
      );
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Unsubscribe from a Superfeedr track feed topic
 *
 * @param topic - The Superfeedr track feed URL to unsubscribe from
 * @param callback - The webhook URL that was receiving notifications
 * @returns Promise that resolves on successful unsubscription
 * @throws SuperfeedrSubscriptionError on API errors
 * @throws SuperfeedrTimeoutError on timeout
 */
export async function unsubscribe(
  topic: string,
  callback: string,
): Promise<void> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, env.SUPERFEEDR_TIMEOUT_MS);

  try {
    const formData = new URLSearchParams({
      "hub.mode": "unsubscribe",
      "hub.topic": topic,
      "hub.callback": callback,
      "hub.verify": "sync",
    });

    const response = await fetch(SUPERFEEDR_HUB_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${env.SUPERFEEDR_LOGIN}:${env.SUPERFEEDR_TOKEN}`).toString("base64")}`,
      },
      body: formData.toString(),
      signal: controller.signal,
    });

    if (!response.ok) {
      const responseText = await response.text();
      console.error("[Superfeedr] Unsubscribe failed:", {
        topic,
        status: response.status,
        response: responseText,
      });
      throw new SuperfeedrSubscriptionError(
        `Failed to unsubscribe from topic: ${response.statusText}`,
        response.status,
        responseText,
      );
    }

    console.log("[Superfeedr] Successfully unsubscribed from topic:", topic);
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.error("[Superfeedr] Unsubscribe timeout:", { topic });
      throw new SuperfeedrTimeoutError(
        `Unsubscribe request timed out after ${env.SUPERFEEDR_TIMEOUT_MS}ms`,
      );
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Verify the HMAC signature of an incoming webhook request
 *
 * Superfeedr sends X-Hub-Signature header with format "sha1=<signature>"
 *
 * @param body - The raw request body as a string
 * @param signature - The X-Hub-Signature header value
 * @param secret - The HMAC secret used when subscribing
 * @returns true if signature is valid, false otherwise
 */
export function verifySignature(
  body: string,
  signature: string,
  secret: string,
): boolean {
  if (!signature?.startsWith("sha1=")) {
    return false;
  }

  const expectedSignature = signature.slice(5); // Remove "sha1=" prefix
  const computedSignature = crypto
    .createHmac("sha1", secret)
    .update(body)
    .digest("hex");

  // Use timing-safe comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, "hex"),
      Buffer.from(computedSignature, "hex"),
    );
  } catch {
    // If buffers are different lengths, timingSafeEqual throws
    return false;
  }
}

/**
 * Generate a random secret for HMAC signing
 *
 * @returns A 32-character hex string suitable for use as an HMAC secret
 */
export function generateSecret(): string {
  return crypto.randomBytes(16).toString("hex");
}
