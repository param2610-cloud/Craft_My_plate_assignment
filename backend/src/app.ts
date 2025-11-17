import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { registerRoomRoutes } from './routes/room.routes.js';
import { registerBookingRoutes } from './routes/booking.routes.js';
import { registerAnalyticsRoutes } from './routes/analytics.routes.js';
import { errorMiddleware } from './middlewares/error.middleware.js';

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const indexHtmlPath = path.resolve(__dirname, '../index.html');

app.use(cors());
app.use(express.json());

app.get('/', (_req, res, next) => {
  res.sendFile(indexHtmlPath, (error) => {
    if (error) {
      next(error);
    }
  });
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

registerRoomRoutes(app);
registerBookingRoutes(app);
registerAnalyticsRoutes(app);

app.use(errorMiddleware);

export { app };
