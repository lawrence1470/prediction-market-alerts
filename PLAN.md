# Mobile Expo App Implementation Plan

## Overview

Create a React Native Expo app in a monorepo structure that replicates the Kalshi Tracker web app features and design.

---

## Phase 1: Monorepo Setup & Infrastructure

### 1.1 Convert to Turborepo Monorepo Structure

**Current Structure:**
```
news-alerts/
├── src/
├── prisma/
├── package.json
└── ...
```

**Target Structure:**
```
news-alerts/
├── apps/
│   ├── web/                    # Current Next.js app (moved)
│   └── mobile/                 # New Expo app
├── packages/
│   ├── api/                    # Shared tRPC routers
│   ├── db/                     # Prisma schema & client
│   ├── auth/                   # Better Auth config
│   ├── types/                  # Shared TypeScript types
│   └── constants/              # Entity mappings, shared constants
├── turbo.json
├── package.json                # Root workspace config
└── pnpm-workspace.yaml
```

### 1.2 Tasks
- [ ] Install Turborepo: `pnpm add -D turbo`
- [ ] Create `turbo.json` with build/dev/lint pipelines
- [ ] Create `pnpm-workspace.yaml` defining workspace packages
- [ ] Move Next.js app to `apps/web/`
- [ ] Extract shared code to `packages/`
- [ ] Update all import paths
- [ ] Verify web app still works after migration

---

## Phase 2: Shared Packages Extraction

### 2.1 `packages/db` - Database Layer
```
packages/db/
├── prisma/
│   └── schema.prisma
├── src/
│   ├── index.ts               # Prisma client export
│   └── types.ts               # Generated types re-export
├── package.json
└── tsconfig.json
```

**Contents to move:**
- `prisma/schema.prisma`
- `src/server/db.ts` → `packages/db/src/index.ts`

### 2.2 `packages/api` - tRPC Routers
```
packages/api/
├── src/
│   ├── root.ts                # Router aggregation
│   ├── trpc.ts                # tRPC context & middleware
│   └── routers/
│       ├── bet.ts
│       ├── alert.ts
│       ├── kalshi.ts
│       └── user.ts
├── package.json
└── tsconfig.json
```

**Contents to move:**
- `src/server/api/` entire directory

### 2.3 `packages/auth` - Authentication
```
packages/auth/
├── src/
│   ├── config.ts              # Better Auth setup
│   ├── server.ts              # Server utilities
│   └── client.ts              # Client utilities
├── package.json
└── tsconfig.json
```

**Contents to move:**
- `src/server/better-auth/`

### 2.4 `packages/constants` - Shared Constants
```
packages/constants/
├── src/
│   ├── entity-mappings.ts
│   └── index.ts
├── package.json
└── tsconfig.json
```

**Contents to move:**
- `src/server/constants/`

### 2.5 `packages/types` - TypeScript Types
```
packages/types/
├── src/
│   ├── api.ts                 # API response types
│   ├── models.ts              # Domain model types
│   └── index.ts
├── package.json
└── tsconfig.json
```

---

## Phase 3: Expo App Setup

### 3.1 Initialize Expo App
```bash
cd apps
npx create-expo-app mobile --template expo-template-blank-typescript
```

### 3.2 Mobile App Structure
```
apps/mobile/
├── app/                        # Expo Router (file-based routing)
│   ├── _layout.tsx            # Root layout with providers
│   ├── index.tsx              # Entry → redirect to auth/dashboard
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   └── signup.tsx
│   └── (app)/
│       ├── _layout.tsx        # Tab navigator
│       ├── dashboard.tsx      # Bets list
│       ├── alerts.tsx         # Alerts management
│       └── settings.tsx       # User preferences
├── components/
│   ├── BetCard.tsx
│   ├── AlertCard.tsx
│   ├── AddBetModal.tsx
│   ├── EventSearch.tsx
│   └── ui/
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Modal.tsx
│       ├── Badge.tsx
│       └── Card.tsx
├── hooks/
│   ├── useBets.ts
│   ├── useAlerts.ts
│   ├── useAuth.ts
│   └── useKalshi.ts
├── lib/
│   ├── api.ts                 # tRPC client setup
│   ├── auth.ts                # Auth client for mobile
│   └── storage.ts             # Secure storage utilities
├── stores/
│   └── auth.ts                # Zustand auth state
├── constants/
│   └── theme.ts               # Design tokens
├── app.json
├── package.json
├── tsconfig.json
└── babel.config.js
```

### 3.3 Dependencies to Install
```json
{
  "dependencies": {
    "expo": "~52.0.0",
    "expo-router": "~4.0.0",
    "expo-secure-store": "~14.0.0",
    "react-native": "0.76.x",
    "@tanstack/react-query": "^5.0.0",
    "@trpc/client": "^11.0.0",
    "@trpc/react-query": "^11.0.0",
    "zustand": "^5.0.0",
    "nativewind": "^4.0.0",
    "react-native-reanimated": "~3.16.0",
    "react-native-safe-area-context": "~4.12.0",
    "react-native-screens": "~4.1.0"
  }
}
```

---

## Phase 4: Core Features Implementation

### 4.1 Authentication Flow

**Screens:**
1. **Login** - Email input → OTP verification
2. **Signup** - Email input → OTP verification
3. **OTP Verification** - 6-digit input with auto-submit

**Implementation:**
- Use Better Auth client SDK for mobile
- Store session token in Expo SecureStore
- Auto-refresh tokens on app resume
- Biometric auth (future enhancement)

### 4.2 Dashboard (Bets List)

**Features:**
- Display user's tracked bets as cards
- Pull-to-refresh for data sync
- Swipe-to-delete bet
- Tap card to view details/manage alerts
- FAB button to add new bet

**Components:**
- `BetCard` - Event info, category badge, alert status
- `AddBetModal` - Search or enter event ID
- `EventSearch` - Search all open Kalshi events

### 4.3 Alerts Management

**Features:**
- List all user's alert subscriptions
- Toggle pause/resume with switch
- Swipe-to-delete alert
- Status indicators (live/paused/pending/failed)

**Components:**
- `AlertCard` - Alert info with toggle switch
- `AlertStatusBadge` - Color-coded status

### 4.4 Settings

**Features:**
- User profile (email display)
- Sports alerts notification preference
- Sign out button
- App version info

---

## Phase 5: Design System

### 5.1 Theme Tokens
```typescript
// constants/theme.ts
export const colors = {
  brand: '#CDFF00',
  background: '#000000',
  surface: '#111111',
  surfaceHover: '#1a1a1a',
  border: '#333333',
  text: '#FFFFFF',
  textSecondary: '#888888',
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};
```

### 5.2 Component Mapping (Web → Mobile)
| Web Component | Mobile Component |
|---------------|------------------|
| Tailwind classes | NativeWind classes |
| `<button>` | `<Pressable>` with feedback |
| `<input>` | `<TextInput>` |
| `<div>` | `<View>` |
| Framer Motion | React Native Reanimated |
| Modal (DOM) | React Native Modal |

### 5.3 Typography
```typescript
export const typography = {
  h1: { fontSize: 32, fontWeight: '700' },
  h2: { fontSize: 24, fontWeight: '600' },
  h3: { fontSize: 20, fontWeight: '600' },
  body: { fontSize: 16, fontWeight: '400' },
  small: { fontSize: 14, fontWeight: '400' },
  caption: { fontSize: 12, fontWeight: '400' },
};
```

---

## Phase 6: API Integration

### 6.1 tRPC Client Setup
```typescript
// lib/api.ts
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import { type AppRouter } from '@acme/api';
import * as SecureStore from 'expo-secure-store';

const getAuthToken = async () => {
  return SecureStore.getItemAsync('session_token');
};

export const api = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${API_URL}/api/trpc`,
      async headers() {
        const token = await getAuthToken();
        return token ? { Authorization: `Bearer ${token}` } : {};
      },
    }),
  ],
});
```

### 6.2 React Query Integration
```typescript
// lib/query-client.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30,   // 30 minutes
    },
  },
});
```

---

## Phase 7: Push Notifications (Future)

### 7.1 Database Changes
```prisma
model DeviceToken {
  id        String   @id @default(cuid())
  userId    String
  token     String   @unique
  platform  String   // 'ios' | 'android'
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

model User {
  // ... existing fields
  deviceTokens DeviceToken[]
  notifyByPush Boolean @default(true)
  notifyByEmail Boolean @default(true)
}
```

### 7.2 New API Endpoints
```typescript
// packages/api/src/routers/push.ts
export const pushRouter = createTRPCRouter({
  registerDevice: protectedProcedure
    .input(z.object({ token: z.string(), platform: z.enum(['ios', 'android']) }))
    .mutation(/* ... */),

  unregisterDevice: protectedProcedure
    .input(z.object({ token: z.string() }))
    .mutation(/* ... */),
});
```

---

## Implementation Order

### Sprint 1: Infrastructure (1-2 days)
1. Set up Turborepo monorepo structure
2. Move web app to `apps/web/`
3. Extract shared packages
4. Verify web app works

### Sprint 2: Expo App Foundation (2-3 days)
1. Initialize Expo app
2. Set up Expo Router navigation
3. Configure NativeWind
4. Create design system components
5. Set up tRPC client

### Sprint 3: Authentication (1-2 days)
1. Build login/signup screens
2. Implement OTP verification
3. Set up secure token storage
4. Handle auth state persistence

### Sprint 4: Core Features (3-4 days)
1. Dashboard with bet cards
2. Add bet flow (search + manual)
3. Alerts management
4. Settings screen

### Sprint 5: Polish & Testing (2-3 days)
1. Animations and transitions
2. Error handling & loading states
3. Offline support basics
4. Testing on iOS/Android

### Sprint 6: Push Notifications (Future)
1. Expo Push setup
2. Database changes
3. Webhook modification
4. Notification preferences

---

## Key Technical Decisions

### 1. Why Turborepo?
- Industry standard for Next.js + React Native monorepos
- Efficient caching for faster builds
- Clear package boundaries
- Easy to add more apps later

### 2. Why Expo Router?
- File-based routing (matches Next.js mental model)
- Deep linking support out of box
- Simpler than React Navigation setup
- Better developer experience

### 3. Why NativeWind?
- Same Tailwind classes as web app
- Faster UI development
- Consistent design language
- Works with Expo

### 4. Auth Strategy
- Share Better Auth config package
- Mobile uses HTTP-only approach (no cookies)
- Store tokens in SecureStore (encrypted)
- Refresh tokens on app foreground

### 5. API Strategy
- Same tRPC routers, no duplication
- Mobile-specific optimizations if needed
- Consider response size for mobile data

---

## Success Criteria

- [ ] Monorepo builds and deploys correctly
- [ ] Web app unchanged after migration
- [ ] Mobile app authenticates users
- [ ] Mobile app displays user's bets
- [ ] Mobile app manages alerts (add/remove/toggle)
- [ ] Mobile app searches Kalshi events
- [ ] UI matches web design language
- [ ] Works on both iOS and Android

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Monorepo migration breaks web | Incremental migration, thorough testing |
| tRPC version mismatch | Pin versions across packages |
| Auth complexity on mobile | Start with simple email OTP |
| Performance on low-end devices | React Query caching, list virtualization |
| Push notification complexity | Defer to Phase 7, focus on core first |

---

## Questions to Resolve

1. **Package manager**: Stay with npm or switch to pnpm?
2. **Deployment**: EAS Build or custom CI/CD?
3. **Beta testing**: TestFlight/Play Console setup?
4. **Push provider**: Expo Push or OneSignal?
5. **Offline mode**: Priority for v1?
