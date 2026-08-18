import app from './app.js';
import { testDatabaseConnection } from './config/db.js';

const PORT = process.env.PORT || 5000;

async function startServer() {
  await testDatabaseConnection();

  app.listen(PORT, () => {
    console.log(`EstateHub API running on port ${PORT}`);
  });
}

startServer();