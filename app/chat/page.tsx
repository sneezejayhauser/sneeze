import { cookies } from "next/headers";
import LoginScreen from "@/components/chat/LoginScreen";
import ChatApp from "@/components/chat/ChatApp";

export default async function ChatPage() {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get("chat_auth");

  const expectedUser = process.env.CHAT_USERNAME ?? "";
  const expectedPass = process.env.CHAT_PASSWORD ?? "";

  const isAuthConfigured = expectedUser.length > 0 && expectedPass.length > 0;
  const isAuthenticated = authCookie?.value === "1";

  const apiBaseUrl = process.env.API_BASE_URL || "https://api.anthropic.com";
  const apiKey = process.env.API_KEY || "";

  if (isAuthConfigured && !isAuthenticated) {
    return <LoginScreen />;
  }

  return <ChatApp apiBaseUrl={apiBaseUrl} apiKey={apiKey} />;
}
