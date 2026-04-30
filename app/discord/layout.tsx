import type { Metadata } from "next";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Discord DM - CJ Hauser",
  description: "Discord DM client",
};

export default async function DiscordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased dark">
      <body className="min-h-full flex flex-col bg-transparent text-slate-100 font-sans">
        {children}
      </body>
    </html>
  );
}