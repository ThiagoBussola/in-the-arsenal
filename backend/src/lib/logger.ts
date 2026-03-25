import pino from "pino";

const level =
  process.env.LOG_LEVEL ??
  (process.env.NODE_ENV === "production" ? "info" : "debug");

/**
 * Pino’s default destination writes via SonicBoom (async buffered I/O to stdout),
 * so normal logging does not block the Node event loop the way synchronous console I/O can.
 */
export const logger = pino({ level });
