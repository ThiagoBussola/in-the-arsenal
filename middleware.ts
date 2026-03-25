import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  matcher: [
    "/",
    "/(pt|en)/:path*",
    // Pathnames sem locale (ex.: /decks) → redireciona para /pt/...
    // Exclui /api/* (proxy para o backend; não deve passar pelo next-intl)
    "/((?!api|_next|_vercel|.*\\..*).*)",
  ],
};
