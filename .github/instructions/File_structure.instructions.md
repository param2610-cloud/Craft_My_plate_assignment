---
applyTo: '**'
---
Provide project context and coding guidelines that AI should follow when generating code, answering questions, or reviewing changes.

backend/
 ├── src/
 │   ├── app.ts                    # express app instance
 │   ├── server.ts                 # start server
 │   ├── config/
 │   │    ├── env.ts               # load env vars
 │   │    └── db.ts                # DB connection (SQL/NoSQL/in-memory)
 │   ├── routes/
 │   │    ├── room.routes.ts
 │   │    └── booking.routes.ts
 │   ├── controllers/
 │   │    ├── room.controller.ts
 │   │    └── booking.controller.ts
 │   ├── services/
 │   │    ├── room.service.ts      # room CRUD
 │   │    └── booking.service.ts   # main booking logic
 │   ├── models/
 │   │    ├── room.model.ts        # Room type + schema
 │   │    └── booking.model.ts     # Booking type + schema
 │   ├── utils/
 │   │    ├── pricing.util.ts      # dynamic pricing algorithm
 │   │    ├── conflict.util.ts     # time overlap checker
 │   │    ├── time.util.ts         # timezone helpers
 │   │    └── response.util.ts     # API response helpers
 │   ├── middlewares/
 │   │    └── error.middleware.ts  # error formatter
 │   ├── analytics/
 │   │    └── analytics.service.ts # computations for revenue + utilization
 │   ├── seed/
 │   │    └── seedRooms.ts         # initial rooms
 │   └── types/
 │        └── index.d.ts           # shared TypeScript types
 ├── .env.example
 ├── package.json
 ├── tsconfig.json
 ├── README.md
 └── ARCHITECTURE.md



frontend/
 ├── src/
 │   ├── pages/
 │   │    ├── RoomsPage.tsx          # list rooms
 │   │    ├── BookingPage.tsx        # booking form
 │   │    └── AdminPage.tsx          # list bookings + cancel + analytics
 │   ├── components/
 │   │    ├── RoomCard.tsx
 │   │    ├── BookingForm.tsx
 │   │    ├── BookingList.tsx
 │   │    └── AnalyticsTable.tsx
 │   ├── api/
 │   │    ├── rooms.api.ts           # GET rooms
 │   │    ├── bookings.api.ts        # create + cancel bookings
 │   │    └── analytics.api.ts       # fetch analytics
 │   ├── hooks/
 │   │    └── useFetch.ts            # common fetch hook (optional)
 │   ├── context/
 │   │    └── AppContext.tsx         # shared state (optional)
 │   ├── utils/
 │   │    └── format.ts              # time/price formatting
 │   ├── layouts/
 │   │    └── MainLayout.tsx
 │   ├── App.tsx
 │   └── main.tsx
 ├── index.html
 ├── vite.config.js
 ├── package.json
 ├── README.md
 └── .env
