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
  return <div className="chat-root h-screen w-screen overflow-hidden">{children}</div>;
}
