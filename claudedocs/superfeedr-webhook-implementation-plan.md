# Superfeedr Webhook Implementation Plan

## Executive Summary

This document outlines the implementation strategy for integrating Superfeedr's real-time news tracking with Kalshi Tracker. The goal is to automatically create webhooks when users add prediction market alerts, enabling real-time news notifications relevant to their bets.

---

## 1. Kalshi Hierarchy Analysis

### Understanding Series vs Event vs Market

| Level | Example | Description | Scope |
|-------|---------|-------------|-------|
| **Series** | `KXNFLSPREAD` | Collection of related events over different time periods | Too broad - covers ALL NFL spread games |
| **Event** | `KXNFLSPREAD-25DEC04DALDET` | Collection of markets for a specific occurrence | Right scope - specific game (Dallas vs Detroit on Dec 4) |
| **Market** | `KXNFLSPREAD-25DEC04DALDET-DET9` | Single binary Yes/No contract | Too narrow - news affects all markets equally |

### Recommendation: EVENT-Level Webhooks

**Create webhooks at the EVENT level, not Series or Market.**

#### Rationale:

1. **Series is too broad**:
   - A Series like `KXNFLSPREAD` covers ALL NFL spread games for a season
   - News about the Cowboys wouldn't be relevant to a user betting only on the Patriots
   - Would result in too much noise and irrelevant notifications

2. **Market is too narrow**:
   - Multiple markets exist within an Event (e.g., spread +3, +5, +7)
   - A news article affects ALL markets in an event equally
   - Creating separate webhooks per market = duplicate notifications
   - Wastes Superfeedr quota (billed per tracker)

3. **Event is the optimal level**:
   - Captures the right context (specific game, specific date, specific price target)
   - One webhook can serve all users betting on any market within that event
   - News about relevant entities (teams, bitcoin price) applies to whole event

---

## 2. Superfeedr Integration Architecture

### 2.1 Track Feed URL Structure

Superfeedr track feeds are "virtual feeds" generated from keyword queries:

```
http://track.superfeedr.com/?query=YOUR_QUERY&format=json
```

### 2.2 Query Syntax

| Operator | Syntax | Example |
|----------|--------|---------|
| AND | space | `cowboys eagles` (both words) |
| OR | pipe | `cowboys | eagles` (either word) |
| NOT | dash | `cowboys -practice` (exclude practice) |
| Exact phrase | quotes | `"dallas cowboys"` |
| Site filter | site: | `site:espn.com` |
| Exclude site | -site: | `-site:reddit.com` |
| Language | language: | `language:en` |
| Popularity | popularity: | `popularity:medium` |

### 2.3 Event-to-Query Mapping Strategy

For each event type, generate appropriate search queries:

| Event Type | Example Event | Query Strategy |
|------------|---------------|----------------|
| NFL Spread | `KXNFLSPREAD-25DEC04DALDET` | `("dallas cowboys" | "detroit lions") -fantasy -mock -draft -"all time" -history popularity:medium` |
| Bitcoin Price | `KXBTC-25DEC31-T50000` | `(bitcoin | btc) price -meme -nft popularity:medium` |
| Fed Rate | `KXFED-25JAN` | `("federal reserve" | "fed rate" | "interest rate") -history popularity:medium` |
| Weather | `KXWEATHER-NYC-25DEC04` | `"new york" (weather | forecast | storm) -"last year" popularity:medium` |

### 2.4 Query Quality Filters

**Standard exclusions** (applied to all queries):
```
-fantasy -mock -draft -history -"all time" -reddit -rumor
```

**Popularity filter**: Use `popularity:medium` to filter low-quality sources while still catching breaking news. Avoid `popularity:high` as it may miss timely local reporting.

**Source quality**: Consider adding trusted sources:
```
site:espn.com | site:nfl.com | site:reuters.com | site:bloomberg.com
```

**Note**: We prioritize recency over noise reduction. Better to send a few extra alerts than miss breaking news. Users can adjust notification frequency in preferences.

---

## 3. Webhook Lifecycle

### 3.1 Creating a Subscription

**Endpoint**: `POST https://push.superfeedr.com/`

**Authentication**: HTTP Basic Auth
- Username: Your Superfeedr login
- Password: Your API token

**Parameters**:
| Parameter | Value |
|-----------|-------|
| `hub.mode` | `subscribe` |
| `hub.topic` | `http://track.superfeedr.com/?query=ENCODED_QUERY` |
| `hub.callback` | `https://your-app.com/api/webhooks/superfeedr` |
| `hub.secret` | Random secret for HMAC verification |
| `format` | `json` |

### 3.2 Receiving Notifications

Superfeedr will POST to your callback URL with:

**Headers**:
- `X-PubSubHubbub-Topic`: The feed URL
- `X-Hub-Signature`: HMAC-SHA1 signature (if secret set)
- `X-Superfeedr-Credits`: Remaining monthly credits

**Body** (JSON format):
```json
{
  "status": {
    "code": 200,
    "feed": "http://track.superfeedr.com/?query=..."
  },
  "items": [
    {
      "id": "unique-entry-id",
      "title": "Article Title",
      "summary": "Brief summary...",
      "content": "Full content...",
      "permalinkUrl": "https://source.com/article",
      "published": 1733329200,
      "actor": {
        "displayName": "Source Name"
      }
    }
  ]
}
```

### 3.3 Unsubscribing

**Endpoint**: `POST https://push.superfeedr.com/`

**Parameters**:
| Parameter | Value |
|-----------|-------|
| `hub.mode` | `unsubscribe` |
| `hub.topic` | The original feed URL |
| `hub.callback` | Your callback URL |

---

## 4. Database Schema Design

### 4.1 New Tables Needed

```
EventWebhook
------------
- id: string (cuid)
- eventTicker: string (e.g., "KXNFLSPREAD-25DEC04DALDET")
- superfeedrTopic: string (the track feed URL)
- superfeedrSecret: string (for signature verification)
- searchQuery: string (the original query)
- status: enum (ACTIVE, PENDING, FAILED, UNSUBSCRIBED, EXPIRED)
- subscriberCount: int (how many users are tracking this event)
- expiresAt: datetime (when event settles/ends)
- lastNotificationAt: datetime (for event-level debouncing)
- createdAt: datetime
- updatedAt: datetime

UserAlert
---------
- id: string (cuid)
- userId: string (FK to User)
- eventTicker: string (FK to EventWebhook)
- marketTicker: string (specific market within event)
- status: enum (ACTIVE, EXPIRED)
- notificationCount: int (how many alerts received)
- createdAt: datetime
- updatedAt: datetime

NewsItem (for deduplication)
----------------------------
- id: string (cuid)
- eventTicker: string (FK to EventWebhook)
- url: string (unique, permalink)
- titleHash: string (for fuzzy matching)
- title: string
- summary: string
- source: string
- publishedAt: datetime
- createdAt: datetime
```

### 4.2 Fan-Out Strategy

When a webhook notification arrives:

1. Look up `EventWebhook` by the `superfeedrTopic`
2. Find all `UserAlert` records for that `eventTicker`
3. Send notifications to each user (push notification, email, etc.)

---

## 5. Implementation Flow

### 5.1 User Adds Alert Flow

```
User adds bet for market "KXNFLSPREAD-25DEC04DALDET-DET9"
    |
    v
Extract event ticker: "KXNFLSPREAD-25DEC04DALDET"
    |
    v
Check if EventWebhook exists for this event
    |
    +-- YES --> Increment subscriberCount, create UserAlert
    |
    +-- NO --> Generate search query from event metadata
               |
               v
            Create Superfeedr subscription
               |
               v
            Create EventWebhook record (status: PENDING)
               |
               v
            Create UserAlert record
               |
               v
            On subscription confirmation, set status: ACTIVE
```

### 5.2 User Removes Alert Flow

```
User removes alert
    |
    v
Delete UserAlert record
    |
    v
Decrement subscriberCount on EventWebhook
    |
    v
If subscriberCount == 0:
    |
    v
Unsubscribe from Superfeedr
    |
    v
Mark EventWebhook as UNSUBSCRIBED (or delete)
```

### 5.3 Webhook Received Flow

```
POST /api/webhooks/superfeedr
    |
    v
Verify X-Hub-Signature with stored secret
    |
    v
Parse JSON body, extract items array
    |
    v
Look up EventWebhook by superfeedrTopic
    |
    v
Find all UserAlerts for this eventTicker
    |
    v
For each user:
    - Queue notification (email, push, in-app)
    - Store news item in user's feed
```

---

## 6. Query Generation Logic

### 6.1 Parsing Event Tickers

Event tickers follow patterns that can be parsed to extract entities:

| Pattern | Example | Entities to Track |
|---------|---------|-------------------|
| NFL Spread | `KXNFLSPREAD-25DEC04DALDET` | Team codes: DAL, DET |
| Bitcoin | `KXBTC-25DEC31-T50000` | Asset: Bitcoin |
| Fed Rate | `KXFED-25JAN` | Entity: Federal Reserve |
| Elections | `KXPRES-24NOV` | Topic: Presidential election |

### 6.2 Entity Mapping Tables

Maintain lookup tables:

```
NFL Teams:
- DAL -> ["dallas cowboys", "cowboys", "dak prescott"]
- DET -> ["detroit lions", "lions", "jared goff"]

Crypto Assets:
- BTC -> ["bitcoin", "btc", "bitcoin price"]
- ETH -> ["ethereum", "eth", "ether"]

Economic:
- FED -> ["federal reserve", "fed rate", "interest rate", "jerome powell"]
```

---

## 7. Cost Estimation

### 7.1 Superfeedr Pricing

- **Tracker feeds**: $2/tracker/month
- **Notifications**: 2,000 free/month, then $0.50 per 1,000

### 7.2 Projected Costs

| Users | Avg Events/User | Unique Events | Monthly Cost |
|-------|-----------------|---------------|--------------|
| 100 | 5 | ~50 | $100 (trackers) + notifications |
| 1,000 | 5 | ~200 | $400 (trackers) + notifications |
| 10,000 | 5 | ~500 | $1,000 (trackers) + notifications |

**Note**: Events are shared across users, so costs don't scale linearly with users.

---

## 8. Testing Strategy

### 8.1 Superfeedr Testing Endpoint

Before subscribing, test queries with:

```
GET https://push.superfeedr.com/
?hub.mode=search
&hub.topic=http://track.superfeedr.com/?query=YOUR_QUERY
```

This returns current matches without creating a subscription.

### 8.2 Local Development

Use ngrok or similar to expose local webhook endpoint:
```
ngrok http 4000
```

Configure callback URL as ngrok URL during development.

---

## 9. Security Considerations

### 9.1 Webhook Verification

Always verify the `X-Hub-Signature` header:

1. Store a unique `hub.secret` per subscription
2. Calculate HMAC-SHA1 of request body using secret
3. Compare with signature in header
4. Reject requests with invalid signatures

### 9.2 Rate Limiting

- Implement rate limiting on webhook endpoint
- Queue processing for high-volume events
- Use background job processing (e.g., Bull, Inngest)

---

## 10. Edge Cases & Robustness

### 10.1 Event Expiration & Cleanup

**Problem**: After Dec 4 game ends, we're still paying for the webhook.

**Solution**: Cron job for event lifecycle management

```
Cron: Every 15 minutes
    |
    v
Query EventWebhooks WHERE status = ACTIVE
    |
    v
For each webhook, check Kalshi API: GET /events/{eventTicker}
    |
    v
If event.status == "settled" OR event.status == "expired":
    |
    +-- Unsubscribe from Superfeedr
    +-- Set EventWebhook.status = EXPIRED
    +-- Set all related UserAlerts.status = EXPIRED
    +-- Send email: "Your alert for [event] has ended - [outcome]"
```

**Database fields**:
- `EventWebhook.expiresAt` - estimated expiration from Kalshi
- `EventWebhook.status` - ACTIVE, PENDING, EXPIRED, UNSUBSCRIBED
- `UserAlert.status` - ACTIVE, EXPIRED

**Kalshi Event Status Values**:
- `active` - Event is live, betting open
- `closed` - Betting closed, awaiting settlement
- `settled` - Outcome determined
- `expired` - Time-based expiration

### 10.1.1 Live/Expired Status in UI

**User's bet card should show status badge**:

| Status | Badge | Color | Description |
|--------|-------|-------|-------------|
| ACTIVE | "LIVE" | Green | Bet is active, alerts enabled |
| CLOSED | "CLOSING" | Yellow | Betting closed, awaiting result |
| EXPIRED | "ENDED" | Gray | Event settled, no more alerts |

**UI Component**:
```
┌─────────────────────────────────────────────┐
│ Cowboys vs Lions - Dec 4             🟢 LIVE │
│ ────────────────────────────────────────────│
│ 🔔 News alerts: ON                    [OFF] │
└─────────────────────────────────────────────┘
```

**After expiration**:
```
┌─────────────────────────────────────────────┐
│ Cowboys vs Lions - Dec 4            ⚫ ENDED │
│ ────────────────────────────────────────────│
│ Alerts ended • 3 news items received        │
└─────────────────────────────────────────────┘
```

**Database addition to UserAlert**:
```
UserAlert
---------
- status: enum (ACTIVE, EXPIRED)
- notificationCount: int (how many alerts received)
```

**Real-time status check**:
- On page load: Fetch current status from Kalshi API
- Cache for 5 minutes to reduce API calls
- Show cached status with "last updated X min ago" if stale

### 10.2 Duplicate Article Detection

**Problem**: Same injury news published by ESPN, NFL.com, CBS Sports.

**Multi-layer deduplication**:

| Layer | Method | Example |
|-------|--------|---------|
| URL | Exact match | `permalinkUrl` already seen |
| Title hash | Normalize + hash | "St. Brown OUT" vs "St. Brown ruled OUT" |
| Similarity | Jaccard on title words | >70% word overlap = duplicate |

**Title normalization**:
```
1. Lowercase
2. Remove punctuation
3. Remove stopwords (the, a, is, are)
4. Remove team/player names (already known from event)
5. Hash remaining words
```

**Flow**:
```
New article arrives
    |
    v
Check NewsItem for matching URL → SKIP if exists
    |
    v
Generate titleHash from normalized title
    |
    v
Check NewsItem for matching titleHash in last 24 hours → SKIP if exists
    |
    v
Check Jaccard similarity against recent titles (>70%) → SKIP if similar
    |
    v
Insert into NewsItem, proceed with notification
```

**Priority for recency**: If two articles are similar but from different sources, prefer the one from higher-quality source (ESPN > local blog).

### 10.3 Event-Level Rate Limiting (Breaking News Spike)

**Problem**: Major injury = 50 webhook calls in 5 minutes from different sources.

**Solution**: Event-level debouncing with smart batching

```
EventWebhook.lastNotificationAt tracking:
    |
    v
If (now - lastNotificationAt) < 5 minutes:
    |
    +-- Queue article in memory/Redis
    +-- Set timer for 5 min after first article
    +-- When timer fires: send batch notification
    |
    v
Else:
    |
    +-- Send immediately
    +-- Update lastNotificationAt = now
```

**User-facing**: "3 new articles about Cowboys vs Lions" with expandable list.

**Config options**:
```
EVENT_DEBOUNCE_WINDOW = 5 minutes (for same event)
MAX_ARTICLES_PER_NOTIFICATION = 5 (batch limit)
URGENT_KEYWORDS = ["injury", "suspended", "out", "inactive"]
```

**Urgent bypass**: If article contains urgent keywords, send immediately regardless of debounce.

### 10.4 subscriberCount Race Condition

**Problem**: Two users subscribe simultaneously → count goes from 0 to 1 (not 2).

**Solution**: Use Prisma atomic operations

**Incrementing** (user adds alert):
```typescript
await prisma.$transaction(async (tx) => {
  // Atomic increment
  await tx.eventWebhook.update({
    where: { eventTicker },
    data: { subscriberCount: { increment: 1 } }
  });

  // Create user alert
  await tx.userAlert.create({
    data: { userId, eventTicker, marketTicker }
  });
});
```

**Decrementing** (user removes alert):
```typescript
await prisma.$transaction(async (tx) => {
  // Delete user alert
  await tx.userAlert.delete({ where: { id: alertId } });

  // Atomic decrement
  const webhook = await tx.eventWebhook.update({
    where: { eventTicker },
    data: { subscriberCount: { decrement: 1 } }
  });

  // Cleanup if no subscribers
  if (webhook.subscriberCount === 0) {
    await unsubscribeFromSuperfeedr(webhook);
    await tx.eventWebhook.update({
      where: { id: webhook.id },
      data: { status: 'UNSUBSCRIBED' }
    });
  }
});
```

### 10.5 Webhook Retry & Failure Handling

**Superfeedr retry behavior**: 3 attempts at 5s, 10s, 15s intervals.

**Our handling**:
- Return 2xx quickly (within 5 seconds)
- Queue actual processing for background
- If processing fails, article is still in NewsItem for manual review

```
POST /api/webhooks/superfeedr
    |
    v
Verify signature (fast)
    |
    v
Return 200 OK immediately
    |
    v
Queue job: processSuperfeedrNotification(payload)
    |
    v
Background worker processes and sends emails
```

---

## 11. Email Notification System

### 11.1 Provider: Resend

**Why Resend?**
- Modern API, great developer experience
- React Email support for templating
- Generous free tier (100 emails/day, 3,000/month)
- Built for transactional emails
- Easy Next.js integration

**Pricing**:
| Tier | Emails/Month | Cost |
|------|--------------|------|
| Free | 3,000 | $0 |
| Pro | 50,000 | $20/mo |
| Scale | 100,000 | $90/mo |

### 11.2 Email Template Structure

**News Alert Email**:
```
Subject: Breaking: {headline} - {eventTitle}

Body:
- Event: Cowboys vs Lions (Dec 4)
- News headline + summary
- Link to full article
- Link to view on Kalshi
- Unsubscribe link
```

### 11.3 Database Additions

```
NotificationLog
---------------
- id: string (cuid)
- userId: string (FK to User)
- alertId: string (FK to UserAlert)
- type: enum (EMAIL, SMS, PUSH)
- status: enum (PENDING, SENT, FAILED, BOUNCED)
- newsItemId: string (reference to news article)
- sentAt: datetime
- createdAt: datetime

UserPreferences
---------------
- id: string (cuid)
- userId: string (FK to User)
- emailNotifications: boolean (default: true)
- smsNotifications: boolean (default: false) -- FUTURE
- notificationFrequency: enum (INSTANT, HOURLY_DIGEST, DAILY_DIGEST)
- quietHoursStart: time (optional)
- quietHoursEnd: time (optional)
```

### 11.4 Email Sending Flow

```
Webhook received with news items
    |
    v
For each affected user:
    |
    v
Check UserPreferences.emailNotifications == true
    |
    v
Check not in quiet hours
    |
    v
Check notification frequency:
    |
    +-- INSTANT --> Queue email immediately
    |
    +-- HOURLY_DIGEST --> Add to digest queue
    |
    +-- DAILY_DIGEST --> Add to daily batch
    |
    v
Send via Resend API
    |
    v
Log to NotificationLog (status: SENT or FAILED)
```

### 11.5 Digest Strategy

For users who don't want instant notifications:

**Hourly Digest**:
- Cron job runs every hour
- Collects all pending notifications for user
- Sends single email with all news items
- Reduces email fatigue

**Daily Digest**:
- Cron job runs at user's preferred time (or 8am default)
- Summary of all news from past 24 hours
- Grouped by event/bet

### 11.6 Rate Limiting & Anti-Spam

- **Per-user limit**: Max 10 emails/hour per user
- **Deduplication**: Don't send same article twice
- **Batching**: If 5+ articles arrive within 5 minutes, batch into single email
- **Unsubscribe**: One-click unsubscribe link in every email

### 11.7 Environment Variables

```
RESEND_API_KEY=re_xxxxxxxxxxxxx
EMAIL_FROM=alerts@kalshitracker.com
```

---

## 12. Future: SMS Notifications

*Planned for future implementation*

### 12.1 Provider Options

| Provider | Cost per SMS | Features |
|----------|--------------|----------|
| Twilio | $0.0079/msg | Most popular, reliable |
| AWS SNS | $0.00645/msg | Cheapest, good for scale |
| Vonage | $0.0068/msg | Good international rates |

### 12.2 SMS Considerations

- Much shorter content (160 chars)
- Higher urgency perception
- Users must opt-in explicitly
- Phone number verification required
- Cost scales linearly with users (unlike email)

### 12.3 Suggested SMS Template

```
Kalshi Alert: {headline_truncated}
Your bet: {eventTitle}
Details: {short_url}
Reply STOP to unsubscribe
```

---

## 13. Next Steps

1. **Schema Design**: Add EventWebhook, UserAlert, NewsItem, NotificationLog, UserPreferences to Prisma
2. **Superfeedr Service**: Create service class for Superfeedr API interactions (subscribe, unsubscribe, verify)
3. **Webhook Endpoint**: Build `/api/webhooks/superfeedr` route with signature verification
4. **Query Generator**: Build entity extraction and query generation logic with quality filters
5. **Deduplication Service**: Implement URL + title hash + Jaccard similarity checks
6. **Email Service**: Set up Resend integration with React Email templates
7. **Alert UI**: Add "Add Alert" button to bet cards with LIVE/ENDED status badge
8. **Bet Status UI**: Show live/expired status on bet cards with green/gray badges
9. **Preferences UI**: Build notification preferences page
10. **Background Jobs**: Set up job queue (Inngest/Bull) for:
    - Email sending
    - Digest compilation (hourly/daily)
    - Event expiration cleanup (check Kalshi API every 15 min)
    - Superfeedr subscription management
    - Auto-unsubscribe on bet expiration
11. **Future**: Add SMS via Twilio when ready

---

## Appendix A: Superfeedr API Reference

### Authentication
```
Authorization: Basic base64(login:token)
```

### Subscribe
```
POST https://push.superfeedr.com/
Content-Type: application/x-www-form-urlencoded

hub.mode=subscribe
&hub.topic=http://track.superfeedr.com/?query=bitcoin
&hub.callback=https://app.com/webhooks/superfeedr
&hub.secret=your-secret
&format=json
```

### Unsubscribe
```
POST https://push.superfeedr.com/
Content-Type: application/x-www-form-urlencoded

hub.mode=unsubscribe
&hub.topic=http://track.superfeedr.com/?query=bitcoin
&hub.callback=https://app.com/webhooks/superfeedr
```

### List Subscriptions
```
GET https://push.superfeedr.com/
?hub.mode=list
&page=1
```

### Test Query
```
GET https://push.superfeedr.com/
?hub.mode=search
&hub.topic=http://track.superfeedr.com/?query=bitcoin
```
