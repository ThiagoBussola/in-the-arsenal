import app from "./app";
import { env } from "./config/env";
import { sequelize } from "./config/database";

async function bootstrap() {
  try {
    await sequelize.authenticate();
    console.log("Database connection established");
  } catch (err) {
    console.error("Unable to connect to database:", err);
    process.exit(1);
  }

  const port = env.PORT;
  app.listen(port, () => {
    console.log(`[In the Arsenal] API running on port ${port} (${env.NODE_ENV})`);
  });
}

bootstrap();
