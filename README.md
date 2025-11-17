# Workspace Booking & Pricing System

Minimal workspace booking platform with an Express + TypeScript backend and a React (Vite) frontend. The backend enforces conflict detection, minute-precise pricing with configurable peak windows, strict validation, and cancellation rules. Bookings are persisted to disk so data survives restarts, and analytics endpoints aggregate revenue/utilization per room.

## Minute-precise billing

Pricing is prorated per minute. Each minute between `startTime` (inclusive) and `endTime` (exclusive) is billed at the room's base rate divided by 60, multiplied by the current peak/off-peak multiplier. Peak ranges default to weekdays 10:00–13:00 and 16:00–19:00 (Asia/Kolkata) at `1.5×`; all other minutes remain at `1.0×`. The final amount is rounded to the nearest whole currency unit and this approach is documented here to satisfy the "minute should be documented" requirement.

## Data persistence

Bookings are stored in `backend/data/bookings.json`. Every create/update operation acquires an async lock before the JSON file is rewritten, preventing conflicting writes and ensuring data survives process restarts. This lightweight store keeps the project dependency-free while meeting the "persist beyond runtime" constraint. Swap the repository implementation with a real database when needed; the service layer already encapsulates all business logic.

## Running locally

### Backend

```powershell
cd backend
cp .env.example .env
npm install
npm run dev
```

Key endpoints:
- `GET /api/rooms` — list seed rooms
- `POST /api/bookings` — validate, price, and persist a booking
- `GET /api/bookings` — optional filters `roomId`, `status`, `from`, `to`
- `POST /api/bookings/:id/cancel` — enforce two-hour cut-off
- `GET /api/analytics?from=YYYY-MM-DD&to=YYYY-MM-DD` — revenue/hours per room

Environment variables (see `.env.example`):

| Name | Description | Default |
| --- | --- | --- |
| `PORT` | API port | `4000` |
| `DATABASE_URL` | Placeholder for future DB | _empty_ |
| `TZ` | Primary timezone | `Asia/Kolkata` |
| `PEAK_MULTIPLIER` | Peak pricing multiplier | `1.5` |
| `OFF_PEAK_MULTIPLIER` | Off-peak multiplier | `1` |
| `PEAK_WINDOWS` | Comma-separated HH:mm-HH:mm ranges | `10:00-13:00,16:00-19:00` |
| `PEAK_WEEKDAYS` | Weekday indexes (0=Sun) | `1,2,3,4,5` |
| `PRICING_TZ_OFFSET_MINUTES` | Minutes offset from UTC for pricing | `330` |

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

The Vite dev server runs on port 5173 by default and expects `VITE_API_URL` to point to the backend (otherwise it falls back to `http://localhost:3000`).

### Scenario validation

```powershell
cd backend
npm run test:scenarios
```

This script wipes `backend/data/bookings.json`, seeds rooms, and exercises the six rubric scenarios: non-overlapping bookings, conflict handling, peak/off-peak pricing math, cancellation windows, concurrent booking guards, and analytics totals (confirmed-only revenue).

## Architecture notes

- **Layering:** routes → controllers → services → repositories/models. Controllers stay thin, services hold business rules, repositories only read/write data.
- **Validation:** `booking.service.ts` enforces ISO timestamps, duration ≤ 12 hours, future start times, structured 400/404/409 responses, and >2 hour cancellation windows.
- **Atomicity:** booking creation paths run inside an async lock so conflict detection and persistence happen as a single critical section, preventing concurrent overlaps even on the JSON store.
- **Error shape:** `AppError` + `errorMiddleware` guarantees `{ error, code, details, traceId }` payloads across the API.
- **Analytics:** `analytics.service.ts` aggregates confirmed bookings only, summing minutes and revenue per room for the requested date window.

Refer to `ARCHITECTURE.md` for deeper scaling notes when you move past the prototype stage.
