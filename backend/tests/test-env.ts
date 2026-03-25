/**
 * Import this file before any `src/` module so `dotenv` does not override these defaults.
 * Usage: `import "./test-env";` or `import "../test-env";` as the first import.
 */
process.env.NODE_ENV = "test";

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16) {
  process.env.JWT_SECRET = "test-jwt-secret-minimum-16chars";
}

if (!process.env.JWT_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET.length < 16) {
  process.env.JWT_REFRESH_SECRET = "test-refresh-secret-min-16ch";
}

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL =
    "postgres://arsenal:arsenal_secret@127.0.0.1:5432/in_the_arsenal";
}

process.env.CARD_SEARCH_SOURCE = process.env.CARD_SEARCH_SOURCE || "cache";
process.env.OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";

if (process.env.FABCUBE_CARD_FLATTENED_URL === "") {
  delete process.env.FABCUBE_CARD_FLATTENED_URL;
}
