Nice — here’s a **rewritten, evaluation-driven version of the Functional Requirements** you can drop into the repo, attach to an agent, or include with the assignment. It’s organized so the graders can quickly map each requirement to the evaluation rubric (backend logic, architecture, frontend, edge cases, reasoning).

---

# Functional Requirements — *Evaluation-driven*

**Goal:** implement a workspace booking & pricing system with clear, testable APIs and robust backend logic. All requirements below are written to maximize points across the rubric:

* **Backend Design & Logic (40%)** — conflict detection, pricing, correctness
* **Code Structure & Readability (25%)** — layering, encapsulation, naming, comments
* **Frontend Integration (15%)** — predictable API, clear responses, UX-friendly errors
* **Edge Cases & Error Handling (10%)** — validation, status codes, concurrency safety
* **Architecture & Reasoning (10%)** — documentation, decisions, scaling notes

---

## Assumptions & global rules

* **Timezone:** Asia/Kolkata (use UTC+05:30 consistently). Store timestamps in ISO-8601 UTC and convert for display if needed.
* **Booking semantics:** `endTime == startTime` is allowed (zero-length — allowed but should normally be rejected by validation); typical valid bookings must satisfy `startTime < endTime`.
* **Rounding / billing:** Pricing is **minute-precise** (pro-rate by minutes) unless explicitly configured to round to nearest 0.5 hour — document chosen approach in `README.md`.
* **Env config:** All DB/credentials & pricing thresholds must be environment variables.
* **Include tests or seed data** to demonstrate behavior for conflict detection and pricing.

---

## Data models (concise)

### Room

* `id: string` (UUID)
* `name: string`
* `baseHourlyRate: number` (in smallest currency unit, e.g. paise)
* `capacity: number`
* `metadata?: object`

### Booking

* `id: string` (UUID)
* `roomId: string`
* `userName: string`
* `startTime: string` (ISO-8601 UTC)
* `endTime: string` (ISO-8601 UTC)
* `totalPrice: number` (computed)
* `status: "CONFIRMED" | "CANCELLED"`
* `createdAt`, `updatedAt`

---

## Core endpoints (stable API contract)

### `GET /api/rooms`

* Response: list of rooms with `id`, `name`, `baseHourlyRate`, `capacity`.
* 200 OK.

### `POST /api/rooms` (seed/demo; optional)

* Create room.
* 201 Created or 400 Bad Request.

### `POST /api/bookings`

**Purpose:** create a booking and return confirmation or clear conflict error.

**Request body**

```json
{
  "roomId": "string",
  "userName": "string",
  "startTime": "ISO-8601 string (UTC)",
  "endTime": "ISO-8601 string (UTC)"
}
```

**Validation (400 Bad Request)**

* `roomId` exists (404 if not found).
* `userName` non-empty.
* `startTime` and `endTime` are valid ISO datetimes.
* `startTime < endTime`.
* Duration ≤ 12 hours (otherwise 400).
* Booking start >= now OR system policy (you may allow future only).

**Conflict detection (409 Conflict)**

* If any existing `CONFIRMED` booking for same room overlaps with requested interval, respond 409 with JSON:

```json
{ "error": "Room already booked", "conflict": { "existingBookingId": "b123", "startTime": "...", "endTime": "..." } }
```

* Overlap rules:

  * Two intervals `[A,B)` and `[C,D)` overlap if `A < D && C < B`.
  * End equals start is allowed (no overlap).

**Pricing**

* Compute price per-minute using:

  * `perMinuteRate = baseHourlyRate / 60`
  * For each minute in the booking interval, determine if it falls in peak windows (see Pricing section below).
  * `totalPrice = sum(perMinuteRate * peakMultiplier for each minute)` → round to nearest integer currency unit.
* Return `201 Created` on success with:

```json
{
  "bookingId": "b123",
  "roomId": "101",
  "userName": "Priya",
  "totalPrice": 975,
  "status": "CONFIRMED"
}
```

**Atomicity & Concurrency**

* Booking creation must be atomic: use DB transactions or optimistic locking to avoid race conditions where two concurrent requests create overlapping bookings.

---

### `POST /api/bookings/:id/cancel`

**Rules**

* Allowed only if **now** is at least 2 hours before `startTime` (server time in Asia/Kolkata).
* If allowed: set `status = CANCELLED`, return 200 OK with booking.
* If not allowed: return `400 Bad Request` with `{ "error": "Cancellations allowed only >2 hours before start time" }`.

---

### `GET /api/bookings` (admin)

* List bookings with filters: `?roomId=&from=&to=&status=`.
* 200 OK.

---

### `GET /api/analytics?from=YYYY-MM-DD&to=YYYY-MM-DD`

**Purpose:** return per-room totals for confirmed bookings between inclusive dates (dates interpreted in Asia/Kolkata).

**Response example**

```json
[
  { "roomId": "101", "roomName": "Cabin 1", "totalHours": 15.5, "totalRevenue": 5250 }
]
```

* Include only `CONFIRMED` bookings.
* `totalHours` is decimal hours (e.g., 1.25 = 1 hour 15 minutes).
* `totalRevenue` is sum of `totalPrice` for those bookings.

---

## Pricing (exact, auditable rules)

* **Peak multiplier:** `1.5×` of base rate during **peak windows**:

  * Weekdays (Mon–Fri):

    * 10:00–13:00 (10 AM–1 PM)
    * 16:00–19:00 (4 PM–7 PM)
* **Off-peak multiplier:** `1.0×`.
* **Minute-wise computation**: for full accuracy, compute on a per-minute basis inside booking interval, summing appropriate multiplier for each minute. This avoids ambiguous boundary handling.
* **Configurable:** peak windows and multipliers must be configurable via env or config file and documented.

---

## Conflict detection — precise rules

* Use half-open intervals `[startTime, endTime)` for comparison.
* Overlap if `requestedStart < existingEnd && existingStart < requestedEnd`.
* Bookings with `endTime == other.startTime` do NOT overlap.
* Exclude `CANCELLED` bookings from conflict checks and analytics.

---

## Edge cases & validation (must be covered)

* Booking duration > 12 hours → 400.
* Invalid ISO datetimes → 400.
* Room not found → 404.
* Missing fields → 400 with field-level messages.
* Timezone edge cases (DST irrelevant for Asia/Kolkata but still use UTC storage and convert).
* Concurrency: simultaneous booking attempts for same slot must not both succeed (use DB lock/transaction).
* Partial minutes (minute-precision) must be billed pro-rata.

---

## Error response shape (consistent API)

* Use JSON with keys: `error` (short message), `details` (optional object/field errors), and request `traceId` (for debugging).

```json
{ 
  "error": "Room already booked",
  "details": { "existingBookingId": "b123", "existingStart": "...", "existingEnd": "..." },
  "traceId": "uuid"
}
```

* Map error codes to HTTP statuses:

  * Validation / business rule failure → `400 Bad Request`
  * Not found → `404 Not Found`
  * Conflict (overlap) → `409 Conflict`
  * Success create → `201 Created`
  * Success fetch → `200 OK`

---

## Acceptance criteria (graded items mapped to rubric)

### Backend Design & Logic (40%)

* ✅ Booking creation prevents overlaps (unit + integration tests + seed scenarios).
* ✅ Pricing algorithm implemented exactly as specified (minute-precise) and configurable.
* ✅ Atomic booking creation under concurrent requests (demonstrated with integration test or explanation + code).

### Code Structure & Readability (25%)

* ✅ Layered code: `routes → controllers → services → repositories/models` (no monolithic controllers).
* ✅ Services contain business logic; repositories only DB; controllers only `req/res`.
* ✅ Meaningful names, short comments explaining “why” (not “what”), single-responsibility functions.
* ✅ No unreadable autogenerated blocks in core logic; generated code permitted for client SDKs only if documented.

### Frontend Integration (15%)

* ✅ Clear API contract with example requests/responses (above).
* ✅ Error payloads consistent and easily shown in UI.
* ✅ Admin endpoints for list/cancel/analytics.

### Edge Cases & Error Handling (10%)

* ✅ Validation errors return 400 with structured details.
* ✅ Cancel rule (>2 hours) enforced.
* ✅ End==start allowed semantics documented.
* ✅ Concurrency safe.

### Architecture & Reasoning (10%)

* ✅ `ARCHITECTURE.md` explains data model, conflict logic, pricing method, scaling ideas, and where AI assisted.
* ✅ Use of env variables for DB and feature toggles.
* ✅ Short section that defends chosen rounding/billing decision.

---

## Minimal test cases to include (automated or manual)

1. Create two non-overlapping bookings → both succeed.
2. Create booking A then attempt overlapping booking B → B returns 409 and shows conflicting booking times.
3. Pricing: booking spanning peak and off-peak minutes → totalPrice equals sum of per-minute rates with 1.5 multiplier on peak minutes.
4. Cancellation allowed >2 hours before → success. Cancelling within 2 hours → 400.
5. Concurrent booking attempts for same minute range → only one confirmed (test simulating parallel requests).
6. Analytics: only confirmed bookings counted; cancelled excluded.

---

## Definition of Done (ticklist to submit)

* [ ] Backend routes implemented and deployed (or runnable locally).
* [ ] `README.md` with run instructions and sample curl commands.
* [ ] `ARCHITECTURE.md` describing pricing, conflict rules, atomicity approach, and AI usage.
* [ ] Seed data for 3–5 rooms or API to create rooms.
* [ ] Suite of tests or scripts demonstrating conflict & pricing correctness.
* [ ] Frontend with booking form and admin view wired to backend (can be minimal).
* [ ] All sensitive config via environment variables.
* [ ] Deployment URLs (frontend + backend) included in submission.

---

## Quick reference (copy/paste for agent use)

```text
- Timezone: Asia/Kolkata; store UTC internally.
- Pricing: minute-precise; peak windows Mon–Fri 10:00–13:00 & 16:00–19:00 => 1.5x multiplier (configurable).
- Conflict: half-open intervals [start,end); overlap if A < D && C < B; end==start allowed.
- Booking duration <=12 hours; start < end.
- Cancel only if >2 hours before start.
- API errors: 400 validation, 404 not found, 409 conflict, 201 created, 200 ok.
- Code structure: routes → controllers → services → repositories/models.
- Use DB transactions / locks to prevent race conditions.
```

---

If you want, I can now convert this into a **one-page `FUNCTIONAL_REQUIREMENTS.md`** file ready to drop in your repo (markdown) or produce concrete sample curl commands and JSON responses for each endpoint. Which one would you like next?
