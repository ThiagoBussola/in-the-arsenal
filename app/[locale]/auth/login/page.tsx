"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter, Link } from "@/i18n/navigation";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../../../lib/auth-context";
import { formatAuthFetchError } from "../../../lib/fetch-errors";
import { ShieldIcon } from "../../../icons";
import { AuthScaffold } from "../../../components/layout/AuthScaffold";

const hasGoogle = Boolean(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);

export default function LoginPage() {
  const t = useTranslations("auth");
  const router = useRouter();
  const { login, googleLogin } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      router.push("/");
    } catch (err: unknown) {
      setError(formatAuthFetchError(err, t, "loginError"));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (response: { credential?: string }) => {
    if (!response.credential) return;
    setError("");
    setLoading(true);
    try {
      await googleLogin(response.credential);
      router.push("/");
    } catch (err: unknown) {
      setError(formatAuthFetchError(err, t, "loginError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScaffold>
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-gold/25 bg-surface/70 shadow-lg shadow-gold/5 backdrop-blur-sm">
            <ShieldIcon className="h-8 w-8 text-gold" />
          </div>
          <h1 className="font-heading text-2xl font-bold tracking-wide text-foreground">
            {t("loginTitle")}
          </h1>
          <p className="mt-2 text-sm text-muted">{t("loginSubtitle")}</p>
        </div>

        <div className="rounded-sm border border-surface-border/80 bg-surface/85 p-5 shadow-xl shadow-black/30 backdrop-blur-md sm:p-8">
          {error && (
            <div className="mb-4 rounded-sm border border-crimson/30 bg-crimson/10 p-3 text-sm text-crimson-bright">
              {error}
            </div>
          )}

          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="mb-1 block text-sm font-medium text-foreground"
              >
                {t("email")}
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-sm border border-surface-border bg-background/80 px-4 py-2.5 text-sm text-foreground placeholder:text-muted/60 outline-none transition-colors focus:border-gold/50"
                placeholder={t("emailPlaceholder")}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1 block text-sm font-medium text-foreground"
              >
                {t("password")}
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-sm border border-surface-border bg-background/80 px-4 py-2.5 text-sm text-foreground placeholder:text-muted/60 outline-none transition-colors focus:border-gold/50"
                placeholder={t("passwordPlaceholder")}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-sm border border-gold/40 bg-gold/10 px-4 py-2.5 font-heading text-sm font-semibold tracking-widest text-gold uppercase transition-all hover:border-gold/70 hover:bg-gold/15 disabled:opacity-50"
            >
              {loading ? t("signingIn") : t("signIn")}
            </button>
          </form>

          {hasGoogle && (
            <>
              <div className="my-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-surface-border" />
                <span className="text-xs text-muted">{t("or")}</span>
                <div className="h-px flex-1 bg-surface-border" />
              </div>

              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={(c) => void handleGoogleSuccess(c)}
                  onError={() => setError(t("googleError"))}
                  theme="filled_black"
                  shape="rectangular"
                  text="signin_with"
                  width="100%"
                />
              </div>
            </>
          )}

          <p className="mt-6 text-center text-sm text-muted">
            {t("noAccount")}{" "}
            <Link
              href="/auth/register"
              className="text-gold transition-colors hover:text-gold-bright hover:underline"
            >
              {t("signUpLink")}
            </Link>
          </p>
        </div>
      </div>
    </AuthScaffold>
  );
}
