export type ToolName = "web_search" | "get_current_time" | "calculate" | "read_url";

export interface Tool {
  name: ToolName;
  description: string;
  parameters: Record<string, unknown>;
  execute: (args: Record<string, unknown>) => Promise<string>;
}

export interface ToolCallInfo {
  id: string;
  name: string;
  arguments: string;
}

export interface ToolRun {
  id: string;
  name: string;
  status: "running" | "done";
  label: string;
  inputPreview: string;
  result: string;
}

export interface ToolSettings {
  web_search: boolean;
  calculate: boolean;
  get_current_time: boolean;
  read_url: boolean;
}

interface DuckDuckGoTopic {
  Text?: string;
  Topics?: DuckDuckGoTopic[];
}

const CALCULATOR_WORDS = new Set([
  "sqrt",
  "abs",
  "floor",
  "ceil",
  "round",
  "min",
  "max",
  "pow",
]);

const CALCULATOR_REPLACEMENTS: Record<string, string> = {
  sqrt: "Math.sqrt",
  abs: "Math.abs",
  floor: "Math.floor",
  ceil: "Math.ceil",
  round: "Math.round",
  min: "Math.min",
  max: "Math.max",
  pow: "Math.pow",
};

function flattenTopics(topics: DuckDuckGoTopic[] = [], acc: DuckDuckGoTopic[] = []) {
  for (const topic of topics) {
    if (topic.Text) {
      acc.push(topic);
    }
    if (Array.isArray(topic.Topics)) {
      flattenTopics(topic.Topics, acc);
    }
  }
  return acc;
}

function sanitizeExpression(input: string): string | null {
  let expression = input.toLowerCase().replace(/,/g, "").trim();
  if (!expression) return null;

  expression = expression.replace(/(\d+(?:\.\d+)?)\s*%\s*of\s*/g, "($1/100)*");
  expression = expression.replace(/(\d+(?:\.\d+)?)\s*%/g, "($1/100)");

  if (!/^[\d\s+\-*/^%().,a-z]+$/i.test(expression)) {
    return null;
  }

  const words = expression.match(/[a-z_]+/g) ?? [];
  for (const word of words) {
    if (!CALCULATOR_WORDS.has(word)) {
      return null;
    }
  }

  expression = expression.replace(/\^/g, "**");

  for (const [word, replacement] of Object.entries(CALCULATOR_REPLACEMENTS)) {
    expression = expression.replace(new RegExp(`\\b${word}\\b`, "g"), replacement);
  }

  return expression;
}

export const DEFAULT_TOOL_SETTINGS: ToolSettings = {
  web_search: true,
  calculate: true,
  get_current_time: true,
  read_url: true,
};

export const TOOL_LIST: Tool[] = [
  {
    name: "web_search",
    description: "Search the web using DuckDuckGo and return concise top results.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The search query.",
        },
      },
      required: ["query"],
      additionalProperties: false,
    },
    execute: async (args) => {
      const query = typeof args.query === "string" ? args.query.trim() : "";
      if (!query) {
        return "Search unavailable — please try again.";
      }

      try {
        const res = await fetch(
          `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`
        );
        if (!res.ok) {
          return "Search unavailable — please try again.";
        }

        const data = (await res.json()) as {
          AbstractText?: string;
          Answer?: string;
          RelatedTopics?: DuckDuckGoTopic[];
        };

        const lines: string[] = [`Search results for: ${query}`];

        if (data.Answer) {
          lines.push(`Answer: ${data.Answer}`);
        }

        if (data.AbstractText) {
          lines.push(`Summary: ${data.AbstractText}`);
        }

        const related = flattenTopics(data.RelatedTopics ?? []).slice(0, 5);
        if (related.length > 0) {
          lines.push("Related topics:");
          related.forEach((topic, index) => {
            const text = topic.Text ?? "";
            const [title, ...rest] = text.split(" - ");
            const body = rest.join(" - ").trim();
            lines.push(`${index + 1}. ${title.trim()}${body ? `: ${body}` : ""}`);
          });
        }

        if (lines.length === 1) {
          lines.push("No instant results found.");
        }

        return lines.join("\n");
      } catch {
        return "Search unavailable — please try again.";
      }
    },
  },
  {
    name: "get_current_time",
    description: "Get the current local time, optionally in a specific IANA timezone.",
    parameters: {
      type: "object",
      properties: {
        timezone: {
          type: "string",
          description: "Optional IANA timezone, for example America/New_York.",
        },
      },
      additionalProperties: false,
    },
    execute: async (args) => {
      const timezone = typeof args.timezone === "string" && args.timezone.trim() ? args.timezone : undefined;
      try {
        return new Date().toLocaleString("en-US", {
          timeZone: timezone,
          dateStyle: "full",
          timeStyle: "long",
        });
      } catch {
        return new Date().toLocaleString("en-US", {
          dateStyle: "full",
          timeStyle: "long",
        });
      }
    },
  },
  {
    name: "calculate",
    description: "Evaluate a math expression safely.",
    parameters: {
      type: "object",
      properties: {
        expression: {
          type: "string",
          description: "A math expression to evaluate.",
        },
      },
      required: ["expression"],
      additionalProperties: false,
    },
    execute: async (args) => {
      const expression = typeof args.expression === "string" ? args.expression : "";
      const sanitized = sanitizeExpression(expression);
      if (!sanitized) {
        return "Error: invalid expression";
      }

      try {
        const value = Function(`"use strict"; return (${sanitized});`)();
        if (typeof value === "number" && Number.isFinite(value)) {
          return String(value);
        }
        if (typeof value === "string" || typeof value === "boolean") {
          return String(value);
        }
        return "Error: invalid expression";
      } catch {
        return "Error: invalid expression";
      }
    },
  },
  {
    name: "read_url",
    description: "Read and return text content from a URL.",
    parameters: {
      type: "object",
      properties: {
        url: {
          type: "string",
          description: "The full URL to read.",
        },
      },
      required: ["url"],
      additionalProperties: false,
    },
    execute: async (args) => {
      const url = typeof args.url === "string" ? args.url.trim() : "";
      if (!url) {
        return "Could not read URL: Invalid URL";
      }

      try {
        const res = await fetch(`https://r.jina.ai/${url}`);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const text = await res.text();
        return text.slice(0, 8000);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return `Could not read URL: ${message}`;
      }
    },
  },
];

export function parseToolArguments(rawArguments: string): Record<string, unknown> {
  if (!rawArguments.trim()) {
    return {};
  }

  try {
    const parsed = JSON.parse(rawArguments) as Record<string, unknown>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function getToolByName(name: string): Tool | undefined {
  return TOOL_LIST.find((tool) => tool.name === name);
}

export function getToolProgressLabel(name: string): string {
  switch (name) {
    case "web_search":
      return "Searching the web…";
    case "read_url":
      return "Reading URL…";
    case "calculate":
      return "Calculating…";
    case "get_current_time":
      return "Getting time…";
    default:
      return "Running tool…";
  }
}

export function getToolInputPreview(name: string, args: Record<string, unknown>): string {
  const fromValue = (value: unknown, fallback: string) => {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
    return fallback;
  };

  switch (name) {
    case "web_search":
      return fromValue(args.query, "(empty query)");
    case "read_url":
      return fromValue(args.url, "(empty url)");
    case "calculate":
      return fromValue(args.expression, "(empty expression)");
    case "get_current_time":
      return fromValue(args.timezone, "Local timezone");
    default:
      return "";
  }
}

export function toOpenAITools(tools: Tool[]) {
  return tools.map((tool) => ({
    type: "function" as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    },
  }));
}
