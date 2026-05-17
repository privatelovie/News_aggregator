# News App

Production-ready scaffold for an AI-powered news aggregator built with Next.js 15, TypeScript, Tailwind, Prisma, PostgreSQL, NextAuth, and Zustand.

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy environment variables:

   ```bash
   cp .env.example .env
   ```

3. Update `DATABASE_URL` and generate Prisma client:

   ```bash
   npm run prisma:generate
   ```

4. Start development:

   ```bash
   npm run dev
   ```

## Structure

- `src/app` - App Router pages, route groups, and API routes
- `src/components` - Shared UI and layout components
- `src/features` - Feature-specific modules
- `src/lib` - Server utilities, Prisma, auth, and shared helpers
- `src/store` - Zustand stores
- `src/types` - Shared TypeScript types
- `prisma` - Database schema

Features are intentionally scaffolded but not implemented yet.
