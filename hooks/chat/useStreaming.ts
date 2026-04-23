"use client";

import { useCallback, useRef, useState } from "react";

interface StreamState {
  content: string;
  done: boolean;
  error: string | null;
}

export function useStreaming() {
  const [state, setState] = useState<StreamState>({
    content: "",
    done: true,
    error: null,
  });
  const abortRef = useRef<AbortController | null>(null);

  const startStream = useCallback(
    async (
      messages: Array<{ role: string; content: unknown }>,
      model: string,
      apiBaseUrl: string,
      apiKey: string
    ): Promise<string> => {
      setState({ content: "", done: false, error: null });

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch(`${apiBaseUrl}/v1/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages,
            stream: true,
          }),
          signal: controller.signal,
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No readable stream");

        const decoder = new TextDecoder("utf-8");
        let buffer = "";
        let accumulated = "";

        while (true) {
          const { done: rdDone, value } = await reader.read();
          if (rdDone) break;

          buffer += decoder.decode(value, { stream: true });
          const chunks = buffer.split("\n\n");
          buffer = chunks.pop() ?? "";

          for (const chunk of chunks) {
            const lines = chunk.split("\n");
            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed.startsWith("data: ")) continue;
              const data = trimmed.slice(6);
              if (data === "[DONE]") continue;
              try {
                const parsed = JSON.parse(data) as {
                  choices?: Array<{
                    delta?: { content?: string };
                  }>;
                };
                const text = parsed.choices?.[0]?.delta?.content ?? "";
                accumulated += text;
              } catch {
                // ignore malformed SSE
              }
            }
          }

          setState({ content: accumulated, done: false, error: null });
        }

        setState({ content: accumulated, done: true, error: null });
        return accumulated;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Something went wrong";
        if (message === "AbortError" || message.includes("aborted")) {
          setState((prev) => ({ ...prev, done: true }));
          return state.content;
        }
        setState({ content: state.content, done: true, error: message });
        return state.content;
      }
    },
    [state.content]
  );

  const abort = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  return { ...state, startStream, abort };
}
