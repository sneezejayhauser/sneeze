"use client";

import { useEffect, useState } from "react";
import { getSubdomainHref, type SubdomainKey } from "@/lib/subdomain";

interface NavItem {
  key: SubdomainKey;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { key: "home", label: "Home" },
  { key: "projects", label: "Projects" },
  { key: "lab", label: "Lab" },
  { key: "status", label: "Status" },
  { key: "links", label: "Links" },
  { key: "admin", label: "Admin" },
  { key: "chat", label: "Chat" },
  { key: "adie", label: "Adie" },
  { key: "nb", label: "Bot" },
];

interface NavbarProps {
  /** The subdomain of the current page, used to highlight the active item. */
  current: SubdomainKey;
}

export default function Navbar({ current }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  // Close mobile menu on route change / resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setMenuOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#030806]/60 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        {/* Logo */}
        <a
          href={getSubdomainHref("home")}
          className="text-lg font-bold tracking-tight text-white hover:text-amber-400 transition-colors"
        >
          cjhauser<span className="text-amber-400">.me</span>
        </a>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map(({ key, label }) => {
            const isActive = key === current;
            return (
              <a
                key={key}
                href={getSubdomainHref(key)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-amber-500/10 text-amber-400"
                    : "text-slate-300 hover:text-white hover:bg-white/5"
                }`}
              >
                {label}
              </a>
            );
          })}
        </nav>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-slate-300 hover:text-white p-2 rounded-md"
          aria-label="Toggle menu"
          onClick={() => setMenuOpen((o) => !o)}
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {menuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-white/10 px-4 pb-3 pt-2 space-y-1 bg-[#030806]/60 backdrop-blur-md">
          {NAV_ITEMS.map(({ key, label }) => {
            const isActive = key === current;
            return (
              <a
                key={key}
                href={getSubdomainHref(key)}
                onClick={() => setMenuOpen(false)}
                className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-amber-500/10 text-amber-400"
                    : "text-slate-300 hover:text-white hover:bg-white/5"
                }`}
              >
                {label}
              </a>
            );
          })}
        </div>
      )}
    </header>
  );
}
