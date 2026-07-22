# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Spectech is a marketplace + fleet-management platform for Ukraine's
heavy-construction-equipment industry (excavators, cranes, bulldozers, dump
trucks, etc.), built for the reconstruction economy. It connects renters who
need equipment with equipment owners and the operators who run it, replacing
phone-call-and-a-guy-who-knows-a-guy logistics with structured requests, a
manual owner-driven assign flow, an order-scoped chat, an electronic
equipment "passport" + maintenance journal, and daily operator work reports
(text + before/during/after photos + GPS + engine hours) that must be
capturable **offline** and synced later — construction sites routinely have
no connectivity.

**Two product generations coexist in this codebase, deliberately:**
1. **The original vision-deck marketplace** (Phase 1/1.5 of the early
   roadmap): auto-ranked matching engine (geo+price+rating), `Deal`
   lifecycle, single-role users. This is what `apps/web` still runs against
   — `requests/`, `matching/`, `deals/` modules, untouched.
2. **The SoW-driven rental+fleet platform** (current product direction,
   mobile-first per the SoW — web is explicitly out of scope for this
   generation): multi-role accounts, no auto-matching (the owner manually
   reviews a request and assigns their own equipment + operator), an
   order-scoped chat, equipment passport/journal, notifications. This is
   what `apps/mobile` runs against — `orders/`, `chat.controller.ts` (inside
   `orders/`), `notifications/`, the expanded `equipment/`, and the reworked
   `reports/` (now tied to `Order`, not `Deal`).

They were kept side by side rather than migrated in place: `apps/web`'s
contract (single `role`, `Deal`/`EquipmentRequest`/`MatchOffer`) still works
unmodified, while the new modules were added alongside. `UserEntity.roles`
replaced the old singular `role` column, but the JWT payload still carries
`role` (first of `roles`) for `apps/web`'s back-compat alongside the new
`roles` array. If you're asked to reconcile the two (e.g. retire the
matching engine, or port `apps/web` onto the new model), that's a deliberate
product decision to confirm first — don't do it as a drive-by refactor.

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

`packages/shared-types` is the wire contract and gets consumed with
`"@spectech/shared-types": "workspace:*"`. Change a shape here first, then
propagate to the API DTOs and whichever client(s) use it.

- **Legacy marketplace types** (used only by `apps/web`, untouched):
  `RequestStatus`, `DealStatus`, `EquipmentRequest`, `MatchOffer`, `Deal`,
  `ConfirmDealDto`.
- **SoW rental+fleet types** (used only by the rebuilt `apps/mobile`):
  `OrderStatus`, `Order`, `CreateOrderDto`, `AssignOrderDto`,
  `ChatMessage`, `SendChatMessageDto`, `Notification`,
  `JournalEntryKind`, `EquipmentJournalEntry`, `CreateJournalEntryDto`.
- **Shared by both**: `UserRole`, `EquipmentType`, `EquipmentStatus`,
  `User` (now with `roles: UserRole[]`, plus a legacy singular `role`),
  `Equipment` (now carrying the optional "техпаспорт" fields —
  `brand`/`model`/`serialNumber`/`photoUrl`/`engineHours`/`fuelConsumption`/
  `oilStatus`/`mass`/`capacity`/`conditions`/`assignedOperatorIds` — all
  optional because the legacy web create-listing flow never populates them),
  `GeoPoint`, `DomainEvent`.
- **`Report`/`ReportDraft`** were reworked for the SoW report structure
  (`orderId` instead of `dealId`, `text` + `photos: {before,during,after}`
  instead of `photoUrls[]`, `startedAt`/`endedAt`/`durationMin`,
  `problem`/`needsService` flags, a `confirmed` flag distinct from
  `syncStatus`) — this was a breaking change to those two interfaces, safe
  only because reports are exclusively an operator/mobile concern that
  `apps/web` never touched.

**Known contract wrinkle:** several `GeoPoint`-based interfaces nest
coordinates as `location: { lat, lng }` / `gps: { lat, lng }`
(`CreateEquipmentRequestDto`, `ReportDraft`), but the actual NestJS
`class-validator` DTOs (`services/api/src/modules/requests/dto/create-request.dto.ts`,
`.../reports/dto/report-draft.dto.ts`, `.../equipment/dto/create-equipment.dto.ts`)
validate **flat** `lat`/`lng` fields instead, because `class-validator` needs
primitives to decorate directly. `apps/web` and `apps/mobile` bridge this
explicitly at the API-call boundary (see `apps/web/src/api/requests.ts`,
`apps/mobile/src/api/reports.ts`) rather than changing the shared
interfaces — the persisted/local-queue shape stays nested (matches
`Report`/`ReportDraft`), only the wire body is flattened. If you add another
geo-bearing endpoint, follow the same pattern: keep the shared-types
interface nested, add a local flat DTO class in the API module, and flatten
at the call site in each client.

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
  auth/           JWT issuance (register/login), passport-jwt strategy, guards
  users/          user records (multi-role), GET /users/operators roster
  equipment/      listings + PostGIS proximity + passport fields + journal +
                  operator assignment (shared by both product generations)
  requests/       [legacy] customer "заявка" creation — apps/web only
  matching/       [legacy] ranks equipment candidates (geo+price+rating)
  deals/          [legacy] deal lifecycle: confirm → in_progress → … → settled
  orders/         [SoW] rental order lifecycle + nested order-chat controller
  chat/           [SoW] ChatService only, no controller of its own (see below)
  notifications/  [SoW] in-app notification inbox
  reports/        offline-sync batch intake + async ingestion pipeline,
                  reworked to hang off `orders/` (Deal-based version retired)
```

**Legacy request → match → deal flow** (`apps/web` only, unchanged):
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
   distance 0.4 / price 0.3 / rating 0.3), and persists ranked
   `MatchOfferEntity` rows.
3. `GET /requests/:requestId/offers` reads those back, ordered by rank.
4. `POST /deals` (`DealsService.confirmFromOffer`) turns a chosen offer into
   a `Deal`, marks the equipment `BOOKED`, and emits `DEAL_CONFIRMED`. The
   deal's `operatorId` is just the equipment owner's id — no separate
   hired-operator assignment in this generation (that's what `orders/`
   below adds properly).

**SoW order → assign → contract → report flow** (`apps/mobile`, current
product direction, per the SoW's "no auto-matching engine" requirement —
the owner reviews and assigns manually):
1. `POST /orders` (`OrdersService.create`) persists an `Order` at status
   `request`. If the renter targeted a specific machine (from an equipment
   detail screen), `ownerId` is set immediately from that equipment; if they
   just requested "any excavator", `ownerId` stays `null` until an owner
   claims it. `GET /orders/actionable` (an owner's "Потребують дій") returns
   both: open unclaimed requests of any type, plus that owner's own
   request/agreed orders.
2. `POST /orders/:id/assign` (owner) requires the acting user to actually
   own the equipment being assigned and the target user to have the
   `OPERATOR` role; it enforces "equipment can't run two active orders" by
   requiring the equipment to be `AVAILABLE` first. Moves `request` →
   `agreed`, marks equipment `BOOKED`, posts a system chat message, notifies
   both renter and operator.
3. `POST /orders/:id/start-contract` (owner) enforces "an operator can't be
   active on two orders at once" by checking for another order with the same
   `operatorId` at `IN_WORK` before allowing the transition. Moves `agreed`
   → `in_work`, marks equipment `WORKING`.
4. The operator works and files reports via the same offline-sync pipeline
   as before (see below), now keyed to `orderId` instead of `dealId`.
   `POST /reports/:id/confirm` (owner) is what actually finishes the job:
   it calls `OrdersService.completeFromReport`, moving `in_work` → `done`
   and freeing the equipment back to `AVAILABLE` — there's no separate
   "complete order" endpoint, confirming the report *is* closing it.
5. **Chat** (`orders/chat.controller.ts`) is deliberately declared inside
   `OrdersModule` rather than `ChatModule`, even though `ChatService` lives
   in `ChatModule` — this lets it use `OrdersService` for access checks
   (renter/owner always; the operator only once the order reaches
   `IN_WORK`/`DONE`) without `ChatModule` needing to depend on `OrdersModule`
   at all, keeping that module boundary one-directional.
6. **Notifications** (`NotificationsService.notify`) are fired inline by
   `OrdersService`/`ReportsIngestionProcessor` at each lifecycle step
   (assigned, started, new report, done) — a simple in-app inbox
   (`GET /notifications`, `POST /notifications/read-all`), no push delivery
   yet.

**Offline-first report ingestion** (shared shape, reworked for `orders/`):
mirrors the architecture deck's "sensor → ingestion → processing → action"
pipeline:
1. `POST /reports/sync` (`ReportsSyncService.syncBatch`) is the batch intake
   the mobile app's local queue drains into. It's **idempotent per
   `clientReportId`** (a client-generated UUID): replaying an
   already-*confirmed* report's id is a no-op; resubmitting an
   *unconfirmed* one's id is treated as an **edit** (SoW: "оператор
   редагує до підтвердження") and updates the row in place — this is also
   how the mobile app implements "edit my last report," with no separate
   edit endpoint. Valid drafts are persisted with `syncStatus: QUEUED` and
   pushed onto a BullMQ queue (`REPORT_INGESTION_QUEUE`); the HTTP response
   doesn't wait for ingestion to finish.
2. `ReportsIngestionProcessor` (BullMQ worker) picks the job up
   asynchronously, validates the report against its claimed order (operator
   must match, order must be `IN_WORK`/`DONE`), flips `syncStatus` to
   `SYNCED` or `REJECTED`, and on success notifies the equipment owner and
   emits `ORDER_REPORT_SUBMITTED`. It does **not** advance the order's
   status — the operator's explicit start/stop-work actions and the owner's
   report confirmation already own those transitions (see above).

**Data layer:** TypeORM entities map directly to the tables in the one
hand-written migration (`1700000000000-InitSchema.ts` — no
`synchronize: true`, no autogenerated migrations yet, since it has never
been applied to a live database in this environment and was rewritten in
place rather than layered with a second migration). Geo columns are
`geography(Point,4326)`; `geoPointTransformer`
(`common/geo/geo-point.transformer.ts`) converts between the app-facing
`{ lat, lng }` shape and the GeoJSON TypeORM reads/writes — reuse it for any
new geo column instead of hand-rolling another conversion.

**Auth/authorization:** JWT (`@nestjs/jwt` + `passport-jwt`). Accounts can
hold multiple roles at once (SoW: "підтримка кількох ролей в одному
акаунті"), so `UserEntity.roles` is an array column and the JWT payload is
`{ sub: userId, role, roles }` — `role` is just `roles[0]`, kept only so
`apps/web`'s single-role assumption keeps working unmodified. `RolesGuard`
checks for *any* overlap between a route's `@Roles(...)` and the caller's
`roles`, not an exact match. There's no refresh-token flow; tokens just
expire (`JWT_EXPIRES_IN`, default 7d).

## Frontend architecture

**apps/web** (React + Vite + react-router-dom) — the **legacy marketplace
generation**, runs against `requests/`/`matching/`/`deals/` only, untouched
since it was built: role-gated routes via
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
