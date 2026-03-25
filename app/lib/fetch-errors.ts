/** Thrown when the Next proxy cannot reach the Express API (misconfigured API_SERVER_URL, backend down). */
export const API_UPSTREAM_ERROR = "__API_UPSTREAM__";

export function isLikelyNetworkFailure(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const m = err.message.toLowerCase();
  return (
    m.includes("failed to fetch") ||
    m.includes("networkerror") ||
    m.includes("load failed") ||
    m.includes("network request failed") ||
    err.message === API_UPSTREAM_ERROR
  );
}

export function formatAuthFetchError(
  err: unknown,
  t: (key: string) => string,
  fallbackKey: "loginError" | "registerError",
): string {
  if (err instanceof Error && err.message === API_UPSTREAM_ERROR) {
    return t("upstreamUnavailable");
  }
  if (isLikelyNetworkFailure(err)) {
    return t("networkUnreachable");
  }
  if (err instanceof Error && err.message) return err.message;
  return t(fallbackKey);
}
