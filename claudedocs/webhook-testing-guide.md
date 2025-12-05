# Webhook Testing Guide

How to test the Superfeedr webhook integration without waiting for real news articles.

---

## Test Endpoint

**URL:** `/api/webhooks/superfeedr/test`

This endpoint simulates a Superfeedr webhook notification, bypassing signature verification so you can test the full email notification flow instantly.

---

## Security

The test endpoint is **disabled by default in production**. It only works when:

1. `NODE_ENV=development` (local dev)
2. OR `ENABLE_WEBHOOK_TEST=true` is set in environment variables

---

## Usage

### Basic Test

Send a POST request with just the event ticker:

```bash
# Local development
curl -X POST http://localhost:4000/api/webhooks/superfeedr/test \
  -H "Content-Type: application/json" \
  -d '{"eventTicker": "KXNBAGAME-25DEC05LALBOS"}'

# Production (if ENABLE_WEBHOOK_TEST=true)
curl -X POST https://prediction-market-alerts.vercel.app/api/webhooks/superfeedr/test \
  -H "Content-Type: application/json" \
  -d '{"eventTicker": "KXNBAGAME-25DEC05LALBOS"}'
```

### Custom Article Content

Customize the test notification content:

```bash
curl -X POST http://localhost:4000/api/webhooks/superfeedr/test \
  -H "Content-Type: application/json" \
  -d '{
    "eventTicker": "KXNBAGAME-25DEC05LALBOS",
    "article": {
      "title": "Lakers defeat Celtics 112-108 in thriller",
      "summary": "LeBron James scored 35 points as the Lakers beat the Celtics in overtime.",
      "url": "https://espn.com/nba/recap/lal-bos",
      "source": "ESPN"
    }
  }'
```

---

## Request Schema

```typescript
{
  eventTicker: string;       // Required - the Kalshi event ticker
  article?: {
    title?: string;          // Article headline (default: "Test Alert: {ticker}")
    summary?: string;        // Article summary
    url?: string;            // Link to article (default: example.com)
    source?: string;         // News source name (default: "Webhook Test")
  }
}
```

---

## Response

### Success Response

```json
{
  "success": true,
  "eventTicker": "KXNBAGAME-25DEC05LALBOS",
  "eventTitle": "NBA: LAL vs BOS",
  "article": {
    "title": "Test Alert: KXNBAGAME-25DEC05LALBOS",
    "summary": "This is a test notification...",
    "url": "https://example.com/test-article",
    "source": "Webhook Test",
    "publishedAt": "2024-12-05T19:30:00.000Z"
  },
  "usersNotified": 1,
  "emailsSent": 1,
  "emailsFailed": 0,
  "results": [
    { "email": "user@example.com", "success": true }
  ]
}
```

### Error Responses

| Status | Error | Cause |
|--------|-------|-------|
| 400 | `eventTicker is required` | Missing eventTicker in request body |
| 403 | `Test endpoint disabled in production` | Not in dev mode and ENABLE_WEBHOOK_TEST not set |
| 404 | `No webhook found for event` | No alert exists for this event ticker |

---

## Prerequisites

Before testing, you need:

1. **An active alert** - Add an alert for the event from the dashboard
2. **Alert status = ACTIVE** - The Superfeedr subscription must have succeeded
3. **Valid Resend API key** - Email sending requires RESEND_API_KEY

---

## Finding Your Event Tickers

Check which events have active webhooks:

```bash
# Using Prisma Studio
npx prisma studio
# Navigate to EventWebhook table

# Or via psql
psql "$DATABASE_URL" -c "SELECT \"eventTicker\", \"status\" FROM event_webhook;"
```

---

## Enabling in Production

If you need to test on production (not recommended for regular use):

1. Add to Vercel environment variables:
   ```
   ENABLE_WEBHOOK_TEST=true
   ```

2. Redeploy

3. **Remove after testing** - Don't leave test endpoints enabled in production

---

## Health Check

Check if the test endpoint is enabled:

```bash
curl https://prediction-market-alerts.vercel.app/api/webhooks/superfeedr/test

# Response:
{
  "status": "Webhook test endpoint",
  "enabled": true,
  "usage": "POST with { eventTicker: 'YOUR_EVENT_TICKER' }"
}
```

---

## Troubleshooting

### "No webhook found for event"
- The event ticker doesn't have an active subscription
- Check the dashboard - alert should show "Active" status
- Try adding a new alert for the event

### "Test endpoint disabled in production"
- Set `ENABLE_WEBHOOK_TEST=true` in Vercel env vars
- Or test locally with `npm run dev`

### Email not received
- Check Resend dashboard for delivery status
- Verify `RESEND_API_KEY` is set correctly
- Check spam folder
- Look at server logs for `[Webhook Test]` entries

### "No active alerts found"
- Alert exists but status is not "ACTIVE"
- Check if Superfeedr subscription succeeded
- The alert might be stuck in "Setting up..." state

---

## Example Test Flow

1. **Start local dev server:**
   ```bash
   npm run dev
   ```

2. **Add an alert from dashboard:**
   - Go to http://localhost:4000/dashboard
   - Enter a Kalshi event ticker
   - Wait for "Active" status

3. **Send test notification:**
   ```bash
   curl -X POST http://localhost:4000/api/webhooks/superfeedr/test \
     -H "Content-Type: application/json" \
     -d '{"eventTicker": "YOUR_EVENT_TICKER_HERE"}'
   ```

4. **Check your email** - You should receive the test alert!
