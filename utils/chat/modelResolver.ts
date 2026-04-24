const POLLINATIONS_DEFAULT_MODEL = "openai";
const DEFAULT_OPENAI_COMPAT_MODEL = "openai/gpt-4o";

const POLLINATIONS_MODEL_ALIASES: Record<string, string> = {
  "openai/gpt-4o": "openai",
  "openai/gpt-4o-mini": "openai-fast",
  "gpt-4o": "openai",
  "gpt-4o-mini": "openai-fast",
  "claude-sonnet-4-5": "claude",
  "claude-3-opus": "claude-large",
  "claude-3-haiku": "claude-fast",
};

export function isPollinationsApiBaseUrl(apiBaseUrl: string): boolean {
  try {
    const parsed = new URL(apiBaseUrl);
    return parsed.hostname === "gen.pollinations.ai";
  } catch {
    return apiBaseUrl.includes("gen.pollinations.ai");
  }
}

export function getDefaultModelForProvider(apiBaseUrl: string): string {
  return isPollinationsApiBaseUrl(apiBaseUrl)
    ? POLLINATIONS_DEFAULT_MODEL
    : DEFAULT_OPENAI_COMPAT_MODEL;
}

export function normalizeModelForProvider(model: string, apiBaseUrl: string): string {
  const nextModel = model.trim();
  if (!nextModel) return getDefaultModelForProvider(apiBaseUrl);
  if (!isPollinationsApiBaseUrl(apiBaseUrl)) return nextModel;

  const aliasMatch = POLLINATIONS_MODEL_ALIASES[nextModel];
  if (aliasMatch) return aliasMatch;

  const basename = nextModel.includes("/") ? nextModel.split("/").pop() ?? nextModel : nextModel;
  return POLLINATIONS_MODEL_ALIASES[basename] ?? basename;
}

