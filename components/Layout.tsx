import type { ReactNode } from "react";
import Navbar from "@/components/Navbar";
import type { SubdomainKey } from "@/lib/subdomain";

interface LayoutProps {
  children: ReactNode;
  /** Current subdomain — passed down so Navbar can highlight the active item. */
  subdomain: SubdomainKey;
}

export default function Layout({ children, subdomain }: LayoutProps) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar current={subdomain} />
      <main className="flex-1 mx-auto w-full max-w-5xl px-4 py-10">
        {children}
      </main>
      <footer className="border-t border-slate-800 py-6 text-center text-sm text-slate-500">
        <p>
          &copy; {new Date().getFullYear()} CJ Hauser &mdash;{" "}
          <a
            href="mailto:sneeze@cjhauser.me"
            className="hover:text-sky-400 transition-colors"
          >
            sneeze@cjhauser.me
          </a>
        </p>
      </footer>
    </div>
  );
}
