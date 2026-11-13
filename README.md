# Work Order System

A simplified Work Order application with three roles (Admin, SPV, Mechanic) that follows the workflow from the technical test: create → submit → assign mechanic → update → (optional) sparepart request & approval → working → completed.

## Tech stack

| Layer      | Technology                                                                 |
| ---------- | -------------------------------------------------------------------------- |
| Backend    | NestJS 11 (TypeScript), TypeORM, class-validator                           |
| Frontend   | React 19, Vite, TypeScript, MUI 7 (based on the Minimal Material Kit template) |
| Database   | PostgreSQL 16                                                              |
| Deployment | Docker & Docker Compose (nginx serves the built frontend)                  |

## How to run

Requirements: Docker (Docker Desktop on Windows/Mac). Nothing else needs to be installed.

```bash
docker compose up --build
```

The first build takes a few minutes (npm install for backend and frontend). When it is done:

| What     | URL                                  |
| -------- | ------------------------------------ |
| Frontend | http://localhost:8080                |
| Backend  | http://localhost:3000/api            |
| Example  | http://localhost:3000/api/users      |

Four demo users are seeded automatically on the first start (1 Admin, 1 SPV, 2 Mechanics).

To stop: `Ctrl+C`, or `docker compose down`.
To reset all data and re-seed: `docker compose down -v`.

### Trying the workflow

Use the **"Acting as"** selector in the header to switch user/role, then:

1. **Admin** → *New Work Order* → open it → *Submit*
2. **SPV** → open it → *Assign Mechanic*
3. **Admin** → *Update Work Order*
4. Need sparepart?
   - **No** → skip to step 6.
   - **Yes** → **Admin** → *Request Sparepart* (one or more items), then **SPV** → *Approve Sparepart*
5. (sparepart path continues) the work order becomes *Sparepart Approved*
6. The **assigned Mechanic** → *Mark as Working*
7. **Admin** → *Complete Work Order* (enter end date)

## Workflow, statuses and permissions

Statuses were simplified as allowed by the test:

```
DRAFT → SUBMITTED → ASSIGNED → UPDATED ─┬────────────────────────────→ WORKING → COMPLETED
                                        └→ WAITING_SPAREPART → SPAREPART_APPROVED ─┘
```

| Action                 | Role                | Allowed from status                      | Result status        |
| ---------------------- | ------------------- | ---------------------------------------- | -------------------- |
| Create                 | Admin               | –                                        | `DRAFT`              |
| Submit                 | Admin               | `DRAFT`                                  | `SUBMITTED`          |
| Assign mechanic        | SPV                 | `SUBMITTED`                              | `ASSIGNED`           |
| Update (lanjutan)      | Admin               | `ASSIGNED`                               | `UPDATED`            |
| Request sparepart      | Admin               | `UPDATED`                                | `WAITING_SPAREPART`  |
| Approve sparepart      | SPV                 | `WAITING_SPAREPART`                      | `SPAREPART_APPROVED` |
| Mark as working        | Mechanic (assigned) | `UPDATED` or `SPAREPART_APPROVED`        | `WORKING`            |
| Complete (end date)    | Admin               | `WORKING`                                | `COMPLETED`          |

The rules are enforced **in the backend service layer**. The frontend only hides buttons that the current user cannot use; calling the API directly with the wrong role or status returns `403` / `409`.

## API

All endpoints are under `/api`. Endpoints marked 🔒 need the header `X-User-Id: <user uuid>` (see assumptions).

| Method | Path                                     | Description                                   |
| ------ | ---------------------------------------- | --------------------------------------------- |
| GET    | `/users`                                 | List users (optional `?role=MECHANIC`)        |
| GET    | `/work-orders` 🔒                        | List work orders (with mechanic & spareparts) |
| GET    | `/work-orders/:id` 🔒                    | Work order detail                             |
| POST   | `/work-orders` 🔒                        | Create (`title`, optional `description`)      |
| POST   | `/work-orders/:id/submit` 🔒             | Submit                                        |
| POST   | `/work-orders/:id/assign` 🔒             | Assign mechanic (`mechanicId`)                |
| POST   | `/work-orders/:id/update` 🔒             | Update (`title?`, `description?`, `startDate?`) |
| POST   | `/work-orders/:id/request-sparepart` 🔒  | Create sparepart request (`items: [{name, qty}]`) |
| POST   | `/sparepart-requests/:id/approve` 🔒     | Approve (`approvalNote?`), returns the work order |
| POST   | `/work-orders/:id/start` 🔒              | Mark as working                               |
| POST   | `/work-orders/:id/complete` 🔒           | Complete (`endDate`)                          |

Errors use the standard NestJS shape (`{ statusCode, message }`). `401` = missing/unknown user, `403` = role not allowed, `409` = invalid status for the action, `400` = validation error.

## Assumptions

- **No authentication** (it is optional in the test). The role selector picks one of the seeded users and the frontend sends its id in the `X-User-Id` header. The backend resolves that user and checks role and status itself. This is a stand-in for real auth, not a security mechanism.
- Because the seed has two mechanics, the selector chooses a **user** (name + role), not only a role, so "assign mechanic" has someone to choose from.
- The **Admin creates the sparepart request**, because the "Need sparepart?" decision sits in the Admin's update step of the diagram.
- Only the **assigned mechanic** can mark the work order as working.
- A sparepart request is only possible after the Admin update (`UPDATED`), and a new one cannot be created while the work order is waiting for approval.
- `startDate` is optional on update; if empty, it is set when the mechanic starts the work. `endDate` cannot be before `startDate`.
- The ERD has no separate WO number, so the UI shows a short code derived from the id (e.g. `WO-1A2B3C4D`).
- The schema is created by TypeORM `synchronize: true` (no migrations) to keep the project simple.
- There is no delete or free-form edit; the test did not ask for them.

## Project structure

```
.
├── docker-compose.yml
├── backend/                        NestJS API
│   ├── Dockerfile
│   └── src/
│       ├── main.ts                 bootstrap (prefix /api, CORS, validation)
│       ├── app.module.ts           TypeORM / PostgreSQL config
│       ├── common/                 enums, ActorGuard (X-User-Id), @CurrentUser()
│       ├── users/                  user entity, seed, GET /users
│       └── work-orders/
│           ├── entities/           work_orders, sparepart_requests, sparepart_items
│           ├── dto/                request validation
│           ├── repositories/       WorkOrderRepository (interface) + TypeORM implementation
│           ├── work-orders.service.ts      business rules (roles, status transitions)
│           ├── work-orders.controller.ts   HTTP layer only
│           └── work-orders.module.ts       binds the repository interface to its implementation
└── frontend/                       React app (Vite)
    ├── Dockerfile, nginx.conf
    └── src/
        ├── api/                    typed fetch client + one function per endpoint
        ├── auth/                   role provider (acting user, sent as X-User-Id)
        ├── layouts/                dashboard layout, nav, role selector (from the template)
        ├── pages/                  route entry points
        ├── routes/                 router config
        └── sections/work-order/    list view, detail view, dialogs,
                                    work-order-meta.ts (status labels + which actions each role sees)
```

### Architecture notes

- **Controller → Service → Repository.** Controllers only parse the request and call the service. All business rules live in `WorkOrdersService` (one `transition()` helper checks role, checks current status, applies the change, saves). The service depends on the `WorkOrderRepository` interface, so the storage can be replaced or mocked without touching business logic.
- Approving a sparepart request changes the request and the work order in **one save** (cascade), so they cannot get out of sync.
- The frontend's `getAvailableActions()` mirrors the backend rules to show the right buttons; the backend remains the source of truth.

## Notes

- The UI is built on the free **Minimal Material Kit** (MUI) template; demo pages were removed.
- `docker compose up --build` runs the frontend with `vite build` only (no type-check/lint step) so the container build is robust; type-checking and linting run in dev mode (`npm run dev` inside `frontend/`).
- Optional, for inspecting the database during development, a tool such as Adminer can be added as an extra compose service (host `db`, user `wo_user`, password `wo_pass`, database `wo_db`). It is not part of the required setup.
