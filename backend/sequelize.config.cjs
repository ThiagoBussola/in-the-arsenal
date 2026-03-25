require("dotenv").config();

/** Used only by sequelize-cli (`npm run db:migrate`). App uses `src/config/database.ts`. */
module.exports = {
  development: {
    use_env_variable: "DATABASE_URL",
    dialect: "postgres",
    seederStorage: "sequelize",
  },
  test: {
    use_env_variable: "DATABASE_URL",
    dialect: "postgres",
    seederStorage: "sequelize",
  },
  production: {
    use_env_variable: "DATABASE_URL",
    dialect: "postgres",
    dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
    seederStorage: "sequelize",
  },
};
