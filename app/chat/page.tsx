import { createClient } from "@/lib/supabase/server";
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
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  const isSupabaseConfigured = 
    !!process.env.NEXT_PUBLIC_SUPABASE_URL && 
    !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  const apiBaseUrl = process.env.API_BASE_URL || "https://api.anthropic.com";
  const apiKey = process.env.API_KEY || "";

  const defaultSystemPrompt = await readSystemPrompt();
  const skillsDir = getSkillsDirectory();
  const availableSkillIds = await scanSkillsDir(skillsDir);

  // Show login screen if Supabase is configured but user is not authenticated
  if (isSupabaseConfigured && !session) {
    return <LoginScreen />;
  }

  // Get user info for ChatApp
  const user = session?.user ?? null;

  return (
    <ChatApp
      apiBaseUrl={apiBaseUrl}
      apiKey={apiKey}
      defaultSystemPrompt={defaultSystemPrompt}
      availableSkillIds={availableSkillIds}
      user={user}
    />
  );
}