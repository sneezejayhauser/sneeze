import type { Metadata } from "next";
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
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100 font-sans">
        {children}
      </body>
    </html>
  );
}
