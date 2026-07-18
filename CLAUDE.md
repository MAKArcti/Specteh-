# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Spectech is a marketplace platform for Ukraine's heavy-construction-equipment
industry (excavators, cranes, bulldozers, dump trucks, etc.), built for the
reconstruction economy. It connects customers who need equipment with
equipment owners/operators, replacing phone-call-and-a-guy-who-knows-a-guy
logistics with: geo/price/rating-ranked matching, escrow-style deal
confirmation, and daily operator work reports (photo + GPS + work volume)
that must be capturable **offline** and synced later — construction sites
routinely have no connectivity.

Product roadmap (source of truth for what's in scope right now):
1. **Phase 1 — Marketplace** (built): requests → matching → deal confirmation.
2. **Phase 1.5 — SaaS wedge** (built): fleet reports with photo/GPS, offline-first sync.
3. **Phase 2 — Financial layer** (not built): escrow, leasing, insurance.
4. **Phase 3 — Scale** (not built): new regions/verticals, data-as-a-product.

Guiding principles from the product vision — keep these in mind when making
architectural decisions, not just when writing code:
- Works simply first; optimize later, not the other way around.
- Data is the source of truth; the UI is just a window into it.
- Offline-first wherever it's the user's actual reality (report submission),
  not treated as an edge case.
- The architecture should absorb 10x growth, but isn't built for a 100x
  that doesn't exist yet — don't over-engineer ahead of real scale.

## Repo structure (pnpm + turborepo monorepo)

```
apps/web        @spectech/web      React + Vite customer/equipment-owner web app
apps/mobile     @spectech/mobile   Expo/React Native operator app (offline report queue)
services/api    @spectech/api      NestJS backend — modular monolith
packages/shared-types              @spectech/shared-types — DTOs/enums shared by all three
infra/          docker-compose.yml — Postgres+PostGIS and Redis for local dev
```

`packages/shared-types` is the wire contract: enums (`UserRole`,
`EquipmentType`, `EquipmentStatus`, `RequestStatus`, `DealStatus`,
`ReportSyncStatus`, `WorkVolumeUnit`, `DomainEvent`) and interfaces (`User`,
`Equipment`, `EquipmentRequest`, `MatchOffer`, `Deal`, `Report`,
`ReportDraft`, `GeoPoint`, etc.) live here and get consumed with
`"@spectech/shared-types": "workspace:*"`. Change a shape here first, then
propagate to the API DTOs and both clients.

**Known contract wrinkle:** the shared `GeoPoint`-based interfaces
(`CreateEquipmentRequestDto`, `ReportDraft`) nest coordinates as
`location: { lat, lng }` / `gps: { lat, lng }`, but the actual NestJS
`class-validator` DTOs (`services/api/src/modules/requests/dto/create-request.dto.ts`,
`.../reports/dto/report-draft.dto.ts`) validate **flat** `lat`/`lng` fields
instead, because `class-validator` needs primitives to decorate directly.
Both `apps/web` and `apps/mobile` bridge this explicitly at the API-call
boundary (see `apps/web/src/api/requests.ts`, `apps/mobile/src/api/reports.ts`)
rather than changing the shared interfaces — the persisted/local-queue shape
stays nested (matches `Report`/`ReportDraft`), only the wire body is flattened.
If you add another geo-bearing endpoint, follow the same pattern: keep the
shared-types interface nested, add a local flat DTO class in the API module,
and flatten at the call site in each client.

## Commands

Run everything from the repo root through turbo (it resolves per-package
scripts and handles the `shared-types` build dependency automatically):

```
pnpm install              # installs & links all workspace packages
pnpm run build            # turbo run build   (all packages)
pnpm run lint              # turbo run lint
pnpm run typecheck        # turbo run typecheck
pnpm run test              # turbo run test (currently only services/api has tests)
pnpm run format            # prettier --write across the repo
pnpm run db:up             # docker compose -f infra/docker-compose.yml up -d  (Postgres+PostGIS, Redis)
pnpm run db:down           # stop the above
```

Scope a command to one package with turbo's filter, e.g.:
```
pnpm exec turbo run test --filter=@spectech/api
pnpm exec turbo run typecheck --filter=@spectech/web
```

Or run a single package's script directly (each package.json has the same
`dev`/`lint`/`typecheck`/`build` script names):
```
cd services/api && pnpm test                 # jest — full suite
cd services/api && npx jest matching.scoring  # a single test file by name pattern
cd apps/web && pnpm dev                       # vite dev server
cd apps/mobile && pnpm dev                    # expo start
```

`packages/shared-types` must be built (`pnpm exec turbo run build --filter=@spectech/shared-types`)
before its `dist/` output is importable by the other packages — turbo's
`dependsOn: ["^build"]` on every other task handles this automatically, but
if you edit a shared type and only run e.g. `cd services/api && pnpm typecheck`
directly (bypassing turbo), rebuild shared-types first or you'll typecheck
against stale `.d.ts` files.

### Local backend database

`services/api` expects Postgres with the PostGIS extension and Redis
(BullMQ). `pnpm run db:up` starts both via `infra/docker-compose.yml`
(default creds: `spectech`/`spectech`/db `spectech`, standard ports).
Migrations are hand-written SQL (not autogenerated) in
`services/api/src/database/migrations/` — run them with:
```
cd services/api && pnpm migration:run
```
`services/api/src/database/data-source.ts` is a standalone `DataSource` used
only by the TypeORM CLI (`migration:generate`/`run`/`revert`); the running
app itself gets its connection through `DatabaseModule`'s `forRootAsync`.
Keep the entity list (`entities` export in `database.module.ts`) in sync
between the two manually — the CLI can't consume a Nest module.

Note: this sandbox's network policy blocks Docker Hub/registry pulls, so the
backend has been verified here via `tsc --noEmit`, `eslint`, `nest build`,
and `jest` unit tests, but not against a live Postgres/Redis instance or a
real end-to-end HTTP round-trip. If you're iterating on the API in an
environment with unrestricted network access, actually run `db:up` +
`migration:run` + `pnpm dev` and hit it before trusting a change.

## Backend architecture (services/api)

A **modular monolith**, deliberately — not a microservices split — per the
"works simply first" principle. Module boundaries are drawn so any of them
could later be extracted into a standalone service without a rewrite, which
is why cross-module communication goes through an internal event bus
(`@nestjs/event-emitter`, events defined in `DomainEvent`) rather than
modules calling each other's internals directly wherever that seam matters:

```
modules/
  auth/        JWT issuance (register/login), passport-jwt strategy, guards
  users/       user records (role, rating)
  equipment/   equipment listings + PostGIS proximity queries
  requests/    customer "заявка" (equipment request) creation
  matching/    ranks equipment candidates for a request (geo+price+rating)
  deals/       deal lifecycle: confirm → in_progress → completed → settled
  reports/     offline-sync batch intake + async ingestion pipeline
```

**Request → match → deal flow:**
1. `POST /requests` (`RequestsService.create`) persists the request, then
   `await eventEmitter.emitAsync(DomainEvent.REQUEST_CREATED, ...)`.
   Using `emitAsync` (not `emit`) is deliberate: it's awaited, so matching
   has synchronously finished computing offers by the time the HTTP response
   goes out, without `RequestsModule` importing `MatchingService` directly.
2. `MatchingListener` (in `MatchingModule`) reacts to that event and calls
   `MatchingService.computeForRequest`, which pulls available equipment
   within the request's radius via `EquipmentService.findAvailableCandidates`
   (a PostGIS `ST_DWithin`/`ST_Distance` query), scores them with the pure,
   unit-tested function `matching.scoring.ts::scoreCandidates` (weighted:
   distance 0.4 / price 0.3 / rating 0.3 — availability is a pre-filter, not
   a scoring term, since candidates are already filtered to `AVAILABLE`),
   and persists ranked `MatchOfferEntity` rows.
3. `GET /requests/:requestId/offers` reads those back, ordered by rank.
4. `POST /deals` (`DealsService.confirmFromOffer`) turns a chosen offer into
   a `Deal`, marks the equipment `BOOKED`, and emits `DEAL_CONFIRMED`.
   **MVP simplification:** the deal's `operatorId` is set to the equipment
   owner's id — there's no separate "assign a hired operator to this
   machine" flow yet. If that becomes a real feature, it changes
   `DealsService.confirmFromOffer` and probably needs its own module.

**Offline-first report ingestion (the other core flow):** mirrors the
architecture deck's "sensor → ingestion → processing → action" pipeline:
1. `POST /reports/sync` (`ReportsSyncService.syncBatch`) is the batch intake
   the mobile app's local queue drains into. It's **idempotent per
   `clientReportId`** (a client-generated UUID) — replaying an
   already-synced batch after an unclear ack is a no-op, not a duplicate.
   Valid new drafts are persisted with `syncStatus: QUEUED` and pushed onto
   a BullMQ queue (`REPORT_INGESTION_QUEUE`); the HTTP response doesn't wait
   for ingestion to finish.
2. `ReportsIngestionProcessor` (BullMQ worker) picks the job up
   asynchronously, validates the report against its claimed deal (operator
   must match), flips `syncStatus` to `SYNCED` or `REJECTED`, and — on
   success — calls `DealsService.advanceStatus(dealId, IN_PROGRESS)` and
   emits `REPORT_INGESTED`. A deal reaching `COMPLETED` this way in turn
   emits `DEAL_SETTLEMENT_TRIGGERED`, the seam where Phase 2's actual escrow
   payout would hook in (not implemented yet — there's no financial layer).

**Data layer:** TypeORM entities map directly to the tables in the one
hand-written migration (`1700000000000-InitSchema.ts` — no
`synchronize: true`, no autogenerated migrations yet, since there's only
ever been one schema revision). Geo columns are `geography(Point,4326)`;
`geoPointTransformer` (`common/geo/geo-point.transformer.ts`) converts
between the app-facing `{ lat, lng }` shape and the GeoJSON TypeORM
reads/writes — reuse it for any new geo column instead of hand-rolling
another conversion.

**Auth/authorization:** JWT (`@nestjs/jwt` + `passport-jwt`), payload is
`{ sub: userId, role }`. Route-level access control is
`@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(UserRole.X)` — see any
controller for the pattern. There's no refresh-token flow; tokens just
expire (`JWT_EXPIRES_IN`, default 7d).

## Frontend architecture

**apps/web** (React + Vite + react-router-dom): role-gated routes via
`RequireAuth` (wraps `<Outlet />`, optionally restricted to specific
`UserRole`s — see `App.tsx` for the route tree). Auth state lives in
`AuthContext`, JWT in `localStorage`. There is currently no equipment
list/GET endpoint on the backend, so the web app never fetches equipment
directly by design — owners only create listings; discovery happens
implicitly through the matching engine when a customer creates a request.
Core flow: register/login → (owner) add equipment / (customer) create
request → ranked offers → confirm deal → deal detail.

**apps/mobile** (Expo + React Native + TypeScript, plain `App.tsx` +
`@react-navigation/native-stack`, no expo-router): operator-only — no
registration screen, operators are assumed pre-provisioned. The offline
report queue is the load-bearing piece:
- `src/storage/reportQueue.ts` persists pending `ReportDraft`s to
  `AsyncStorage` under `spectech.report_queue` — not in-memory state, so a
  submitted report survives an app kill before it ever reaches the network.
- Submitting a report (`ReportSubmissionScreen`) enqueues locally first,
  with zero network dependency, using `capturedAt` set to the device clock
  at submission time (which can be hours/days before the eventual sync).
  A best-effort background sync is *then* attempted opportunistically.
- `PendingReportsScreen` lists the queue and has a manual "Sync now" button
  (`useReportQueue`) — don't rely on connectivity auto-detection
  (`useAutoSyncOnReconnect`, via NetInfo) alone; the operator must always be
  able to force a retry.
- Reconciliation after a sync call: accepted `clientReportId`s are removed
  from the queue; rejected ones are kept and annotated with the server's
  `rejectionReason` so the operator can see and retry/edit them.
- No real media upload pipeline yet — `photoUrls` stores local `file://`
  URIs from `expo-image-picker` as placeholders.

Both `apps/web` and `apps/mobile` have their own `.eslintrc.json`:
`apps/web`'s extends the root config (browser env + JSX parserOptions
layered on); `apps/mobile`'s is standalone (`"root": true`) because
React Native needs different plugins (`react`, `react-hooks`,
`react-native`) that don't apply to the rest of the repo.

## Conventions

- TypeScript strict mode everywhere (`tsconfig.base.json`), with one
  deliberate carve-out: `services/api/tsconfig.json` sets
  `strictPropertyInitialization: false`, because TypeORM entities and
  `class-validator` DTOs are populated by the ORM/validation pipeline after
  construction, not in a constructor — this matches Nest's own default
  tsconfig, not a relaxation of rigor elsewhere.
- Domain enums and cross-service DTOs belong in `packages/shared-types`,
  not duplicated per-app — if you need a shape in more than one package, put
  it there first.
- Business logic that needs to be unit-tested without a database is pulled
  into pure functions (e.g. `matching.scoring.ts`) rather than left inline
  in a service method that also does I/O.
- Cross-module side effects in the API go through `DomainEvent` +
  `EventEmitter2`, not direct service-to-service calls, wherever the
  interaction represents a bounded-context seam (request→matching,
  report-ingestion→deal-status). Direct injection is still normal and fine
  for straightforward data reads within one flow (e.g. `DealsService`
  injecting `MatchingService`/`EquipmentService`/`RequestsService` to look
  things up when confirming a deal).
