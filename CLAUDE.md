# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

@AGENTS.md

## Commands

```bash
npm run dev        # Start local dev server
npm run build      # Production build
npm run start      # Start production server after build
npm run lint       # ESLint
npm run seed       # Seed Source records
npm run crawl      # Run all enabled crawlers once
npm run scheduler  # Run local scheduled crawler loop
```

## Architecture

This is a global hot-topics aggregation dashboard built with Next.js App Router.

### Stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- shadcn/ui with Base UI primitives
- Prisma
- Recharts
- RSS, API, and HTML crawlers

### Main Areas

- `src/app/(dashboard)/`: dashboard routes
- `src/components/`: UI, layout, dashboard, and hot-item components
- `src/lib/crawlers/`: RSS/API/HTML/source-specific crawlers
- `src/lib/classifier/`: rule-based classification
- `src/lib/crawl-pipeline.ts`: crawl, normalize, classify, dedupe, and persist pipeline
- `prisma/schema.prisma`: data model
- `prisma/seed.ts`: source seed data
- `scripts/`: manual crawl and scheduler entrypoints

### Data Handling

Do not commit local runtime data, environment files, build output, or dependencies.
The repository intentionally ignores local database files, environment files, `.next`,
and `node_modules`.

For production deployment, use a managed PostgreSQL database and configure the
database connection through deployment environment variables.
