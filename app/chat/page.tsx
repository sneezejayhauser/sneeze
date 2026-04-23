import { cookies } from "next/headers";
import { promises as fs } from "fs";
import path from "path";
import LoginScreen from "@/components/chat/LoginScreen";
import ChatApp from "@/components/chat/ChatApp";

function getSkillsDirectory(): string {
  return path.join(process.cwd(), "chat-config", "skills");
}

async function scanSkillsDir(dir: string): Promise<string[]> {
  const skillIds: string[] = [];

  try {
    await fs.access(dir);
  } catch {
    return skillIds;
  }

  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const skillMdPath = path.join(dir, entry.name, "SKILL.md");

        try {
          await fs.access(skillMdPath);
          skillIds.push(entry.name);
        } catch {
          // SKILL.md not found in this directory, skip
        }
      }
    }
  } catch {
    // ignore errors
  }

  return skillIds;
}

async function readSystemPrompt(): Promise<string> {
  const promptPath = path.join(process.cwd(), "chat-config", "system_prompt.txt");

  try {
    return await fs.readFile(promptPath, "utf-8");
  } catch {
    return "";
  }
}

export default async function ChatPage() {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get("chat_auth");

  const expectedUser = process.env.CHAT_USERNAME ?? "";
  const expectedPass = process.env.CHAT_PASSWORD ?? "";

  const isAuthConfigured = expectedUser.length > 0 && expectedPass.length > 0;
  const isAuthenticated = authCookie?.value === "1";

  const apiBaseUrl = process.env.API_BASE_URL || "https://api.anthropic.com";
  const apiKey = process.env.API_KEY || "";

  const defaultSystemPrompt = await readSystemPrompt();
  const skillsDir = getSkillsDirectory();
  const availableSkillIds = await scanSkillsDir(skillsDir);

  if (isAuthConfigured && !isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <ChatApp
      apiBaseUrl={apiBaseUrl}
      apiKey={apiKey}
      defaultSystemPrompt={defaultSystemPrompt}
      availableSkillIds={availableSkillIds}
    />
  );
}
