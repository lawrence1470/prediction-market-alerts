# Sports Events UI/UX Design Specification

## Executive Summary

This document provides a comprehensive design solution for handling sports events in the Add Bet modal. The approach focuses on **early detection, clear communication, and encouraging user experience** while preventing sports events from being added until the feature is supported.

## Current State Analysis

### Existing Flow
1. User opens "Add Bet" modal
2. User enters event ticker (e.g., "KXTRUMPMENTIONB-25DEC05")
3. User clicks "Look up" button
4. System displays event details (title, subtitle, category, markets)
5. User clicks "Add Bet" button
6. **Backend blocks sports events** → User sees error modal

### Pain Points
- Users don't discover sports limitation until **after attempting to add**
- Error occurs at the **last step**, creating frustration
- No indication that sports is **coming soon**
- Generic error message doesn't explain **why** or provide **hope**

## Design Solution Overview

The solution implements a **progressive disclosure pattern** with three key phases:

1. **Detection Phase** - Identify sports events immediately after lookup
2. **Communication Phase** - Show clear, encouraging messaging
3. **Prevention Phase** - Disable "Add Bet" with visual feedback

---

## 1. UI/UX Design Specification

### Visual Design System

#### Color Palette
- **Primary Action**: `#CDFF00` (brand lime green) - encouragement
- **Disabled State**: `#6B7280` (gray-500) - neutral blocking
- **Info/Future**: `#3B82F6` (blue-500) - forward-looking
- **Warning**: `#F59E0B` (amber-500) - attention without alarm
- **Background Gradient**: Subtle gradient for "coming soon" banner

#### Typography
- **Main Message**: `text-sm font-medium` - clear and readable
- **Secondary Text**: `text-xs` - supporting information
- **Icon Size**: `h-4 w-4` - balanced with text

### Component Architecture

#### A. Sports Event Detection Banner

**When to Show**: Immediately after successful event lookup when `category === "Sports"`

**Visual Design**:
```
┌─────────────────────────────────────────────────────────────┐
│  🏆  Sports Betting Alerts Coming Soon!                     │
│                                                              │
│  We're building support for sports events. For now,         │
│  you can track politics, crypto, economics, and more.       │
│                                                              │
│  📧 Want early access? Join our waitlist →                  │
└─────────────────────────────────────────────────────────────┘
```

**Color Scheme**:
- Background: Gradient from `blue-900/20` to `blue-800/10`
- Border: `blue-700/50`
- Icon: `text-[#CDFF00]` (brand color for positivity)
- Text: Primary `text-white`, Secondary `text-gray-300`
- Link: `text-[#CDFF00] hover:text-[#b8e600]`

**Animation**:
- Fade in with `motion.div` from Framer Motion
- Entrance: `initial={{ opacity: 0, y: -10 }}` → `animate={{ opacity: 1, y: 0 }}`
- Duration: 300ms with spring physics

#### B. Disabled "Add Bet" Button State

**Visual Changes When Sports Event**:

**Normal State** (non-sports):
```tsx
<button className="bg-[#CDFF00] hover:bg-[#b8e600] text-black">
  Add Bet
</button>
```

**Disabled State** (sports):
```tsx
<button
  disabled
  className="bg-gray-700 cursor-not-allowed opacity-60 text-gray-400"
>
  <Lock className="h-4 w-4 mr-2" />
  Not Available Yet
</button>
```

**Tooltip on Hover** (shows on disabled button hover):
- "Sports events coming soon! Try politics, crypto, or economics."
- Small tooltip above button, dark background, white text

#### C. Event Preview Card Enhancement

**Current Event Preview**:
```
┌─────────────────────────────────────┐
│ CRYPTO                              │
│ Will Bitcoin hit $100k?             │
│ Before Dec 31, 2024                 │
│ 12 markets                          │
└─────────────────────────────────────┘
```

**Sports Event Preview** (with visual indicator):
```
┌─────────────────────────────────────┐
│ SPORTS  🏃‍♂️ Coming Soon             │
│ Will Lakers win NBA Finals?         │
│ 2024-25 Season                      │
│ 8 markets                           │
│                                     │
│ ⚠️ Sports alerts not yet available  │
└─────────────────────────────────────┘
```

**Design Details**:
- Category badge includes emoji + "Coming Soon" chip
- Bottom warning bar: `bg-amber-900/20 border-t border-amber-700/50`
- Warning icon: `text-amber-500`
- Warning text: `text-amber-200 text-xs`

---

## 2. Interaction Design Flow

### User Journey Map

#### Scenario 1: User Searches Sports Event

```
Step 1: User enters "NBA-LAKERS-WIN"
  └─> Input field, no indication yet

Step 2: User clicks "Look up"
  └─> Button shows loading spinner
  └─> API call to Kalshi

Step 3: Event data returns (category: "Sports")
  └─> Event preview card renders with sports indicators
  └─> "Coming Soon" banner fades in above preview
  └─> "Add Bet" button becomes disabled with lock icon

Step 4: User hovers over disabled button
  └─> Tooltip appears: "Sports events coming soon!"

Step 5: User clicks "Join our waitlist" link
  └─> Opens mailto: link or waitlist form (future)
  └─> Modal stays open (doesn't close)

Step 6: User closes modal or searches different event
  └─> Modal resets state, banner disappears
```

#### Scenario 2: User Searches Non-Sports Event

```
Step 1-2: Same as above
  └─> User enters "TRUMP-MENTION" and clicks lookup

Step 3: Event data returns (category: "Politics")
  └─> Event preview card renders normally
  └─> NO banner appears
  └─> "Add Bet" button remains enabled

Step 4: User clicks "Add Bet"
  └─> Normal flow continues, bet is added
```

### State Management

#### Modal States
```typescript
type ModalState = {
  // Existing states
  eventTicker: string;
  eventPreview: KalshiEvent | null;
  eventLoading: boolean;
  eventError: Error | null;

  // New state
  isSportsEvent: boolean; // Derived from eventPreview.category === "Sports"
}
```

#### Derived State Logic
```typescript
const isSportsEvent = eventPreview?.event?.category === "Sports";
const canAddBet = eventPreview && !isSportsEvent;
```

---

## 3. Copy & Messaging Strategy

### Banner Messages (3 Variations)

#### Option A: Enthusiastic & Informative (Recommended)
```
🏆 Sports Betting Alerts Coming Soon!

We're building support for sports events. For now, you can track
politics, crypto, economics, and more.

📧 Want early access? Join our waitlist →
```

**Why this works**:
- Starts with emoji and excitement
- Acknowledges future support explicitly
- Offers alternative categories
- Provides action for interested users

#### Option B: Brief & Direct
```
⚽ Sports events not yet supported

Track other categories like politics and crypto while we build
sports alerts. Join waitlist for early access →
```

**Why this works**:
- Extremely concise
- Direct about limitation
- Quick call-to-action

#### Option C: Educational & Friendly
```
🏀 Building Sports Alerts

Sports betting alerts are in development! Our system currently
supports politics, crypto, economics, and 15+ other categories.

Be first to know when sports go live →
```

**Why this works**:
- Emphasizes development progress
- Shows breadth of current support (15+ categories)
- FOMO appeal with "be first to know"

### Button Labels

#### Disabled Button States
- **Option 1**: "Not Available Yet" (Recommended)
- **Option 2**: "Coming Soon"
- **Option 3**: "Sports Not Supported"

**Recommended**: "Not Available Yet" with lock icon - temporary but clear

#### Tooltip Messages
- **On disabled button hover**: "Sports events coming soon! Try politics, crypto, or economics."
- **On category badge hover**: "Sports alerts in development"

### Error Prevention Messages

**If user somehow bypasses frontend and backend rejects**:
```
Cannot Add Sports Event

Sports betting alerts are coming soon! For now, try tracking
politics, crypto, economics, or other event categories.

We'll notify you when sports support launches.

[Got it]
```

---

## 4. Component Structure

### File Organization

```
src/app/dashboard/
├── page.tsx (main dashboard, contains modal)
└── _components/
    ├── AddBetModal.tsx (NEW - extracted modal)
    ├── SportsComingSoonBanner.tsx (NEW)
    ├── EventPreviewCard.tsx (NEW)
    └── DisabledBetButton.tsx (NEW - optional)
```

### Component Hierarchy

```
<AddBetModal>
  └─ <Modal Container>
      ├─ <Modal Header>
      ├─ <Event Ticker Input>
      ├─ <Lookup Button>
      ├─ {eventError && <ErrorAlert />}
      ├─ {isSportsEvent && <SportsComingSoonBanner />}
      ├─ {eventPreview && <EventPreviewCard isSports={isSportsEvent} />}
      └─ <Modal Footer>
          ├─ <Cancel Button>
          └─ <AddBetButton disabled={isSportsEvent} />
```

### SportsComingSoonBanner Component

```typescript
interface SportsComingSoonBannerProps {
  onWaitlistClick?: () => void;
}

export function SportsComingSoonBanner({
  onWaitlistClick
}: SportsComingSoonBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="mb-4 rounded-lg border border-blue-700/50 bg-gradient-to-br from-blue-900/20 to-blue-800/10 p-4"
    >
      {/* Icon and Header */}
      <div className="mb-2 flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-[#CDFF00]" />
        <h3 className="text-sm font-semibold text-white">
          Sports Betting Alerts Coming Soon!
        </h3>
      </div>

      {/* Body Text */}
      <p className="mb-3 text-xs text-gray-300">
        We're building support for sports events. For now, you can track
        politics, crypto, economics, and more.
      </p>

      {/* CTA Link */}
      <button
        onClick={onWaitlistClick}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-[#CDFF00] transition-colors hover:text-[#b8e600]"
      >
        <Mail className="h-3 w-3" />
        Want early access? Join our waitlist →
      </button>
    </motion.div>
  );
}
```

### EventPreviewCard Component Enhancement

```typescript
interface EventPreviewCardProps {
  event: KalshiEvent;
  isSportsEvent: boolean;
}

export function EventPreviewCard({
  event,
  isSportsEvent
}: EventPreviewCardProps) {
  return (
    <div className="mb-4 overflow-hidden rounded-lg border border-gray-700 bg-gray-800">
      {/* Main Content */}
      <div className="p-4">
        <div className="mb-1 flex items-center gap-2">
          <span className="text-xs text-[#CDFF00]">
            {event.category}
          </span>
          {isSportsEvent && (
            <span className="rounded-full bg-blue-900/50 px-2 py-0.5 text-xs text-blue-300">
              🏃‍♂️ Coming Soon
            </span>
          )}
        </div>

        <div className="mb-1 text-lg font-medium text-white">
          {event.title}
        </div>

        {event.sub_title && (
          <div className="text-sm text-gray-400">{event.sub_title}</div>
        )}

        <div className="mt-2 text-xs text-gray-500">
          {event.markets?.length ?? 0} markets
        </div>
      </div>

      {/* Sports Warning Footer */}
      {isSportsEvent && (
        <div className="flex items-center gap-2 border-t border-amber-700/50 bg-amber-900/20 px-4 py-2">
          <AlertCircle className="h-3 w-3 flex-shrink-0 text-amber-500" />
          <span className="text-xs text-amber-200">
            Sports alerts not yet available
          </span>
        </div>
      )}
    </div>
  );
}
```

---

## 5. Technical Implementation Guide

### Step 1: Add Sports Detection Logic

In `src/app/dashboard/page.tsx`:

```typescript
// Add derived state
const isSportsEvent = eventPreview?.event?.category === "Sports";
const canAddBet = eventPreview && !isSportsEvent;
```

### Step 2: Modify Modal JSX

**Add banner after event lookup**:
```tsx
{isSportsEvent && <SportsComingSoonBanner />}
```

**Update event preview card**:
```tsx
{eventPreview && (
  <EventPreviewCard
    event={eventPreview.event}
    isSportsEvent={isSportsEvent}
  />
)}
```

**Update Add Bet button**:
```tsx
<button
  onClick={handleAddBet}
  disabled={!canAddBet || createBet.isPending}
  className={`flex-1 rounded-lg py-3 font-medium transition-colors ${
    !canAddBet
      ? "cursor-not-allowed bg-gray-700 text-gray-400 opacity-60"
      : "cursor-pointer bg-[#CDFF00] text-black hover:bg-[#b8e600]"
  } disabled:cursor-not-allowed disabled:opacity-50`}
>
  {isSportsEvent ? (
    <span className="flex items-center justify-center gap-2">
      <Lock className="h-4 w-4" />
      Not Available Yet
    </span>
  ) : createBet.isPending ? (
    "Adding..."
  ) : (
    "Add Bet"
  )}
</button>
```

### Step 3: Add Tooltip (Optional Enhancement)

Using a library like Radix UI Tooltip or custom implementation:

```tsx
<Tooltip content="Sports events coming soon! Try politics, crypto, or economics.">
  <button disabled={!canAddBet}>
    {/* Button content */}
  </button>
</Tooltip>
```

### Step 4: Analytics Tracking (Future)

Track when users encounter sports events:

```typescript
if (isSportsEvent) {
  analytics.track("Sports Event Blocked", {
    eventTicker: eventPreview.event.event_ticker,
    category: eventPreview.event.category,
    timestamp: Date.now(),
  });
}
```

### Step 5: Waitlist Integration (Future)

**Option A**: Simple mailto link
```typescript
const handleWaitlistClick = () => {
  window.location.href = "mailto:support@kalshitracker.com?subject=Sports%20Waitlist";
};
```

**Option B**: Form submission to database
```typescript
const joinWaitlist = api.waitlist.join.useMutation({
  onSuccess: () => {
    toast.success("You're on the waitlist!");
  },
});
```

---

## 6. Accessibility Considerations

### Keyboard Navigation
- Ensure disabled button is still focusable via keyboard
- Add `aria-disabled="true"` instead of just `disabled` for better screen reader support
- Ensure banner is announced by screen readers

### Screen Reader Support

```tsx
<button
  disabled={!canAddBet}
  aria-disabled={!canAddBet}
  aria-label={
    isSportsEvent
      ? "Add bet - not available for sports events yet"
      : "Add bet to your tracker"
  }
>
  {/* Button content */}
</button>
```

### Focus Management
- When banner appears, consider announcing it with `role="status"` or `aria-live="polite"`
- Ensure focus remains on modal when banner renders

### Color Contrast
- Banner text: Ensure WCAG AA compliance (4.5:1 ratio minimum)
- Disabled button: Use 60% opacity to maintain visibility while indicating disabled state

---

## 7. Edge Cases & Error Handling

### Edge Case 1: API Returns Null Category
```typescript
const isSportsEvent =
  eventPreview?.event?.category?.toLowerCase() === "sports" ?? false;
```

### Edge Case 2: User Has Slow Connection
- Show loading spinner during lookup
- Banner fades in smoothly (no jarring appearance)
- Disabled state renders immediately with event data

### Edge Case 3: User Clicks Waitlist Multiple Times
```typescript
const [waitlistJoined, setWaitlistJoined] = useState(false);

const handleWaitlistClick = () => {
  if (waitlistJoined) return;
  // Submit waitlist
  setWaitlistJoined(true);
};
```

### Edge Case 4: Category Name Variations
```typescript
const SPORTS_CATEGORIES = [
  "sports",
  "sport",
  "athletics",
  "esports",
  "e-sports"
];

const isSportsEvent =
  SPORTS_CATEGORIES.includes(
    eventPreview?.event?.category?.toLowerCase() ?? ""
  );
```

---

## 8. Future Enhancements

### Phase 1: Basic Sports Support (Post-Launch)
1. Remove banner and disabled state
2. Add sports-specific query generation logic
3. Test with NFL, NBA, MLB, NHL events
4. Monitor false positive rates

### Phase 2: Sports Category Filters
1. Allow users to toggle sports events visibility
2. Add "Show sports events" checkbox in settings
3. Show preview but disable until ready

### Phase 3: Waitlist Notifications
1. Build waitlist database table
2. Send email when sports support launches
3. Auto-enable sports for waitlist users

### Phase 4: Category-Specific Features
1. Sports-specific alert customization
2. Game time proximity alerts
3. Player injury news filtering

---

## 9. Visual Design Mockups

### Mobile View (375px)

```
┌─────────────────────────────────────┐
│  Add Your Kalshi Bet              X │
├─────────────────────────────────────┤
│                                     │
│  Event ID                           │
│  ┌───────────────────┬─────────┐   │
│  │ NBA-LAKERS-WIN    │ Look up │   │
│  └───────────────────┴─────────┘   │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ 🏆 Sports Alerts Coming Soon  │ │
│  │                               │ │
│  │ We're building support for    │ │
│  │ sports events...              │ │
│  │                               │ │
│  │ 📧 Join waitlist →            │ │
│  └───────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ SPORTS  🏃 Coming Soon        │ │
│  │                               │ │
│  │ Will Lakers win Finals?       │ │
│  │ 2024-25 Season                │ │
│  │ 8 markets                     │ │
│  │───────────────────────────────│ │
│  │ ⚠️ Sports alerts not available│ │
│  └───────────────────────────────┘ │
│                                     │
│  ┌────────┐  ┌─────────────────┐  │
│  │ Cancel │  │ 🔒 Not Available│  │
│  └────────┘  └─────────────────┘  │
│                                     │
└─────────────────────────────────────┘
```

### Desktop View (with Hover Tooltip)

```
┌─────────────────────────────────────────────────────────┐
│  Add Your Kalshi Bet                                  X │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Event ID                                               │
│  ┌─────────────────────────────────────┬─────────────┐ │
│  │ NBA-LAKERS-WIN                      │  Look up    │ │
│  └─────────────────────────────────────┴─────────────┘ │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 🏆  Sports Betting Alerts Coming Soon!          │   │
│  │                                                  │   │
│  │ We're building support for sports events. For   │   │
│  │ now, you can track politics, crypto, economics, │   │
│  │ and more.                                        │   │
│  │                                                  │   │
│  │ 📧 Want early access? Join our waitlist →       │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ SPORTS  🏃‍♂️ Coming Soon                          │   │
│  │                                                  │   │
│  │ Will Lakers win NBA Finals?                     │   │
│  │ 2024-25 Season                                   │   │
│  │ 8 markets                                        │   │
│  ├──────────────────────────────────────────────────┤  │
│  │ ⚠️ Sports alerts not yet available               │   │
│  └─────────────────────────────────────────────────┘   │
│           ┌────────────────────────────────┐           │
│           │ Sports events coming soon!     │ (tooltip) │
│           │ Try politics, crypto, or       │           │
│           │ economics.                     │           │
│           └─────────────┬──────────────────┘           │
│  ┌──────────────┐   ┌──▼────────────────────┐         │
│  │   Cancel     │   │ 🔒 Not Available Yet  │         │
│  └──────────────┘   └───────────────────────┘         │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 10. Success Metrics & Testing

### Success Criteria

**User Understanding**:
- 95% of users who encounter banner understand sports is coming soon
- <5% attempt to add sports events after seeing banner
- User feedback indicates "encouraging" rather than "frustrating" experience

**Conversion Metrics**:
- Waitlist sign-up rate from banner CTA
- % of users who try alternative categories after seeing sports banner
- Time spent in modal when sports event detected

### A/B Testing Variations

Test different banner messages to optimize:
1. **Control**: Option A (Enthusiastic & Informative)
2. **Variant B**: Option B (Brief & Direct)
3. **Variant C**: Option C (Educational & Friendly)

Measure:
- Click-through rate on waitlist CTA
- Modal abandonment rate
- Time to try alternative event

### User Testing Script

**Scenario**: "You want to add a bet on the Lakers to win the NBA Finals. Walk through how you would do that."

**Observe**:
1. Do they notice the banner immediately?
2. Do they read the entire message?
3. Do they understand sports is unavailable?
4. Do they click waitlist CTA?
5. Do they try a different category?

**Follow-up Questions**:
- "How do you feel about this experience?"
- "Is it clear when sports will be supported?"
- "Would you try tracking a different type of event?"

---

## 11. Implementation Checklist

### Phase 1: Core UI (Week 1)
- [ ] Create `SportsComingSoonBanner.tsx` component
- [ ] Enhance `EventPreviewCard` with sports indicator
- [ ] Add `isSportsEvent` derived state to dashboard
- [ ] Update "Add Bet" button with disabled state
- [ ] Add lock icon to button label
- [ ] Test category detection logic

### Phase 2: Polish (Week 1)
- [ ] Add Framer Motion animations to banner
- [ ] Implement hover tooltip on disabled button
- [ ] Ensure responsive design on mobile (320px - 768px)
- [ ] Add accessibility attributes (aria-label, aria-disabled)
- [ ] Verify color contrast ratios (WCAG AA)

### Phase 3: Waitlist Integration (Week 2)
- [ ] Create waitlist database table (optional)
- [ ] Add mailto: link or form submission
- [ ] Track "joined waitlist" analytics event
- [ ] Prevent duplicate waitlist submissions
- [ ] Add confirmation message after joining

### Phase 4: Testing & Launch (Week 2)
- [ ] Unit tests for `isSportsEvent` logic
- [ ] Integration test: lookup sports event → banner appears
- [ ] Integration test: button remains disabled
- [ ] Cross-browser testing (Chrome, Firefox, Safari)
- [ ] Mobile device testing (iOS Safari, Chrome Android)
- [ ] Accessibility audit with screen reader
- [ ] Gather initial user feedback

---

## 12. Rollback Plan

If user feedback is negative or technical issues arise:

### Immediate Rollback Steps
1. Remove `SportsComingSoonBanner` component rendering
2. Remove disabled button logic
3. Backend validation remains (prevents sports events)
4. Users see original error modal (temporary)

### Alternative Approach (Fallback)
If banner approach fails, implement simpler solution:
- Add sports emoji ⚠️ next to category in event preview
- Keep "Add Bet" button enabled
- Show error modal with improved messaging
- Track which events users try to add

---

## Conclusion

This design solution addresses the sports event limitation with:

✅ **Early Detection** - Users know immediately after lookup
✅ **Clear Communication** - Encouraging message explains limitation and future
✅ **Smooth UX** - No frustrating error at final step
✅ **Future-Focused** - Waitlist CTA converts interested users
✅ **Accessible** - Works for all users, all devices
✅ **Maintainable** - Clean components, easy to remove when sports launches

The approach transforms a potential frustration point into an opportunity for user engagement and anticipation.
