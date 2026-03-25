/**
 * Browser bundle: Pino targets Node. For dev-only diagnostics we defer to the next
 * microtask so logging does not run synchronously in the middle of user handlers.
 */
export function devError(...args: unknown[]): void {
  if (process.env.NODE_ENV !== "development") return;
  queueMicrotask(() => {
    console.error(...args);
  });
}
