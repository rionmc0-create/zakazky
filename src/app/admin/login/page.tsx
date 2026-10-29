
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      try {
        const supabase = createClient();
        const {
          data: { user },
          error: sessionError,
        } = await supabase.auth.getUser();

        if (cancelled) return;

        if (sessionError) {
          console.error("Session check failed:", sessionError);
        }

        if (user) {
          const { data: isAdmin, error: adminError } =
            await supabase.rpc("is_portfolio_admin");

          if (cancelled) return;

          if (!adminError && isAdmin === true) {
            router.replace("/admin");
            router.refresh();
            return;
          }
        }
      } catch (err) {
        console.error("Session check failed:", err);
      } finally {
        if (!cancelled) {
          setCheckingSession(false);
        }
      }
    }

    void checkSession();

    return () => {
      cancelled = true;
    };
  }, [router]);

  async function handleLogin(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (loading) return;

    setLoading(true);
    setError("");

    try {
      const supabase = createClient();

      const { error: loginError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (loginError) {
        console.error("Supabase login failed:", loginError);
        setError(
          "Přihlášení se nezdařilo. Zkontroluj e-mail a heslo.",
        );
        return;
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        await supabase.auth.signOut();
        setError("Nepodařilo se ověřit přihlášení. Zkus to znovu.");
        return;
      }

      const { data: isAdmin, error: adminError } =
        await supabase.rpc("is_portfolio_admin");

      if (adminError || isAdmin !== true) {
        await supabase.auth.signOut();
        setError("Tento účet nemá oprávnění správce.");
        return;
      }

      router.replace("/admin");
      router.refresh();
    } catch (err) {
      console.error("Login request failed:", err);
      setError(
        "Nepodařilo se připojit. Zkus to prosím znovu.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (checkingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#090a0c] text-sm text-zinc-500">
        Kontrola přihlášení...
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#090a0c] px-5 text-zinc-100">
      <div className="w-full max-w-md">
        <a href="/" className="mb-8 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/10 bg-[#15171b] font-bold">
            Rx
          </div>
          <div>
            <div className="text-lg font-semibold">
              Rionxdd<span className="text-blue-500">.</span>
            </div>
            <div className="text-[10px] tracking-[0.2em] text-zinc-500">
              ADMINISTRATION
            </div>
          </div>
        </a>

        <section className="rounded-xl border border-white/[0.08] bg-[#0e0f12] p-7 sm:p-9">
          <p className="mb-3 text-xs font-medium tracking-[0.16em] text-blue-400">
            SECURE ACCESS
          </p>

          <h1 className="text-2xl font-semibold tracking-tight">
            Administrace
          </h1>

          <p className="mt-2 text-sm leading-6 text-zinc-500">
            Přihlas se pro správu projektů a zakázek.
          </p>

          <form onSubmit={handleLogin} className="mt-8 space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-xs font-medium text-zinc-400"
              >
                E-mail
              </label>
              <input
                id="email"
                type="email"
                autoComplete="username"
                maxLength={254}
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#090a0c] px-3.5 py-3 text-sm outline-none transition focus:border-blue-500"
                placeholder="admin@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-xs font-medium text-zinc-400"
              >
                Heslo
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#090a0c] px-3.5 py-3 text-sm outline-none transition focus:border-blue-500"
                placeholder="Zadej heslo"
              />
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-lg border border-red-900/60 bg-red-950/30 p-3 text-sm text-red-400"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Přihlašování..." : "Přihlásit se"}
            </button>
          </form>

          <a
            href="/"
            className="mt-6 block text-center text-xs text-zinc-500 transition hover:text-white"
          >
            ← Zpět na portfolio
          </a>
        </section>

        <p className="mt-5 text-center text-[11px] text-zinc-600">
          Rionxdd © 2026
        </p>
      </div>
    </main>
  );
}
