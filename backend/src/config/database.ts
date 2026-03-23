import { Sequelize } from "sequelize-typescript";
import { env } from "./env";
import path from "path";

function createSequelize(): Sequelize {
  const modelsPath = path.join(__dirname, "..", "models");
  const commonOptions = {
    models: [modelsPath],
    logging: env.NODE_ENV === "development" ? console.log : false,
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

// Config export for sequelize-cli (migrations)
const cliConfig = {
  development: {
    use_env_variable: "DATABASE_URL",
    dialect: "postgres" as const,
    seederStorage: "sequelize" as const,
  },
  test: {
    use_env_variable: "DATABASE_URL",
    dialect: "postgres" as const,
    seederStorage: "sequelize" as const,
  },
  production: {
    use_env_variable: "DATABASE_URL",
    dialect: "postgres" as const,
    dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
    seederStorage: "sequelize" as const,
  },
};

module.exports = cliConfig;
export default cliConfig;
