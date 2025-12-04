# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Kalshi Tracker - A Next.js application that helps users track their Kalshi prediction market bets with real-time news alerts. Built with the T3 Stack.

## Commands

```bash
npm run dev          # Start dev server on port 4000 (Turbopack)
npm run build        # Production build
npm run start        # Start production server on port 4000
npm run check        # Run lint + typecheck
npm run lint         # ESLint only
npm run typecheck    # TypeScript check only

# Database
npm run db:push      # Push schema changes to database
npm run db:generate  # Generate Prisma client after schema changes
npm run db:studio    # Open Prisma Studio GUI
npm run db:migrate   # Deploy migrations
```

## Architecture

### Stack
- **Next.js 15** with App Router and Turbopack
- **tRPC** for type-safe API routes
- **Prisma** with PostgreSQL (client generated to `generated/prisma/`)
- **Better Auth** for authentication (email/password)
- **Tailwind CSS v4** for styling
- **React Query** via tRPC integration

### Key Directories
- `src/app/` - Next.js App Router pages and components
- `src/app/_components/` - Page-specific React components
- `src/server/api/routers/` - tRPC routers (add new routers here, register in `root.ts`)
- `src/server/better-auth/` - Auth configuration and helpers
- `src/trpc/` - tRPC client setup (react.tsx for client, server.ts for RSC)
- `prisma/schema.prisma` - Database schema

### Data Flow
1. Client components use `api` from `~/trpc/react` for queries/mutations
2. Server components use `api` from `~/trpc/server` for direct calls
3. All tRPC routers are registered in `src/server/api/root.ts`
4. Auth session accessed via `getSession()` from `~/server/better-auth/server`

### Environment Variables
Required in `.env`:
- `DATABASE_URL` - PostgreSQL connection string
- `BETTER_AUTH_SECRET` - Auth secret (required in production)

## Conventions
- Use `~/*` path alias for imports from `src/`
- tRPC procedures go in `src/server/api/routers/`, export and add to `appRouter`
- Landing page components are in `src/app/_components/`
