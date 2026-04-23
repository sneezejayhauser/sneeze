import type { Metadata } from "next";
import "./chat.css";

export const metadata: Metadata = {
  title: "Chat — CJ Hauser",
  description: "AI chat interface",
};

export default function ChatLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-950 text-slate-100">
      {children}
    </div>
  );
}
