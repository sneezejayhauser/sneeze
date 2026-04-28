import { createClient } from "@supabase/supabase-js";
import { verifyPassword } from "@/lib/validation";

export function getNewsServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("Supabase credentials not configured");
  }
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
}

export function isValidNewsAdminPassword(provided: unknown): boolean {
  if (typeof provided !== "string") return false;
  return verifyPassword(provided, process.env.NEWS_ADMIN_PASSWORD ?? "");
}

interface AiMessage {
  role: "system" | "user";
  content: string;
}

interface AiCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
}

export async function generateNewsAiText(messages: AiMessage[]): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY ?? process.env.AI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY (or AI_API_KEY) is not configured");
  }

  const baseUrl = (process.env.AI_BASE_URL ?? "https://api.openai.com/v1").replace(/\/$/, "");
  const model = process.env.AI_MODEL ?? "gpt-4o-mini";

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.3,
      messages,
    }),
  });

  if (!response.ok) {
    const payload = await response.text();
    throw new Error(`AI request failed (${response.status}): ${payload}`);
  }

  const payload = (await response.json()) as AiCompletionResponse;
  const text = payload.choices?.[0]?.message?.content?.trim();
  if (!text) {
    throw new Error("AI response was empty");
  }
  return text;
}
