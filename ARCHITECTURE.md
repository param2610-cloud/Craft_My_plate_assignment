# Architecture Overview

The platform is split into an Express + TypeScript backend and a minimalist React + Vite frontend. Both halves follow the Clean Architecture guideline defined in the assignment: **routes → controllers → services → repositories/models**. Business rules live in services, persistence logic is isolated inside repository classes, and controllers are tiny request/response translators.

## Backend

### Layering
- **Routes** (e.g., `booking.routes.ts`) register HTTP paths and forward to controllers.
- **Controllers** unpack query/body params, call services, and never embed business logic. They delegate all validation and wrap responses with the shared error middleware.
- **Services** (`booking.service.ts`, `analytics.service.ts`) enforce validation, conflict detection, pricing, cancellation windows, and analytics filtering. They only talk to repositories/models and utilities.
- **Repositories/models** encapsulate storage. `RoomModel` is in-memory for now, while `BookingModel` persists to `backend/data/bookings.json` and exposes high-level methods such as `findOverlapping`, `aggregate`, and `updateStatus`.

### Persistence & Concurrency
- Bookings are written to a JSON file so data survives restarts. `BookingModel` loads the file once and serializes after every create/update.
- An `AsyncLock` (in `utils/lock.util.ts`) protects both the repository and the service. Creation paths run inside `runExclusive`, so conflict detection + persistence behave atomically even under concurrent requests.
- The JSON store can later be swapped with a real database by keeping the same repository interface.

### Pricing & Conflicts
- Pricing is minute-precise: for every minute between `[startTime, endTime)` we bill `baseHourlyRate/60` and multiply by either `offPeakMultiplier` (default `1.0×`) or `peakMultiplier` (default `1.5×`).
- Peak windows and multipliers are **fully configurable** via env vars (`PEAK_WINDOWS`, `PEAK_WEEKDAYS`, `PEAK_MULTIPLIER`, `OFF_PEAK_MULTIPLIER`, `PRICING_TZ_OFFSET_MINUTES`). `config/pricing.ts` parses them once into the `PricingConfig` used by `pricing.util.ts`.
- Conflict detection follows the required half-open interval rule: `[A, B)` overlaps `[C, D)` if `A < D && C < B`. Helpers in `utils/conflict.util.ts` keep the logic testable and reusable.

### Validation & Error Handling
- `booking.service.ts` validates ISO timestamps, start < end, ≤12h duration, future-only starts, and >2 hour cancellation windows.
- Conflict errors return HTTP `409` with `{ error, code, details, traceId }`. Validation problems map to `400`, not-found to `404`.
- `analytics.service.ts` validates dates, enforces `from <= to`, and aggregates confirmed bookings only.

### Analytics
- `BookingModel.aggregate` converts confirmed bookings to minutes + revenue per room, respecting requested `from/to` ranges (inclusive, interpreted in Asia/Kolkata by default).
- `analytics.service.ts` enriches rows with room names before returning them.

## Frontend
- React components stay simple and reusable per the UI brief. `Message`, `Table`, `BookingRow`, `InputField`, etc., handle presentation.
- Pages call the fetch-based API client:
  - `RoomsPage` fetches `/api/rooms` on mount.
  - `BookingForm` pulls rooms, performs submissions, and surfaces `ApiError` messages + trace IDs.
  - `AdminPage` fetches bookings + analytics together, exposes cancellation actions, and refreshes after new bookings.
- Shared formatters (`formatCurrency`, `formatTimeRange`) keep presentation consistent.

## Tests & Seed Data
- `seed/seedRooms.ts` preloads three example rooms on boot.
- `npm run test:scenarios` executes `src/scripts/runScenarios.ts`, which resets the booking store and covers all required acceptance scenarios:
  1. Two non-overlapping bookings succeed.
  2. Overlapping booking returns a `409` conflict.
  3. Pricing across peak/off-peak minutes matches the expected minute math.
  4. Cancellation succeeds >2 hours out and fails within 2 hours.
  5. Concurrent booking attempts allow only one confirmation.
  6. Analytics totals equal the revenue of confirmed bookings (cancelled ones excluded).

## Configuration
- All sensitive or environment-specific settings live in `.env` (`DATABASE_URL`, `PORT`, `TZ`, pricing knobs). The frontend expects `VITE_API_URL`.
- Pricing timezone offset defaults to `+05:30` to honor the Asia/Kolkata rule; adjust `PRICING_TZ_OFFSET_MINUTES` for other regions.

## AI Assistance
AI (GitHub Copilot) was used for scaffolding, repetitive code generation, and documentation drafting. All AI-generated sections were reviewed and adapted for clarity, correctness, and adherence to the assignment’s coding standards.
