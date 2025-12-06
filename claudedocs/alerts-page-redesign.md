# Alerts Page Redesign - Design Specification

## Overview

Transform the alerts page from a simple list of alert subscriptions to a **news feed experience** showing actual articles found for each bet, with images, links, and article metadata.

---

## Current State

```
┌─────────────────────────────────────────┐
│ AlertCard                                │
│ ┌─────────────────────────────────────┐ │
│ │ Event Title        [ACTIVE] [Pause] │ │
│ │ market-ticker                       │ │
│ │ Tracking: search query              │ │
│ │ Added: Jan 1, 2025                  │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

**Problems:**
- No visibility into what news has been found
- Users can't see the value they're getting
- No way to browse historical articles
- No images or rich content

---

## Proposed Design

### Visual Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ Alerts Page                                                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ AlertGroup: Bitcoin Price                          [Manage ▼]│ │
│ │ Tracking: BTC price movements • 12 articles found           │ │
│ ├─────────────────────────────────────────────────────────────┤ │
│ │                                                              │ │
│ │  ┌──────────┐  Bitcoin Surges Past $100K              →     │ │
│ │  │  IMAGE   │  CoinDesk • 2 hours ago                       │ │
│ │  │  (16:9)  │  Bitcoin reached a new all-time high as...    │ │
│ │  └──────────┘                                                │ │
│ │                                                              │ │
│ │  ┌──────────┐  Institutional Buying Accelerates       →     │ │
│ │  │  IMAGE   │  Reuters • 5 hours ago                        │ │
│ │  │  (16:9)  │  Major funds are increasing their...          │ │
│ │  └──────────┘                                                │ │
│ │                                                              │ │
│ │  [Show 10 more articles...]                                  │ │
│ │                                                              │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ AlertGroup: Federal Reserve                        [Manage ▼]│ │
│ │ Tracking: Fed rate decisions • 3 articles found             │ │
│ ├─────────────────────────────────────────────────────────────┤ │
│ │                                                              │ │
│ │  ┌──────────┐  Fed Signals Rate Cut in March          →     │ │
│ │  │  IMAGE   │  Bloomberg • 1 day ago                        │ │
│ │  │  (16:9)  │  Federal Reserve officials indicated...       │ │
│ │  └──────────┘                                                │ │
│ │                                                              │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Model Changes

### New Prisma Model: `NewsArticle`

```prisma
model NewsArticle {
  id            String   @id @default(cuid())

  // Article content
  title         String
  summary       String?  @db.Text
  url           String
  imageUrl      String?  // OG image from article
  source        String?  // Publisher name
  publishedAt   DateTime?

  // Relationships
  eventTicker   String
  eventWebhook  EventWebhook @relation(fields: [eventTicker], references: [eventTicker])

  // Deduplication
  urlHash       String   @unique // MD5 hash of URL for dedup

  // Timestamps
  createdAt     DateTime @default(now())

  @@index([eventTicker])
  @@index([createdAt])
  @@map("news_article")
}

// Update EventWebhook to include articles relation
model EventWebhook {
  // ... existing fields ...
  articles      NewsArticle[]
}
```

### Article Capture Flow

```
Superfeedr Webhook → Parse Article → Extract OG Image → Store in DB → Send Notifications
                                           ↓
                                    Use unfurl/metadata
                                    library to get image
```

---

## Component Architecture

### 1. `NewsArticleCard` Component

```tsx
interface NewsArticleCardProps {
  article: {
    id: string;
    title: string;
    summary?: string;
    url: string;
    imageUrl?: string;
    source?: string;
    publishedAt?: Date;
  };
}
```

**Features:**
- Thumbnail image (16:9 aspect ratio, lazy loaded)
- Fallback gradient if no image
- Title (truncated to 2 lines)
- Source + relative time (e.g., "2 hours ago")
- Summary (truncated to 2 lines)
- Click opens article in new tab
- Hover state with subtle lift animation

**Responsive:**
- Desktop: Image left, text right (horizontal)
- Mobile: Image top, text bottom (stacked)

### 2. `AlertGroup` Component

```tsx
interface AlertGroupProps {
  alert: {
    id: string;
    eventTicker: string;
    marketTicker: string;
    status: "ACTIVE" | "PAUSED" | "EXPIRED";
    eventWebhook: {
      searchQuery: string;
      status: string;
    };
  };
  articles: NewsArticle[];
  totalArticles: number;
}
```

**Features:**
- Collapsible header with event title
- Status badge and manage dropdown
- Article count indicator
- List of `NewsArticleCard` components
- "Show more" button with pagination
- Empty state when no articles yet

### 3. Updated Alerts Page

```tsx
// Query returns alerts grouped with their articles
const { data } = api.alert.getAlertsWithArticles.useQuery({
  articlesPerAlert: 3, // Initial load
});
```

**Features:**
- List of `AlertGroup` components
- Empty state with CTA to add alerts
- Pull-to-refresh on mobile
- Infinite scroll or pagination for alerts with many articles

---

## API Changes

### New tRPC Procedure: `getAlertsWithArticles`

```typescript
getAlertsWithArticles: protectedProcedure
  .input(z.object({
    articlesPerAlert: z.number().min(1).max(20).default(3),
  }))
  .query(async ({ ctx, input }) => {
    const alerts = await ctx.db.userAlert.findMany({
      where: { userId: ctx.session.user.id },
      include: {
        eventWebhook: {
          select: {
            eventTicker: true,
            status: true,
            searchQuery: true,
            articles: {
              take: input.articlesPerAlert,
              orderBy: { createdAt: 'desc' },
            },
            _count: { select: { articles: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return alerts.map(alert => ({
      ...alert,
      articles: alert.eventWebhook.articles,
      totalArticles: alert.eventWebhook._count.articles,
    }));
  });
```

### New tRPC Procedure: `getMoreArticles`

```typescript
getMoreArticles: protectedProcedure
  .input(z.object({
    eventTicker: z.string(),
    cursor: z.string().optional(), // For cursor pagination
    limit: z.number().min(1).max(50).default(10),
  }))
  .query(async ({ ctx, input }) => {
    // Verify user has access to this event
    const hasAccess = await ctx.db.userAlert.findFirst({
      where: {
        userId: ctx.session.user.id,
        eventTicker: input.eventTicker,
      },
    });

    if (!hasAccess) {
      throw new TRPCError({ code: 'FORBIDDEN' });
    }

    return ctx.db.newsArticle.findMany({
      where: { eventTicker: input.eventTicker },
      take: input.limit + 1, // +1 to check if more exist
      cursor: input.cursor ? { id: input.cursor } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  });
```

---

## Webhook Handler Updates

### Image Extraction

```typescript
import { unfurl } from 'unfurl.js';

async function extractArticleImage(url: string): Promise<string | null> {
  try {
    const metadata = await unfurl(url, { timeout: 5000 });
    return metadata.open_graph?.images?.[0]?.url
        ?? metadata.twitter_card?.images?.[0]?.url
        ?? null;
  } catch {
    return null;
  }
}
```

### Updated Webhook Flow

```typescript
// In superfeedr/route.ts POST handler
for (const item of items) {
  // Extract image (don't block on failure)
  const imageUrl = await extractArticleImage(item.permalinkUrl);

  // Generate URL hash for deduplication
  const urlHash = crypto.createHash('md5')
    .update(item.permalinkUrl ?? item.id)
    .digest('hex');

  // Store article (upsert to handle duplicates)
  await ctx.db.newsArticle.upsert({
    where: { urlHash },
    create: {
      eventTicker: eventWebhook.eventTicker,
      title: item.title,
      summary: item.summary,
      url: item.permalinkUrl ?? '#',
      imageUrl,
      source: item.actor?.displayName,
      publishedAt: item.published ? new Date(item.published * 1000) : null,
      urlHash,
    },
    update: {}, // No update if exists
  });

  // Continue with email/SMS notifications...
}
```

---

## UI States

### Loading State
- Skeleton cards with pulsing animation
- 3 skeleton article cards per group

### Empty State (No Alerts)
```
┌─────────────────────────────────────┐
│         🔔 No alerts yet            │
│                                     │
│   Add alerts from your bets on      │
│   the dashboard to receive          │
│   real-time news updates.           │
│                                     │
│       [Go to Dashboard]             │
└─────────────────────────────────────┘
```

### Empty State (Alert with No Articles)
```
┌─────────────────────────────────────┐
│ AlertGroup: Event Name              │
│ Tracking: query • 0 articles found  │
├─────────────────────────────────────┤
│                                     │
│   📰 No articles yet                │
│                                     │
│   We're monitoring for news about   │
│   this event. You'll be notified    │
│   when articles are published.      │
│                                     │
└─────────────────────────────────────┘
```

### Error State
- Toast notification for fetch errors
- Retry button in alert group header

---

## Implementation Phases

### Phase 1: Database & API
1. Add `NewsArticle` model to Prisma schema
2. Run migration
3. Update webhook handler to store articles
4. Add `getAlertsWithArticles` procedure
5. Add `getMoreArticles` procedure

### Phase 2: Components
1. Create `NewsArticleCard` component
2. Create `AlertGroup` component
3. Create skeleton loading components

### Phase 3: Page Integration
1. Update alerts page to use new query
2. Implement "Show more" pagination
3. Add empty states

### Phase 4: Polish
1. Image lazy loading with blur placeholder
2. Pull-to-refresh on mobile
3. Article read tracking (optional)
4. Animations and transitions

---

## Dependencies

### New Package: `unfurl.js`
For extracting Open Graph metadata from article URLs.

```bash
npm install unfurl.js
```

---

## Performance Considerations

1. **Image Optimization**: Use Next.js Image component with remote patterns
2. **Lazy Loading**: Only load images when in viewport
3. **Pagination**: Limit initial articles per alert to 3
4. **Caching**: Cache article metadata extraction results
5. **Background Processing**: Extract images asynchronously (don't block webhook response)

---

## Migration Strategy

1. Deploy database migration
2. Deploy updated webhook handler (starts collecting articles)
3. Deploy new UI components
4. Historical articles won't exist - only new ones from this point forward

---

## Performance Requirements

1. **Page Load**: Alerts page loads in <2s with 50 alerts, 3 articles each
2. **Webhook Response**: Handler responds in <500ms (image extraction must not block)
3. **Image Extraction**: Completes within 30s via background job, not in webhook handler
4. **Article Cleanup**: Articles older than 90 days auto-deleted via daily cron job

---

## Open Questions

1. **Image Fallback**: What gradient/pattern for missing images?
2. **Read Tracking**: Should we track which articles user has clicked?
3. **Notifications Badge**: Show unread count in header?
