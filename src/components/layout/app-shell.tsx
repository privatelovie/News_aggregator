"use client";

import {
  Bookmark,
  Home,
  LogOut,
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
        "min-h-screen bg-[#f4f0ff] p-2 text-slate-950 sm:p-4 dark:bg-[#050505] dark:text-white",
        isDark && "dark"
      )}
    >
      <div className="mx-auto min-h-[calc(100vh-1rem)] max-w-[92rem] overflow-hidden rounded-[1.75rem] border-[6px] border-black bg-[#f8f5ff] shadow-[0_24px_80px_rgba(0,0,0,0.28)] dark:bg-slate-950">
        <header className="sticky top-2 z-40 bg-black px-3 py-3 text-white sm:top-4 sm:px-5">
          <div className="mx-auto flex min-h-14 w-full max-w-[86rem] items-center justify-between gap-3">
          <Link className="flex items-center gap-2 text-lg font-black tracking-tight" href="/">
            <span className="grid size-9 place-items-center rounded-md bg-white text-black shadow-sm">
              <Newspaper className="size-5" />
            </span>
            <span>Neural News</span>
          </Link>

          <nav className="hidden items-center gap-2 md:flex">
            {navItems.map((item) => (
              <Link
                className={cn(
                  "flex items-center gap-2 rounded-full border-2 border-white/30 px-5 py-2 text-sm font-semibold text-white transition hover:border-white hover:bg-white hover:text-black",
                  pathname === item.href &&
                    "border-[#ffd24a] bg-[#ffd24a] text-black shadow-[0_0_0_3px_rgba(255,210,74,0.25)]"
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
              className="hidden min-w-52 items-center gap-2 rounded-full border-2 border-white/30 bg-black px-4 py-2 text-sm text-white transition hover:border-white lg:flex"
              href="/search"
            >
              <Search className="size-4" />
              Search news
            </Link>
            <Link
              aria-label="Search"
              className="grid size-10 place-items-center rounded-full border-2 border-white/30 bg-black text-white transition hover:border-white lg:hidden"
              href="/search"
            >
              <Search className="size-4" />
            </Link>
            <button
              aria-label="Toggle dark mode"
              className="grid size-10 place-items-center rounded-full border-2 border-white/30 bg-black text-white transition hover:border-white"
              onClick={toggleTheme}
              type="button"
            >
              {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
            {isAuthenticated ? (
              <>
                <Link
                  aria-label="Profile"
                  className="hidden size-10 place-items-center rounded-full border-2 border-white/30 bg-black text-white transition hover:border-white sm:grid"
                  href="/profile"
                  title={session.user?.email ?? "Profile"}
                >
                  <User className="size-4" />
                </Link>
                <button
                  aria-label="Sign out"
                  className="grid size-10 place-items-center rounded-full bg-[#ffd24a] text-black shadow-sm transition hover:bg-white"
                  onClick={() => signOut({ callbackUrl: "/" })}
                  type="button"
                >
                  <LogOut className="size-4" />
                </button>
              </>
            ) : (
              <Link
                className="rounded-full bg-[#ffd24a] px-5 py-2 text-sm font-bold text-black shadow-sm transition hover:bg-white"
                href="/login"
              >
                Login
              </Link>
            )}
          </div>
        </div>

        <nav className="no-scrollbar mx-auto flex w-full max-w-[86rem] gap-2 overflow-x-auto pb-1 pt-3 md:hidden">
          {navItems.map((item) => (
            <Link
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-full border-2 border-white/30 px-4 py-2 text-sm font-semibold text-white",
                pathname === item.href &&
                  "border-[#ffd24a] bg-[#ffd24a] text-black"
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
    </div>
  );
}
