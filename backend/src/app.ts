import express from 'express';
import cors from 'cors';
import { registerRoomRoutes } from './routes/room.routes.js';
import { registerBookingRoutes } from './routes/booking.routes.js';
import { registerAnalyticsRoutes } from './routes/analytics.routes.js';
import { errorMiddleware } from './middlewares/error.middleware.js';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

registerRoomRoutes(app);
registerBookingRoutes(app);
registerAnalyticsRoutes(app);

app.use(errorMiddleware);

export { app };
