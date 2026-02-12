"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AppHeader() {
  const pathname = usePathname();

  const brandLinkClassName =
    "text-sm font-semibold text-zinc-900 hover:text-zinc-700 dark:text-zinc-50 dark:hover:text-zinc-200";

    const linkClassName =
    "text-zinc-200 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-500 bg-zinc-500 hover:bg-zinc-300 py-1 px-3 rounded-md";

  if (pathname === "/login") return null;

  return (
    <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-black">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
        <Link
          href="/dashboard"
          className={brandLinkClassName}
        >
          かんたんBIツール
        </Link>

        <nav className="flex items-center gap-3 text-sm">
          <Link
            href="/dashboard"
            className={linkClassName}
          >
            ダッシュボードリスト
          </Link>
          <Link
            href="/queries"
            className={linkClassName}
          >
            クエリ
          </Link>
          <Link
            href="/csv"
            className={linkClassName}
          >
            CSV
          </Link>
        </nav>
      </div>
    </header>
  );
}
