# Sports Events UI/UX - Quick Reference Guide

## 🎯 Design Philosophy
**Transform a limitation into an opportunity for engagement**

## 🔑 Key Design Decisions

### 1. **Detection Timing**
- ✅ **AFTER** event lookup (when category is known)
- ❌ **NOT** before lookup (no false positives)
- ❌ **NOT** at submission (too late, frustrating)

### 2. **Communication Tone**
- ✅ Encouraging: "Coming Soon!" with 🏆 emoji
- ✅ Informative: Explain what IS available now
- ✅ Actionable: Waitlist CTA for engaged users
- ❌ Negative: "Not supported", "Unavailable"

### 3. **Visual Hierarchy**
```
Priority 1: Sports Banner (high visibility, encouraging)
Priority 2: Event Preview with indicator (context)
Priority 3: Disabled button (enforcement)
```

## 📐 Component Layout

```
┌──────────────────────────────────────┐
│ [Event Ticker Input] [Look up Btn]  │  ← User enters ticker
├──────────────────────────────────────┤
│                                      │
│ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ │
│ ┃ 🏆 Sports Coming Soon!         ┃ │  ← Appears ONLY for sports
│ ┃ Try politics, crypto, etc.     ┃ │
│ ┃ 📧 Join waitlist →             ┃ │
│ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
│                                      │
│ ┌────────────────────────────────┐  │
│ │ SPORTS 🏃 Coming Soon          │  │  ← Event preview with badge
│ │ Will Lakers win Finals?        │  │
│ │ ⚠️ Sports alerts not available │  │
│ └────────────────────────────────┘  │
│                                      │
│ [Cancel] [🔒 Not Available Yet]    │  ← Disabled button
└──────────────────────────────────────┘
```

## 🎨 Color Palette

| Element | Color | Purpose |
|---------|-------|---------|
| Banner Background | `blue-900/20` gradient | Forward-looking, calm |
| Banner Border | `blue-700/50` | Subtle definition |
| Primary Icon | `#CDFF00` (brand) | Positivity, consistency |
| Banner Text | `white` / `gray-300` | Readability |
| CTA Link | `#CDFF00` → `#b8e600` | Brand action color |
| Disabled Button | `gray-700` | Neutral blocking |
| Warning Footer | `amber-900/20` | Attention without alarm |

## 💬 Copy Templates

### Banner (Recommended)
```
🏆 Sports Betting Alerts Coming Soon!

We're building support for sports events. For now, you can track
politics, crypto, economics, and more.

📧 Want early access? Join our waitlist →
```

### Event Card Warning
```
⚠️ Sports alerts not yet available
```

### Disabled Button Label
```
🔒 Not Available Yet
```

### Hover Tooltip
```
Sports events coming soon! Try politics, crypto, or economics.
```

## 🔧 Technical Implementation

### Detection Logic
```typescript
const isSportsEvent = eventPreview?.event?.category === "Sports";
const canAddBet = eventPreview && !isSportsEvent;
```

### Conditional Rendering
```tsx
{isSportsEvent && <SportsComingSoonBanner />}

<button disabled={!canAddBet}>
  {isSportsEvent ? (
    <>
      <Lock className="h-4 w-4" />
      Not Available Yet
    </>
  ) : (
    "Add Bet"
  )}
</button>
```

## ✨ Animations (Framer Motion)

```typescript
// Banner entrance
initial={{ opacity: 0, y: -10 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.3, ease: "easeOut" }}

// Button state change (existing)
whileHover={{ scale: 1.05 }}
whileTap={{ scale: 0.95 }}
```

## 📱 Responsive Breakpoints

| Screen | Layout Changes |
|--------|----------------|
| Mobile (< 640px) | Stack buttons vertically, reduce padding |
| Tablet (640-1024px) | Default layout |
| Desktop (> 1024px) | Add hover tooltip on disabled button |

## ♿ Accessibility Checklist

- [ ] `aria-disabled="true"` on button (not just `disabled`)
- [ ] `aria-label` describing why button is disabled
- [ ] Banner has `role="status"` or `aria-live="polite"`
- [ ] Color contrast ≥ 4.5:1 (WCAG AA)
- [ ] Keyboard navigation works (Tab, Enter)
- [ ] Screen reader announces state changes

## 🧪 Testing Scenarios

### Test Case 1: Sports Event
1. Enter "NBA-LAKERS-WIN"
2. Click "Look up"
3. ✅ Banner appears
4. ✅ Event preview shows "Coming Soon" badge
5. ✅ Button is disabled with lock icon
6. ✅ Tooltip shows on hover

### Test Case 2: Non-Sports Event
1. Enter "TRUMP-MENTION"
2. Click "Look up"
3. ✅ NO banner appears
4. ✅ Event preview normal
5. ✅ Button is enabled
6. ✅ Can add bet successfully

### Test Case 3: Waitlist Click
1. Follow Test Case 1
2. Click "Join waitlist" link
3. ✅ Opens mailto: or form
4. ✅ Modal stays open
5. ✅ Analytics event fires (if implemented)

## 📊 Success Metrics

**Understanding**:
- 95%+ users understand sports is coming soon
- <5% attempt to add after seeing banner

**Engagement**:
- Track waitlist sign-up rate
- % who try alternative categories
- Time in modal with sports event

**Sentiment**:
- User feedback: "encouraging" vs "frustrating"
- Support ticket reduction for sports errors

## 🚀 Implementation Phases

**Phase 1: Core UI** (Day 1-2)
- Banner component
- Event card enhancement
- Button disabled state

**Phase 2: Polish** (Day 3)
- Animations
- Tooltips
- Responsive design

**Phase 3: Waitlist** (Day 4-5)
- CTA integration
- Analytics tracking
- Confirmation flow

**Phase 4: Testing** (Day 6-7)
- Cross-browser
- Accessibility audit
- User testing

## 🎯 One-Line Summary for Stakeholders

> **We detect sports events immediately after lookup, show an encouraging "coming soon" message with waitlist CTA, and disable the add button—transforming a limitation into user engagement.**

---

## 🔗 Related Files

- **Full Spec**: `/claudedocs/sports-events-ux-design.md`
- **Implementation**: `/src/app/dashboard/page.tsx` (modal)
- **New Components**: `/src/app/dashboard/_components/`
  - `SportsComingSoonBanner.tsx`
  - `EventPreviewCard.tsx` (enhanced)

## 💡 Why This Design Works

1. **Early Detection** - Users know immediately (no wasted effort)
2. **Positive Framing** - "Coming soon" not "not supported"
3. **Clear Alternatives** - Suggests what DOES work
4. **Future Engagement** - Waitlist converts interested users
5. **Accessible** - Works for everyone, every device
6. **Easy to Remove** - Clean when sports launches
