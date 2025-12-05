# Superfeedr Webhook Implementation Workflow (MVP)

**Generated from**: `superfeedr-webhook-implementation-plan.md`
**Scope**: Lean MVP
**Total Tasks**: 22
**Phases**: 4
**Last Updated**: Spec Panel Review Applied

---

## MVP Architecture

```
User adds alert → Subscribe to Superfeedr → Store EventWebhook + UserAlert
                              ↓
News published → Superfeedr POSTs to webhook → Send email via Resend
                              ↓
User removes alert → Unsubscribe if subscriberCount = 0
```

**What's included:**
- Real-time news alerts via Superfeedr webhooks
- Email notifications via Resend
- Alert management (add/remove/toggle)
- Event status display (LIVE/ENDED)
- Error handling and graceful degradation

**What's deferred:**
- Digest emails (hourly/daily)
- Quiet hours
- Notification preferences page
- Deduplication (trust Superfeedr)
- Notification logging
- Background jobs

---

## Phase 1: Foundation

**Dependencies**: None
**Blocking**: All subsequent phases

### 1.1 Prisma Schema

| Task | Description |
|------|-------------|
| 1.1.1 | Add `EventWebhook` model |
| 1.1.2 | Add `UserAlert` model |
| 1.1.3 | Run `npm run db:push && npm run db:generate` |

**Schema:**
```prisma
enum EventWebhookStatus {
  ACTIVE
  PENDING
  FAILED
  UNSUBSCRIBED
  EXPIRED
}

enum UserAlertStatus {
  ACTIVE
  PAUSED
  EXPIRED
}

model EventWebhook {
  id                 String              @id @default(cuid())
  eventTicker        String              @unique
  superfeedrTopic    String              @unique  // IMPORTANT: Must be unique
  superfeedrSecret   String
  searchQuery        String
  status             EventWebhookStatus  @default(PENDING)
  subscriberCount    Int                 @default(0)
  createdAt          DateTime            @default(now())
  updatedAt          DateTime            @updatedAt

  userAlerts         UserAlert[]
}

model UserAlert {
  id           String          @id @default(cuid())
  userId       String
  eventTicker  String
  marketTicker String
  status       UserAlertStatus @default(ACTIVE)
  createdAt    DateTime        @default(now())
  updatedAt    DateTime        @updatedAt

  user         User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  eventWebhook EventWebhook    @relation(fields: [eventTicker], references: [eventTicker])

  @@unique([userId, marketTicker])
}
```

### 1.2 Environment Variables

| Task | Variable |
|------|----------|
| 1.2.1 | Add `SUPERFEEDR_LOGIN` to `.env` |
| 1.2.2 | Add `SUPERFEEDR_TOKEN` to `.env` |
| 1.2.3 | Add `RESEND_API_KEY` to `.env` |
| 1.2.4 | Add `EMAIL_FROM` to `.env` |
| 1.2.5 | Update `.env.example` with placeholders |
| 1.2.6 | Add Zod validation in `src/env.js` |
| 1.2.7 | Add `SUPERFEEDR_TIMEOUT_MS=10000` (10s default) |
| 1.2.8 | Add `RESEND_TIMEOUT_MS=5000` (5s default) |

### 1.3 Entity Mappings

| Task | File |
|------|------|
| 1.3.1 | Create `src/server/constants/entity-mappings.ts` |
| 1.3.2 | Add NFL team codes → names |
| 1.3.3 | Add crypto asset mappings |
| 1.3.4 | Add query exclusion patterns |

**Validation Gate 1:**
- [ ] Prisma models compile
- [ ] `db:push` succeeds
- [ ] Can create test records in Prisma Studio
- [ ] Environment variables validated by Zod

---

## Phase 2: Core Services

**Dependencies**: Phase 1 complete

### 2.1 Superfeedr Service

| Task | File | Function |
|------|------|----------|
| 2.1.1 | `src/server/services/superfeedr.ts` | `subscribe(topic, callback, secret)` |
| 2.1.2 | `src/server/services/superfeedr.ts` | `unsubscribe(topic, callback)` |
| 2.1.3 | `src/server/services/superfeedr.ts` | `verifySignature(body, signature, secret)` |

**Error Handling Requirements:**
- Use `SUPERFEEDR_TIMEOUT_MS` for HTTP timeout
- Throw typed errors: `SuperfeedrSubscriptionError`, `SuperfeedrTimeoutError`
- Log failures with event context for debugging

### 2.2 Query Generator

| Task | File | Function |
|------|------|----------|
| 2.2.1 | `src/server/services/query-generator.ts` | `parseEventTicker(ticker)` |
| 2.2.2 | `src/server/services/query-generator.ts` | `generateQuery(eventTicker)` |
| 2.2.3 | `src/server/services/query-generator.ts` | `buildTopicUrl(query)` |

### 2.3 Email Service

| Task | File | Function |
|------|------|----------|
| 2.3.1 | Terminal | `npm install resend` |
| 2.3.2 | `src/server/services/email.ts` | Initialize Resend client |
| 2.3.3 | `src/server/services/email.ts` | `sendNewsAlert(to, subject, articleData)` |

**Error Handling Requirements:**
- Use `RESEND_TIMEOUT_MS` for HTTP timeout
- Return `{ success: boolean, error?: string }` instead of throwing
- Enable caller to handle failures gracefully

**Validation Gate 2:**
- [ ] Query generator produces valid Superfeedr URLs
- [ ] Test email sends via Resend
- [ ] Timeout values are respected
- [ ] Errors are typed and logged

---

## Phase 3: API Layer

**Dependencies**: Phase 2 complete

### 3.1 Webhook Endpoint

| Task | File | Description |
|------|------|-------------|
| 3.1.1 | `src/app/api/webhooks/superfeedr/route.ts` | Create POST handler |
| 3.1.2 | Same file | Verify `X-Hub-Signature` |
| 3.1.3 | Same file | Parse payload, extract articles |
| 3.1.4 | Same file | Find users for this event |
| 3.1.5 | Same file | Send email to each user |
| 3.1.6 | Same file | Handle partial email failures (log, continue) |
| 3.1.7 | Same file | Always return 200 to acknowledge receipt |

**Webhook Flow:**
```
POST /api/webhooks/superfeedr
    ↓
Verify signature with stored secret
    ↓ (reject with 401 if invalid)
Parse JSON body → extract items[]
    ↓
Lookup EventWebhook by superfeedrTopic
    ↓ (return 200 if not found - stale subscription)
Find all UserAlerts for this eventTicker (status = ACTIVE)
    ↓
For each user: send email via Resend
    ↓ (log failures, continue to next user)
Return 200 OK (always, even on partial failures)
```

**Why always return 200?**
Superfeedr expects 2xx within 10 seconds. If we return 5xx, Superfeedr retries and users get duplicate emails. Better to acknowledge receipt and handle email failures gracefully.

### 3.2 tRPC Alert Router

**Security**: All procedures use `protectedProcedure` (authenticated users only).
Users can only view/modify their own alerts (ownership validated in each procedure).

| Task | File | Procedure |
|------|------|-----------|
| 3.2.1 | `src/server/api/routers/alert.ts` | `addAlert` mutation |
| 3.2.2 | Same file | `removeAlert` mutation |
| 3.2.3 | Same file | `getAlerts` query |
| 3.2.4 | Same file | `toggleAlert` mutation |
| 3.2.5 | `src/server/api/root.ts` | Register alertRouter |

**addAlert Flow:**
```
Input: marketTicker (e.g., "KXNFLSPREAD-25DEC04DALDET-DET9")
    ↓
Extract eventTicker: "KXNFLSPREAD-25DEC04DALDET"
    ↓
Check if EventWebhook exists
    ↓
YES → Increment subscriberCount atomically
NO  → Generate query → Subscribe to Superfeedr → Create EventWebhook
    ↓ (if Superfeedr fails, throw error, don't create records)
Create UserAlert record
    ↓
Return success with alert data
```

**Error Handling for addAlert:**
- If Superfeedr subscription fails, throw `TRPCError` with code `INTERNAL_SERVER_ERROR`
- UI should display: "Failed to create alert. Please try again."
- Do NOT create EventWebhook or UserAlert on failure

**removeAlert Flow:**
```
Delete UserAlert (verify ownership first!)
    ↓
Decrement subscriberCount atomically
    ↓
If subscriberCount === 0:
    → Unsubscribe from Superfeedr
    → Set EventWebhook.status = UNSUBSCRIBED
```

**Validation Gate 3:**
- [ ] Webhook receives test POST and returns 200
- [ ] Signature verification rejects invalid requests
- [ ] `addAlert` creates both records on success
- [ ] `addAlert` creates neither record on Superfeedr failure
- [ ] `removeAlert` cleans up correctly
- [ ] Users cannot access other users' alerts

---

## Phase 4: User Interface

**Dependencies**: Phase 3 complete

### 4.1 Components

| Task | File | Description |
|------|------|-------------|
| 4.1.1 | `src/app/_components/StatusBadge.tsx` | LIVE (green), ENDED (gray) |
| 4.1.2 | `src/app/_components/AlertCard.tsx` | Event card with status + toggle |
| 4.1.3 | `src/app/_components/AddAlertButton.tsx` | Button/modal to add alert |

### 4.2 Alerts Page

| Task | File | Description |
|------|------|-------------|
| 4.2.1 | `src/app/(dashboard)/alerts/page.tsx` | List user's alerts |
| 4.2.2 | Same file | Fetch via tRPC `getAlerts` |
| 4.2.3 | Same file | Render AlertCard grid |
| 4.2.4 | Same file | Empty state |

### 4.3 Dashboard Updates

| Task | File | Description |
|------|------|-------------|
| 4.3.1 | `src/app/(dashboard)/layout.tsx` | Add nav link to /alerts |

**Validation Gate 4:**
- [ ] Alerts page lists user's alerts
- [ ] Status badges show correct colors
- [ ] Toggle pauses/resumes alerts
- [ ] Add alert creates subscription
- [ ] Error states displayed on failures

---

## File Structure (MVP)

```
src/
├── server/
│   ├── services/
│   │   ├── superfeedr.ts         # Superfeedr API client
│   │   ├── query-generator.ts    # Event → Query logic
│   │   └── email.ts              # Resend wrapper
│   ├── api/
│   │   └── routers/
│   │       └── alert.ts          # Alert CRUD
│   └── constants/
│       └── entity-mappings.ts    # NFL, crypto mappings
├── app/
│   ├── api/
│   │   └── webhooks/
│   │       └── superfeedr/
│   │           └── route.ts      # Webhook endpoint
│   ├── (dashboard)/
│   │   ├── alerts/
│   │   │   └── page.tsx          # Alerts list
│   │   └── layout.tsx
│   └── _components/
│       ├── AlertCard.tsx
│       ├── AddAlertButton.tsx
│       └── StatusBadge.tsx
prisma/
└── schema.prisma
```

---

## Implementation Checklist

### Phase 1: Foundation
- [ ] 1.1.1 EventWebhook model (with @unique on superfeedrTopic)
- [ ] 1.1.2 UserAlert model
- [ ] 1.1.3 db:push + db:generate
- [ ] 1.2.1-1.2.8 Environment variables (including timeouts)
- [ ] 1.3.1-1.3.4 Entity mappings
- [ ] **Gate 1**: Schema validation

### Phase 2: Services
- [ ] 2.1.1-2.1.3 Superfeedr service (with error handling)
- [ ] 2.2.1-2.2.3 Query generator
- [ ] 2.3.1-2.3.3 Email service (with graceful failures)
- [ ] **Gate 2**: Service tests

### Phase 3: API
- [ ] 3.1.1-3.1.7 Webhook endpoint (with error handling)
- [ ] 3.2.1-3.2.5 Alert router (with auth + ownership)
- [ ] **Gate 3**: API validation

### Phase 4: UI
- [ ] 4.1.1-4.1.3 Components
- [ ] 4.2.1-4.2.4 Alerts page
- [ ] 4.3.1 Dashboard nav
- [ ] **Gate 4**: UI validation

---

## Future Enhancements (Post-MVP)

When needed, add:
- [ ] Deduplication (NewsItem table + URL check)
- [ ] Notification logging (NotificationLog table)
- [ ] Digest emails (hourly/daily via Vercel Cron)
- [ ] Quiet hours
- [ ] Notification preferences page
- [ ] Event expiration auto-cleanup (Vercel Cron)
- [ ] SMS notifications (Twilio)
- [ ] Rate limiting on webhook endpoint
- [ ] Observability (logging, metrics)

---

## Quick Reference

**Superfeedr webhook URL:** `https://your-app.com/api/webhooks/superfeedr`

**Test locally with ngrok:**
```bash
ngrok http 4000
# Use ngrok URL as callback during development
```

**Key environment variables:**
```
SUPERFEEDR_LOGIN=your_login
SUPERFEEDR_TOKEN=your_token
SUPERFEEDR_TIMEOUT_MS=10000
RESEND_API_KEY=re_xxxxx
RESEND_TIMEOUT_MS=5000
EMAIL_FROM=alerts@kalshitracker.com
```

---

## Appendix A: Concrete Examples

### Event Ticker Parsing

**Input:** `"KXNFLSPREAD-25DEC04DALDET-DET9"`

**Output:**
```typescript
{
  series: "KXNFLSPREAD",
  eventDate: "25DEC04",        // Dec 4, 2025
  teams: ["DAL", "DET"],       // Dallas Cowboys vs Detroit Lions
  eventTicker: "KXNFLSPREAD-25DEC04DALDET",
  marketTicker: "KXNFLSPREAD-25DEC04DALDET-DET9"
}
```

### Generated Superfeedr Query

**Event:** `"KXNFLSPREAD-25DEC04DALDET"`

**Generated Query:**
```
("dallas cowboys" | "detroit lions") -fantasy -mock -draft popularity:medium
```

**Topic URL:**
```
http://track.superfeedr.com/?query=%28%22dallas%20cowboys%22%20%7C%20%22detroit%20lions%22%29%20-fantasy%20-mock%20-draft%20popularity%3Amedium
```

### Webhook Payload Example

```json
{
  "status": {
    "code": 200,
    "feed": "http://track.superfeedr.com/?query=..."
  },
  "items": [
    {
      "id": "abc123",
      "title": "Jared Goff ruled OUT for Sunday's game against Cowboys",
      "summary": "Lions quarterback Jared Goff will miss...",
      "permalinkUrl": "https://espn.com/nfl/story/_/id/12345",
      "published": 1733329200,
      "actor": {
        "displayName": "ESPN"
      }
    }
  ]
}
```

---

## Appendix B: Local Testing

### Test Webhook Without ngrok

**1. Create test payload file** (`test-payload.json`):
```json
{
  "status": { "code": 200, "feed": "http://track.superfeedr.com/?query=test" },
  "items": [{
    "id": "test-123",
    "title": "Test Article: Breaking News",
    "summary": "This is a test article for local development.",
    "permalinkUrl": "https://example.com/test-article",
    "published": 1733329200
  }]
}
```

**2. Compute signature:**
```bash
# Replace 'your-secret' with the superfeedrSecret from your EventWebhook record
BODY=$(cat test-payload.json)
SIGNATURE=$(echo -n "$BODY" | openssl sha1 -hmac 'your-secret' | awk '{print $2}')
echo "sha1=$SIGNATURE"
```

**3. Send test request:**
```bash
curl -X POST http://localhost:4000/api/webhooks/superfeedr \
  -H "Content-Type: application/json" \
  -H "X-Hub-Signature: sha1=$SIGNATURE" \
  -d @test-payload.json
```

**Expected response:** `200 OK`

### Test Signature Rejection

```bash
# Send with invalid signature - should return 401
curl -X POST http://localhost:4000/api/webhooks/superfeedr \
  -H "Content-Type: application/json" \
  -H "X-Hub-Signature: sha1=invalid" \
  -d '{"items":[]}'
```

**Expected response:** `401 Unauthorized`
