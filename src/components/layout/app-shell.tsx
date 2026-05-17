"use client";

import {
  Bookmark,
  Home,
  LogOut,
  Menu,
  Moon,
  Newspaper,
  Search,
  Sparkles,
  Sun,
  User
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useThemeStore } from "@/store/theme-store";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/feed", label: "Feed", icon: Sparkles },
  { href: "/search", label: "Search", icon: Search },
  { href: "/bookmarks", label: "Saved", icon: Bookmark }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { theme, toggleTheme } = useThemeStore();
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const isDark = theme === "dark";
  const isAuthenticated = status === "authenticated";

  return (
    <div
      className={cn(
        "min-h-screen bg-[radial-gradient(circle_at_top_left,#ccfbf1_0,transparent_28rem),linear-gradient(180deg,#f8fafc,#eef2ff_42%,#f8fafc)] dark:bg-[radial-gradient(circle_at_top_left,#134e4a_0,transparent_26rem),linear-gradient(180deg,#020617,#111827_48%,#020617)]",
        isDark && "dark"
      )}
    >
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/85">
        <div className="mx-auto flex min-h-16 w-full max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <Link className="flex items-center gap-2 font-semibold" href="/">
            <span className="grid size-9 place-items-center rounded-md bg-slate-950 text-white shadow-sm dark:bg-white dark:text-slate-950">
              <Newspaper className="size-5" />
            </span>
            <span className="tracking-normal">Neural News</span>
          </Link>

          <nav className="hidden items-center rounded-lg border border-slate-200 bg-slate-50 p-1 md:flex dark:border-slate-800 dark:bg-slate-900/70">
            {navItems.map((item) => (
              <Link
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-600 transition hover:bg-white hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white",
                  pathname === item.href &&
                    "bg-white text-slate-950 shadow-sm dark:bg-slate-800 dark:text-white"
                )}
                href={item.href}
                key={item.href}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              className="hidden min-w-52 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 shadow-sm transition hover:border-slate-300 lg:flex dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
              href="/search"
            >
              <Search className="size-4" />
              Search signals, sources, topics
            </Link>
            <Link
              aria-label="Search"
              className="grid size-9 place-items-center rounded-md border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 lg:hidden"
              href="/search"
            >
              <Search className="size-4" />
            </Link>
            <button
              aria-label="Toggle dark mode"
              className="grid size-9 place-items-center rounded-md border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              onClick={toggleTheme}
              type="button"
            >
              {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
            {isAuthenticated ? (
              <>
                <Link
                  aria-label="Profile"
                  className="hidden size-9 place-items-center rounded-md border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 sm:grid"
                  href="/profile"
                  title={session.user?.email ?? "Profile"}
                >
                  <User className="size-4" />
                </Link>
                <button
                  aria-label="Sign out"
                  className="grid size-9 place-items-center rounded-md bg-slate-950 text-white shadow-sm transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                  onClick={() => signOut({ callbackUrl: "/" })}
                  type="button"
                >
                  <LogOut className="size-4" />
                </button>
              </>
            ) : (
              <Link
                className="rounded-md bg-slate-950 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                href="/login"
              >
                Login
              </Link>
            )}
            <button
              aria-label="Open menu"
              className="grid size-9 place-items-center rounded-md border border-slate-200 bg-white text-slate-600 shadow-sm md:hidden dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
              type="button"
            >
              <Menu className="size-4" />
            </button>
          </div>
        </div>

        <nav className="no-scrollbar mx-auto flex w-full max-w-7xl gap-2 overflow-x-auto px-4 pb-3 sm:px-6 md:hidden">
          {navItems.map((item) => (
            <Link
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300",
                pathname === item.href &&
                  "border-slate-950 text-slate-950 dark:border-white dark:text-white"
              )}
              href={item.href}
              key={item.href}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      {children}
    </div>
  );
}
