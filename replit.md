# Voyager - AI Travel Curator

## Overview

Voyager is an AI-powered vacation planning and travel curation web application. It serves as an intelligent travel companion for before, during, and after trips. The app replaces traditional Excel-based trip planning with a rich interactive experience including itinerary planning, smart packing lists, travel intelligence, past trip tracking with map visualization, community features, and AI-powered assistance via Anthropic's Claude.

The project follows a monorepo structure with a React frontend (Vite), Express backend, PostgreSQL database (via Drizzle ORM), and Replit Auth for authentication.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Directory Structure
- `client/` — React frontend (Vite, TypeScript)
- `server/` — Express backend (TypeScript)
- `shared/` — Shared types, schemas, and database models used by both client and server
- `migrations/` — Drizzle-generated database migration files
- `attached_assets/` — Reference documents (original project prompt/spec)
- `script/` — Build scripts

### Frontend Architecture
- **Framework**: React with TypeScript, bundled by Vite
- **Routing**: Wouter (lightweight client-side router)
- **State Management**: React Context (UserContext for settings, TripContext for trip data) + TanStack React Query for server state
- **UI Components**: shadcn/ui (New York style) built on Radix UI primitives with Tailwind CSS
- **Styling**: Tailwind CSS v4 with CSS variables for theming, custom earthy/editorial design palette, DM Sans + Playfair Display fonts
- **Maps**: Leaflet via react-leaflet for world map visualization
- **Key Pages**: 
  - Landing page (public, unauthenticated)
  - Dashboard (authenticated home)
  - Trip Planner at `/planner/:id` (AI-generated itinerary builder with interactive map, per-journey)
  - Smart Pack (standalone AI-powered packing list generator)
  - Travel Intel (cultural/safety info, accessible from journey details)
  - Journeys (trip management)
  - Past Journeys (trip history with file upload and map)
  - Explore (discover destinations)
  - Community (social features)
- **Auth Flow**: Protected routes redirect to `/api/login` for Replit Auth. The `useAuth` hook manages auth state via `/api/auth/user` endpoint.

### Backend Architecture
- **Framework**: Express.js with TypeScript, run via tsx in development
- **API Pattern**: RESTful JSON API under `/api/` prefix
- **Authentication**: Replit Auth (OpenID Connect) with Passport.js, session-based with `connect-pg-simple` session store
- **AI Integration**: Anthropic Claude SDK for AI-powered features (trip parsing, recommendations). Uses environment variables `AI_INTEGRATIONS_ANTHROPIC_API_KEY` and `AI_INTEGRATIONS_ANTHROPIC_BASE_URL`.
- **Replit Integrations** (in `server/replit_integrations/`):
  - `auth/` — Replit OIDC auth setup, session management, user upsert
  - `chat/` — Conversation/message CRUD with Anthropic streaming
  - `batch/` — Batch processing utilities with rate limiting and retries for Anthropic API calls
- **Build**: esbuild for server bundling (CJS output), Vite for client. Production serves static files from `dist/public/`.

### Database
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Connection**: `node-postgres` (pg) Pool via `DATABASE_URL` environment variable
- **Schema** (in `shared/`):
  - `users` — User profiles with preferences, social accounts, and publish blog toggle (required for Replit Auth)
  - `sessions` — Session storage (required for Replit Auth)
  - `journeys` — Trip/journey records with JSONB fields for seasonality, price alerts, logistics, itinerary
  - `bookmarks` — User-saved community feed articles
  - `past_trips` — Historical trip records with lat/lng coordinates
  - `conversations` — Chat conversation records
  - `messages` — Chat messages linked to conversations
- **Migrations**: Use `drizzle-kit push` (`npm run db:push`) to sync schema to database. Config in `drizzle.config.ts`.

### Key Design Decisions

1. **Shared schema between client and server**: The `shared/` directory contains Drizzle table definitions and Zod validation schemas (via `drizzle-zod`), ensuring type safety across the full stack.

2. **Replit Auth instead of custom auth**: Uses Replit's OpenID Connect flow for authentication, reducing complexity. The sessions and users tables are mandatory and should not be dropped.

3. **JSONB columns for flexible data**: Journey records use JSONB for seasonality, price alerts, and logistics data, allowing flexible schema evolution without migrations.

4. **AI-generated itineraries**: Trip Planner uses Claude 3.5 Sonnet to generate structured day-by-day itineraries with real place coordinates, stored as JSONB in the journeys table. The `mock-data.ts` file is legacy and no longer used by TripPlanner.

5. **Context + React Query hybrid**: React Context handles local UI state (temperature units, etc.) while React Query manages server-synchronized data with caching.

## External Dependencies

### Required Environment Variables
- `DATABASE_URL` — PostgreSQL connection string (required, database must be provisioned)
- `AI_INTEGRATIONS_ANTHROPIC_API_KEY` — Anthropic API key for Claude AI features
- `AI_INTEGRATIONS_ANTHROPIC_BASE_URL` — Anthropic API base URL
- `SESSION_SECRET` — Secret for Express session encryption
- `ISSUER_URL` — OIDC issuer URL (defaults to `https://replit.com/oidc`)
- `REPL_ID` — Replit environment identifier (auto-set by Replit)

### Third-Party Services
- **Anthropic Claude** — AI-powered trip planning, content parsing, chat functionality
- **Replit Auth** — User authentication via OpenID Connect
- **PostgreSQL** — Primary data store (provisioned via Replit)
- **CartoDB Tile Server** — Map tiles for Leaflet (`basemaps.cartocdn.com`)
- **Google Fonts** — DM Sans and Playfair Display typefaces

### Key npm Packages
- `drizzle-orm` + `drizzle-kit` — Database ORM and migration tooling
- `@anthropic-ai/sdk` — Anthropic Claude API client
- `express` + `express-session` — HTTP server and session management
- `passport` + `openid-client` — Authentication
- `react-leaflet` + `leaflet` — Interactive maps
- `@tanstack/react-query` — Server state management
- `wouter` — Client-side routing
- `shadcn/ui` components (Radix UI + Tailwind CSS)
- `zod` — Runtime validation
- `xlsx` + `papaparse` — Spreadsheet/CSV parsing for file uploads