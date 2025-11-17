import { app } from './app.js';
import { env } from './config/env.js';
import { connectDatabase } from './config/db.js';
import { seedRooms } from './seed/seedRooms.js';

const bootstrap = async () => {
  await connectDatabase();
  await seedRooms();

  app.listen(env.port, () => {
    // Keep logging minimal while scaffolding.
    console.log(`API listening on port ${env.port}`);
  });
};

void bootstrap();
