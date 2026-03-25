import { Sequelize } from "sequelize-typescript";
import { env } from "./env";
import { logger } from "../lib/logger";
import { User } from "../models/User";
import { Post } from "../models/Post";
import { Category } from "../models/Category";
import { Tag } from "../models/Tag";
import { PostTag } from "../models/PostTag";
import { RefreshToken } from "../models/RefreshToken";
import { CardCache } from "../models/CardCache";
import { Deck } from "../models/Deck";
import { DeckCard } from "../models/DeckCard";
import { CardUsageStat } from "../models/CardUsageStat";

/** Explicit list avoids loading `models/index.ts` as a model when running TS from source (tests, tsx). */
const REGISTERED_MODELS = [
  User,
  Post,
  Category,
  Tag,
  PostTag,
  RefreshToken,
  CardCache,
  Deck,
  DeckCard,
  CardUsageStat,
];

function createSequelize(): Sequelize {
  const commonOptions = {
    models: REGISTERED_MODELS,
    // SQL no terminal polui o output; para depurar queries use LOG_SQL=true no .env
    logging:
      process.env.LOG_SQL === "true"
        ? (sql: string) => {
            logger.debug({ sql }, "sequelize query");
          }
        : false,
    define: {
      timestamps: true,
      underscored: true,
    },
  };

  if (env.DATABASE_URL) {
    return new Sequelize(env.DATABASE_URL, {
      ...commonOptions,
      dialect: "postgres",
      dialectOptions:
        env.NODE_ENV === "production"
          ? { ssl: { require: true, rejectUnauthorized: false } }
          : {},
    });
  }

  return new Sequelize({
    ...commonOptions,
    dialect: "postgres",
    host: env.DB_HOST,
    port: env.DB_PORT,
    database: env.DB_NAME,
    username: env.DB_USER,
    password: env.DB_PASSWORD,
  });
}

export const sequelize = createSequelize();

// Sequelize CLI config lives in `sequelize.config.cjs` (see `.sequelizerc`).
// Do not assign `module.exports` here — it replaces named exports and breaks
// `import { sequelize }` when the module loads through CJS interop (e.g. tsx).
