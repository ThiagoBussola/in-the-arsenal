import app from "./app";
import { env } from "./config/env";
import { sequelize } from "./config/database";
import { logger } from "./lib/logger";

async function bootstrap() {
  try {
    await sequelize.authenticate();
    logger.info("Database connection established");
  } catch (err) {
    logger.fatal({ err }, "Unable to connect to database");
    process.exit(1);
  }

  const port = env.PORT;
  app.listen(port, () => {
    logger.info(
      { port, env: env.NODE_ENV },
      "[In the Arsenal] API listening",
    );
  });
}

bootstrap();
