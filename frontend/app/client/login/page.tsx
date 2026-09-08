"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function ClientLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = useMemo(() => {
    const n = searchParams.get("next") || "";
    return n.startsWith("/client") ? n : "/client/dashboard";
  }, [searchParams]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, portal: "client" }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        redirectTo?: string;
      };
      if (!res.ok) {
        const retry = Number.parseInt(res.headers.get("Retry-After") ?? "", 10);
        if (res.status === 429 && Number.isFinite(retry) && retry > 0) {
          throw new Error(`${data.error || "Too many attempts."} Try again in ${retry}s.`);
        }
        throw new Error(data.error || "Sign in failed");
      }
      router.replace(data.redirectTo || nextPath);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="mb-6 text-center">
        <p className="text-2xl font-extrabold tracking-tight">Skynexia DM</p>
        <p className="text-sm text-muted-foreground">Client Portal</p>
      </div>
      <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm sm:p-8">
        <h1 className="text-xl font-bold tracking-tight">Sign in to your portal</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track your review progress, updates and activity.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div className="space-y-1">
            <label htmlFor="client-email" className="text-sm font-medium">
              Email
            </label>
            <Input
              id="client-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              autoComplete="username"
              required
              placeholder="you@company.com"
              className="h-11"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="client-password" className="text-sm font-medium">
              Password
            </label>
            <div className="relative">
              <Input
                id="client-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                placeholder="••••••••"
                className="h-11 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error ? (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          <Button type="submit" className="h-11 w-full text-[15px]" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
          Your portal only shows information about your own account.
        </p>
      </div>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Agency team member?{" "}
        <Link href="/login" className="font-medium text-primary">
          Use the team sign-in
        </Link>
      </p>
    </div>
  );
}

export default function ClientLoginPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-[hsl(var(--muted)/0.45)] p-6">
      <Suspense>
        <ClientLoginForm />
      </Suspense>
    </div>
  );
}
