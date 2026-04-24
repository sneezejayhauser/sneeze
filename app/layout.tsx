import type { Metadata } from "next";
import { Analytics } from '@vercel/analytics/next';
import "./globals.css";

export const metadata: Metadata = {
  title: "CJ Hauser",
  description: "Personal developer ecosystem — cjhauser.me",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased dark">
      <body className="min-h-full flex flex-col bg-transparent text-slate-100 font-sans">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
