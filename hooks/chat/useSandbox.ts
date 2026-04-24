"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type SandboxStatus = "idle" | "creating" | "ready" | "error" | "destroying";

export interface SandboxExecResult {
  text?: string;
  logs?: {
    stdout: string[];
    stderr: string[];
  };
  error?: string;
}

export function useSandbox() {
  const [status, setStatus] = useState<SandboxStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [sandboxId, setSandboxId] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const createSandbox = useCallback(async (): Promise<string | null> => {
    setStatus("creating");
    setError(null);

    try {
      const response = await fetch("/chat/api/sandbox", { method: "POST" });
      const data = (await response.json()) as { sandboxId?: string | null; error?: string };
      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      setSandboxId(data.sandboxId ?? null);
      setStatus("ready");
      return data.sandboxId ?? "ephemeral";
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to initialize sandbox";
      setError(message);
      setStatus("error");
      return null;
    }
  }, []);

  const runCode = useCallback(
    async (code: string, language = "python"): Promise<SandboxExecResult> => {
      if (status === "idle" || status === "destroying") {
        const sandboxId = await createSandbox();
        if (!sandboxId) {
          return { error: "Failed to initialize sandbox" };
        }
      }

      try {
        const response = await fetch("/chat/api/sandbox/exec", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: language === "bash" ? "bash" : "python",
            code,
            language,
          }),
          signal: abortControllerRef.current?.signal,
        });

        if (!response.ok) {
          const data = (await response.json()) as { error?: string };
          return { error: data.error || `HTTP ${response.status}` };
        }

        const data = (await response.json()) as SandboxExecResult;

        return data;
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return { error: "Request aborted" };
        }
        const message = err instanceof Error ? err.message : "Execution failed";
        return { error: message };
      }
    },
    [status, createSandbox]
  );

  const runPython = useCallback(
    async (code: string): Promise<SandboxExecResult> => {
      return runCode(code, "python");
    },
    [runCode]
  );

  useEffect(() => {
    abortControllerRef.current = new AbortController();

    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  return {
    status,
    error,
    sandboxId,
    createSandbox,
    runCode,
    runPython,
  };
}
