# Dashboard Navigation Header Redesign Plan

## Current State Analysis

### Structure
The current header is **duplicated** across three pages with slight variations:
- `src/app/dashboard/page.tsx` (lines 257-286)
- `src/app/dashboard/alerts/page.tsx` (lines 49-71)
- `src/app/pricing/page.tsx` (lines 60-80)

### Current Header Components
```
┌─────────────────────────────────────────────────────────────────────┐
│  [Logo] Kalshi Tracker          [Alerts] [User Email] [Sign Out]   │
└─────────────────────────────────────────────────────────────────────┘
```

**Elements:**
- Logo with TrendingUp icon → links to `/`
- "Alerts" button (dashboard only) → links to `/dashboard/alerts`
- User email display in pill
- Sign out button

### Problems Identified
1. **Code duplication** - Header copied across 3 files (~30 lines each)
2. **Inconsistent navigation** - Different pages show different nav items
3. **No shared layout** - Dashboard pages lack a shared layout component
4. **Missing navigation items** - No link to Pricing, Settings, or Dashboard from alerts page
5. **No mobile responsiveness** - Header doesn't adapt to mobile screens
6. **No active state indication** - Can't tell which page you're on

---

## Proposed Redesign

### Architecture: Shared Layout Pattern

```
src/app/dashboard/
├── layout.tsx          # NEW: Shared dashboard layout with header
├── page.tsx            # Dashboard content (remove header)
└── alerts/
    └── page.tsx        # Alerts content (remove header)
```

### New Header Structure

```
┌─────────────────────────────────────────────────────────────────────┐
│  [Logo]                [Dashboard] [Alerts] [Pricing]    [Profile] │
│  Kalshi Tracker                                          ▾ Menu    │
└─────────────────────────────────────────────────────────────────────┘

Mobile (collapsed):
┌─────────────────────────────────────────────────────────────────────┐
│  [Logo] Kalshi Tracker                              [☰ Menu]       │
└─────────────────────────────────────────────────────────────────────┘
```

### Component Hierarchy

```
DashboardHeader/
├── Logo                    # Link to /dashboard (when logged in) or / (public)
├── NavLinks                # Main navigation items
│   ├── Dashboard           # /dashboard (active indicator when current)
│   ├── Alerts              # /dashboard/alerts + notification badge
│   └── Pricing             # /pricing (show upgrade badge if free tier)
├── ProfileDropdown         # User menu
│   ├── Email display
│   ├── Phone settings link
│   ├── Subscription tier badge
│   └── Sign out
└── MobileMenu              # Hamburger menu for mobile
```

---

## Implementation Plan

### Phase 1: Create Shared Components

#### 1.1 Create `DashboardHeader` Component
**File:** `src/app/_components/DashboardHeader.tsx`

```typescript
interface DashboardHeaderProps {
  user: {
    email: string;
    phone?: string;
  };
  subscription?: {
    tier: "FREE" | "PRO";
  };
  activeAlertCount?: number;
}
```

**Features:**
- Responsive design (mobile hamburger menu)
- Active state for current route (usePathname)
- Alert badge showing active alert count
- Upgrade badge for free tier users
- Profile dropdown with account actions

#### 1.2 Create `ProfileDropdown` Component
**File:** `src/app/_components/ProfileDropdown.tsx`

**Features:**
- Email display
- Subscription tier indicator
- Quick links: Settings, Billing
- Sign out with confirmation

#### 1.3 Create `MobileNav` Component
**File:** `src/app/_components/MobileNav.tsx`

**Features:**
- Slide-out or dropdown menu
- Full navigation on mobile
- Account info section
- Close on route change

### Phase 2: Create Dashboard Layout

**File:** `src/app/dashboard/layout.tsx`

```typescript
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-black">
      <DashboardHeader />
      <main>{children}</main>
    </div>
  );
}
```

### Phase 3: Refactor Existing Pages

1. **Remove header from `dashboard/page.tsx`** (lines 257-286)
2. **Remove header from `dashboard/alerts/page.tsx`** (lines 49-71)
3. **Update pricing page** to use consistent header or separate public header

### Phase 4: Navigation Enhancement

#### Add These Nav Items:
| Item | Route | Badge/Indicator |
|------|-------|-----------------|
| Dashboard | `/dashboard` | Active state |
| Alerts | `/dashboard/alerts` | Count of active alerts |
| Pricing | `/pricing` | "Upgrade" if FREE tier |

#### Profile Dropdown Items:
| Item | Action |
|------|--------|
| Email (display) | - |
| Tier Badge | FREE/PRO indicator |
| Phone Settings | Opens phone modal |
| Billing | Links to Stripe portal |
| Sign Out | Sign out action |

---

## Design Specifications

### Colors (from existing design system)
- Background: `bg-black`
- Border: `border-gray-800`
- Primary accent: `#CDFF00` (lime)
- Text primary: `text-white`
- Text secondary: `text-gray-400`
- Hover states: `hover:text-white`, `hover:border-[#CDFF00]`

### Active Navigation State
```css
/* Active nav item */
.nav-active {
  color: #CDFF00;
  border-bottom: 2px solid #CDFF00;
}

/* Or pill style */
.nav-active-pill {
  background: rgba(205, 255, 0, 0.1);
  color: #CDFF00;
}
```

### Responsive Breakpoints
- Mobile: `< 768px` (hamburger menu)
- Desktop: `>= 768px` (full nav)

### Animations (using existing Framer Motion)
- Dropdown: `initial={{ opacity: 0, y: -10 }}` → `animate={{ opacity: 1, y: 0 }}`
- Mobile menu: Slide from right or fade in
- Badge pulse: For new alerts

---

## File Changes Summary

### New Files
| File | Purpose |
|------|---------|
| `src/app/_components/DashboardHeader.tsx` | Shared header component |
| `src/app/_components/ProfileDropdown.tsx` | User profile dropdown |
| `src/app/_components/MobileNav.tsx` | Mobile navigation menu |
| `src/app/dashboard/layout.tsx` | Shared dashboard layout |

### Modified Files
| File | Changes |
|------|---------|
| `src/app/dashboard/page.tsx` | Remove lines 254-286 (header section) |
| `src/app/dashboard/alerts/page.tsx` | Remove lines 46-71 (header section) |

### Dependencies
No new dependencies required. Uses existing:
- `lucide-react` for icons
- `framer-motion` for animations
- `next/navigation` for routing

---

## Implementation Order

1. **Create `DashboardHeader.tsx`** with all navigation logic
2. **Create `ProfileDropdown.tsx`** for user menu
3. **Create `MobileNav.tsx`** for responsive menu
4. **Create `dashboard/layout.tsx`** using the header
5. **Test layout** before removing old headers
6. **Remove old headers** from page components
7. **Test all routes** and interactions

---

## Future Enhancements (Out of Scope)

- Breadcrumb navigation
- Search in header
- Notification dropdown (real-time updates)
- Theme toggle (dark/light)
- Keyboard shortcuts menu
