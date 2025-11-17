import { env } from './env.js';

// Placeholder for database wiring; swap with actual driver when ready.
export const connectDatabase = async () => {
  if (!env.databaseUrl) {
    console.warn('DATABASE_URL is not configured. Skipping DB bootstrap.');
    return null;
  }

  // Here we would initialize the real DB client (Prisma, Sequelize, etc.).
  return Promise.resolve(env.databaseUrl);
};
