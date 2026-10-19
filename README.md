# Ticketing System

A high-concurrency, distributed-ready ticketing and seat reservation platform built with **NestJS**, **Drizzle ORM**, **PostgreSQL**, and **Redis**.

The core focus of this system is **backend correctness under heavy load**: preventing double-booking, handling traffic spikes during high-demand on-sale drops, managing short-lived seat holds, and providing an auditable, idempotent payment and ticketing pipeline.

---

## 🏗️ Architecture Overview

The system is structured as a **modular monolith** with a **functional TypeScript core** and a thin imperative I/O shell.

```text
ticketing-system/
├── apps/
│   └── api/                # NestJS application (Modular Monolith, REST /api/v1)
│       └── (future) web/   # Next.js customer and organizer frontend
│       └── (future) worker/# Background job consumer (hold sweeper, outbox processor)
├── packages/
│   ├── database/           # Drizzle ORM schema, migrations, connection pool, seed scripts
│   └── common/             # Pure functional core (Result/Either monad, DomainErrors, Zod schemas)
├── docker/
│   └── docker-compose.yml  # Local Postgres 16 Alpine and Redis 7 Alpine
├── notes/
│   ├── plan.MD             # Project design, phases, ERD, and API specification
│   └── adr/                # Architecture Decision Records (strategy comparisons)
```

### Key Design Principles

1. **Pure Functional Core:** Domain logic relies on immutable data and the `Result<T, E>` monad ([`packages/common`](./packages/common)), eliminating unexpected mutations and runtime exception bubbling.
2. **Thin Imperative Shell:** Controllers, HTTP filters, and repository adapters handle I/O, translating domain `Err<DomainError>` into standard RFC-compatible HTTP responses.
3. **Database-Enforced Invariants:** Correctness does not rely solely on application locks; constraints and partial unique indexes in PostgreSQL provide absolute protection against race conditions.
4. **Strict Monorepo Isolation:** Managed via `pnpm` with strict dependency isolation. Shared packages are built with `tsdown` (powered by Rolldown) into dual CJS/ESM outputs with declaration maps, ensuring seamless interop with NestJS's CommonJS runtime.

---

## 🛡️ Core Concurrency & Integrity Invariants

- **Zero Double-Selling Invariant:** Enforced at the database level by a partial unique index:
  ```sql
  CREATE UNIQUE INDEX tickets_active_event_seat_unique_idx
  ON tickets (event_seat_id)
  WHERE status IN ('valid', 'used');
  ```
- **Seat Hold Lifecycles:** Seats are temporarily held for ~10 minutes. Holds use lazy evaluation (a hold is considered expired immediately when `hold_expires_at < now()`, evaluated in the locking query) alongside an asynchronous background sweeper.
- **Optimistic & Pessimistic Locking:** `event_seats` records include a `version` column for optimistic concurrency control, while pessimistic row-locking (`SELECT ... FOR UPDATE SKIP LOCKED`) is utilized for high-contention bursts.
- **Idempotent Operations:** Orders and payments enforce unique client-supplied `Idempotency-Key` headers and external payment reference IDs.

---

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| **Runtime & Language** | Node.js (v20+), TypeScript (strict mode) |
| **Backend Framework** | NestJS 10 (Express platform) |
| **Database & ORM** | PostgreSQL 16, Drizzle ORM (`postgres-js` driver) |
| **Cache & Coordination** | Redis 7 (holds, distributed locks, pub/sub) |
| **Validation** | Zod (shared schemas between API and future web client) |
| **Build & Tooling** | `pnpm` (pinned via Corepack), `tsdown` (Rolldown), Docker Compose |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: `v22.0.0` or higher (LTS)
- **Corepack**: enabled (`corepack enable`)
- **pnpm**: `v9.12.0` (automatically managed by Corepack)
- **Docker & Docker Compose**

### 1. Clone & Install Dependencies

```bash
# Clone the repository
git clone <repo-url>
cd ticketing-system

# Install workspace dependencies
pnpm install
```

### 2. Start Infrastructure Containers

Start PostgreSQL and Redis in the background:

```bash
docker compose -f docker/docker-compose.yml up -d
```

### 3. Setup Environment Variables

Copy the example environment configuration:

```bash
cp .env.example .env
```

Default local credentials:
- PostgreSQL: `postgres://postgres:postgres@localhost:5432/ticketing`
- Redis: `redis://localhost:6379`

### 4. Run Database Migrations

Generate and apply the initial schema to PostgreSQL:

```bash
pnpm db:migrate
```

### 5. Build Workspace Packages

Compile the shared packages (`@ticketing/common` and `@ticketing/database`):

```bash
pnpm build
```

### 6. Start the API Server

```bash
# Start the NestJS API in development watch mode
pnpm dev:api
```

The API will listen on `http://localhost:3000` with the global prefix `/api/v1`.

### 7. Verify Health Probe

```bash
curl http://localhost:3000/api/v1/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-10-18T...",
  "services": {
    "database": "up",
    "redis": "up"
  }
}
```

---

## 📜 Available Scripts

| Command | Description |
|---|---|
| `pnpm build` | Builds all packages (`tsdown`) and the NestJS application (`nest build`) |
| `pnpm build:packages` | Compiles only shared packages (`tsdown`) |
| `pnpm dev:api` | Starts the NestJS API with hot reload (`nest start --watch`) |
| `pnpm dev:packages` | Runs `tsdown --watch` across all shared packages in parallel |
| `pnpm typecheck` | Builds packages then runs `tsc --noEmit` across all workspace projects |
| `pnpm db:generate` | Generates SQL migrations from Drizzle schema definitions |
| `pnpm db:migrate` | Executes pending migrations against PostgreSQL |
| `pnpm db:studio` | Launches Drizzle Studio GUI for visual database inspection |

---

## 🗺️ Project Roadmap & Status

- [x] **Phase 0:** Scope, Requirements, ERD, and Data Model Design
- [x] **Phase 1:** Foundation (Monorepo, Docker Compose, NestJS skeleton, Drizzle setup, Result model, Health probe) &rarr; [ADR 0001](./notes/adr/0001-foundation-and-architecture.md)
- [ ] **Phase 2:** Auth & Users (JWT access/refresh tokens, password hashing, RBAC, Zod validation)
- [ ] **Phase 3:** Catalog & Search (Venues, events, Postgres full-text search)
- [ ] **Phase 4:** Seat Reservation & Locking Benchmarks (Optimistic vs. Pessimistic vs. Redis locks)
- [ ] **Phase 5:** Orders, Payments & Outbox Pattern (Stripe test mode, BullMQ worker, idempotency)
- [ ] **Phase 6:** Ticket Issuance & QR Verification (Signed payload, single-use gate validation)
- [ ] **Phase 7:** Real-Time Seat Map (Server-Sent Events / WebSockets + Redis Pub/Sub)
- [ ] **Phase 8:** Traffic Spike Protection & Waiting Room (Queue admission, rate limiting, k6 load tests)
- [ ] **Phase 9:** Security Hardening & Audit Logs
- [ ] **Phase 10:** Next.js Frontend (Interactive seat map, hold timer, checkout)
- [ ] **Phase 11:** Observability & Portfolio Documentation

