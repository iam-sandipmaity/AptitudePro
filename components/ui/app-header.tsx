"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Brain, ChartColumnBig, NotebookPen, PlayCircle } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: Brain },
  { href: "/practice", label: "Practice", icon: PlayCircle },
  { href: "/test/create", label: "Custom Test", icon: NotebookPen },
  { href: "/results", label: "Results", icon: ChartColumnBig }
];

export function AppHeader() {
  const pathname = usePathname();

  return (
    <header className="nav-shell">
      <div className="page-shell nav-row">
        <Link href="/dashboard" className="brand">
          <span className="brand-mark">
            <Brain size={18} />
          </span>
          <span>AptitudePro</span>
        </Link>

        <nav className="nav-links">
          {links.map((link) => {
            const Icon = link.icon;
            const active = link.href === "/results" ? pathname.startsWith("/results") : pathname.startsWith(link.href);
            return (
              <Link key={link.href} href={link.href} className={cn("nav-link", active && "active")}>
                <Icon size={16} style={{ marginRight: 8 }} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <UserButton />
      </div>
    </header>
  );
}

