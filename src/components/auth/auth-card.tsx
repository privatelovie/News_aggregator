"use client";

import { Loader2 } from "lucide-react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";

type AuthCardProps = {
  mode: "login" | "signup";
};

export function AuthCard({ mode }: AuthCardProps) {
  const isLogin = mode === "login";
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/feed";
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const name = String(formData.get("name") ?? "");

    try {
      if (!isLogin) {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, name, password })
        });

        if (!response.ok) {
          const payload = (await response.json()) as { message?: string };
          setError(payload.message ?? "Unable to create account.");
          return;
        }
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl
      });

      if (result?.error) {
        setError("Invalid email or password.");
        return;
      }

      router.push(result?.url ?? callbackUrl);
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-md place-items-center px-4 py-10">
      <section className="w-full rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <h1 className="text-2xl font-semibold text-slate-950 dark:text-white">
          {isLogin ? "Welcome back" : "Create account"}
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          {isLogin
            ? "Sign in with Google or your email and password."
            : "Create an account with email, then personalize your feed."}
        </p>

        <button
          className="mt-6 w-full rounded-md border border-slate-200 px-4 py-2 text-sm font-medium transition hover:bg-slate-100 dark:border-slate-800 dark:hover:bg-slate-900"
          onClick={() => signIn("google", { callbackUrl })}
          type="button"
        >
          Continue with Google
        </button>

        <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-wide text-slate-400">
          <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
          <span>Email</span>
          <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {!isLogin && (
            <label className="block text-sm font-medium">
              Name
              <input
                autoComplete="name"
                className="mt-2 w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 outline-none transition focus:border-slate-500 dark:border-slate-800"
                name="name"
                placeholder="Jane Doe"
                type="text"
              />
            </label>
          )}
          <label className="block text-sm font-medium">
            Email
            <input
              autoComplete="email"
              className="mt-2 w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 outline-none transition focus:border-slate-500 dark:border-slate-800"
              name="email"
              placeholder="you@example.com"
              required
              type="email"
            />
          </label>
          <label className="block text-sm font-medium">
            Password
            <input
              autoComplete={isLogin ? "current-password" : "new-password"}
              className="mt-2 w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 outline-none transition focus:border-slate-500 dark:border-slate-800"
              minLength={8}
              name="password"
              placeholder="Minimum 8 characters"
              required
              type="password"
            />
          </label>

          {error && (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
              {error}
            </p>
          )}

          <button
            className="flex w-full items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            {isLogin ? "Login" : "Sign up"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-600 dark:text-slate-300">
          {isLogin ? "No account yet?" : "Already have an account?"}{" "}
          <Link
            className="font-medium text-slate-950 underline-offset-4 hover:underline dark:text-white"
            href={isLogin ? "/signup" : "/login"}
          >
            {isLogin ? "Sign up" : "Login"}
          </Link>
        </p>
      </section>
    </main>
  );
}
