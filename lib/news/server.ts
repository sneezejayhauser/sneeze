import { createClient } from "@supabase/supabase-js";
import { verifyPassword } from "@/lib/validation";

const SUPABASE_REQUEST_TIMEOUT_MS = 8000;

function resolveSupabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
}

function resolveSupabaseServiceKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;
}

function resolveSupabaseAnonKey() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.SUPABASE_ANON_KEY
  );
}

function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SUPABASE_REQUEST_TIMEOUT_MS);
  return fetch(input, { ...init, signal: controller.signal }).finally(() => clearTimeout(timer));
}

export function getNewsServiceClient() {
  const url = resolveSupabaseUrl();
  const serviceRoleKey = resolveSupabaseServiceKey();
  if (!url || !serviceRoleKey) {
    throw new Error("Supabase credentials not configured");
  }
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
    global: { fetch: fetchWithTimeout },
  });
}

export function getNewsAnonClient() {
  const url = resolveSupabaseUrl();
  const anonKey = resolveSupabaseAnonKey();
  if (!url || !anonKey) {
    throw new Error("Supabase credentials not configured");
  }
  return createClient(url, anonKey, {
    auth: { persistSession: false },
    global: { fetch: fetchWithTimeout },
  });
}

export function extractErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) return err.message;
  if (err && typeof err === "object") {
    const candidate = err as { message?: unknown; details?: unknown; hint?: unknown };
    if (typeof candidate.message === "string" && candidate.message) return candidate.message;
    if (typeof candidate.details === "string" && candidate.details) return candidate.details;
    if (typeof candidate.hint === "string" && candidate.hint) return candidate.hint;
  }
  if (typeof err === "string" && err) return err;
  return fallback;
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

interface AiResponsesApiResponse {
  output?: Array<{
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
}

function buildAiEndpointCandidates(baseUrlInput: string): string[] {
  const baseUrl = baseUrlInput.replace(/\/$/, "");

  if (baseUrl.endsWith("/chat/completions") || baseUrl.endsWith("/responses")) {
    return [baseUrl];
  }

  const chatPath = baseUrl.match(/\/v\d+$/) ? `${baseUrl}/chat/completions` : `${baseUrl}/v1/chat/completions`;
  const responsesPath = baseUrl.match(/\/v\d+$/) ? `${baseUrl}/responses` : `${baseUrl}/v1/responses`;
  return [chatPath, responsesPath];
}

export async function generateNewsAiText(messages: AiMessage[]): Promise<string> {
  const apiKey =
    process.env.OPENAI_API_KEY ??
    process.env.AI_API_KEY ??
    process.env.API_KEY ??
    process.env.OPENAIAPIKEY;
  if (!apiKey) {
    throw new Error(
      "AI API key is not configured. Set one of OPENAI_API_KEY, AI_API_KEY, API_KEY, or OPENAIAPIKEY",
    );
  }

  const baseUrl = process.env.AI_BASE_URL ?? process.env.API_BASE_URL ?? "https://api.openai.com/v1";
  const model = process.env.AI_MODEL ?? "gpt-4o-mini";
  const endpoints = buildAiEndpointCandidates(baseUrl);
  let lastError = "Unknown AI error";

  for (const endpoint of endpoints) {
    const isResponsesApi = endpoint.endsWith("/responses");
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        isResponsesApi
          ? {
              model,
              temperature: 0.3,
              input: messages.map((message) => ({
                role: message.role,
                content: [{ type: "input_text", text: message.content }],
              })),
            }
          : {
              model,
              temperature: 0.3,
              messages,
            },
      ),
    });

    if (!response.ok) {
      const payload = await response.text();
      lastError = `AI request failed (${response.status}) on ${endpoint}: ${payload}`;
      continue;
    }

    if (isResponsesApi) {
      const payload = (await response.json()) as AiResponsesApiResponse;
      const text = payload.output
        ?.flatMap((item) => item.content ?? [])
        .find((part) => part.type === "output_text" && typeof part.text === "string")
        ?.text?.trim();

      if (text) return text;
      lastError = `AI response was empty on ${endpoint}`;
      continue;
    }

    const payload = (await response.json()) as AiCompletionResponse;
    const text = payload.choices?.[0]?.message?.content?.trim();
    if (text) return text;

    lastError = `AI response was empty on ${endpoint}`;
  }

  throw new Error(lastError);
}
