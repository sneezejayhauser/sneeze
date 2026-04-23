"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type SandboxStatus = "idle" | "creating" | "ready" | "error" | "destroying";

export interface SandboxExecOptions {
  code?: string;
  path?: string;
  content?: string;
}

export type SandboxExecType = "bash" | "python" | "write_file" | "read_file" | "list_dir";

export interface SandboxExecResult {
  result: string;
  error?: string;
}

export function useSandbox() {
  const [status, setStatus] = useState<SandboxStatus>("idle");
  const [sandboxId, setSandboxId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const createSandbox = useCallback(async (): Promise<string | null> => {
    setStatus("creating");
    setError(null);

    try {
      const response = await fetch("/chat/api/sandbox", {
        method: "POST",
        signal: abortControllerRef.current?.signal,
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        const errorMsg = data.error || `HTTP ${response.status}`;
        setError(errorMsg);
        setStatus("error");
        return null;
      }

      const data = (await response.json()) as { sandboxId: string | null; error?: string };

      if (!data.sandboxId) {
        const errorMsg = data.error || "No sandbox ID returned";
        setError(errorMsg);
        setStatus("error");
        return null;
      }

      setSandboxId(data.sandboxId);
      setStatus("ready");
      return data.sandboxId;
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        setStatus("idle");
        return null;
      }
      const message = err instanceof Error ? err.message : "Failed to create sandbox";
      setError(message);
      setStatus("error");
      return null;
    }
  }, []);

  const exec = useCallback(
    async (
      type: SandboxExecType,
      options: SandboxExecOptions
    ): Promise<SandboxExecResult> => {
      let currentSandboxId = sandboxId;

      if (!currentSandboxId || status === "idle" || status === "destroying") {
        currentSandboxId = await createSandbox();
        if (!currentSandboxId) {
          return { result: "", error: "Failed to create sandbox" };
        }
      }

      try {
        const response = await fetch("/chat/api/sandbox/exec", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sandboxId: currentSandboxId,
            type,
            options,
          }),
          signal: abortControllerRef.current?.signal,
        });

        if (!response.ok) {
          const data = (await response.json()) as { error?: string };
          return { result: "", error: data.error || `HTTP ${response.status}` };
        }

        const data = (await response.json()) as { result?: string; error?: string };

        if (data.error) {
          return { result: "", error: data.error };
        }

        return { result: data.result || "", error: undefined };
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return { result: "", error: "Request aborted" };
        }
        const message = err instanceof Error ? err.message : "Execution failed";
        return { result: "", error: message };
      }
    },
    [sandboxId, status, createSandbox]
  );

  const runPython = useCallback(
    async (code: string): Promise<SandboxExecResult> => {
      return exec("python", { code });
    },
    [exec]
  );

  const runBash = useCallback(
    async (code: string): Promise<SandboxExecResult> => {
      return exec("bash", { code });
    },
    [exec]
  );

  const writeFile = useCallback(
    async (path: string, content: string): Promise<SandboxExecResult> => {
      return exec("write_file", { path, content });
    },
    [exec]
  );

  useEffect(() => {
    abortControllerRef.current = new AbortController();

    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  return {
    status,
    sandboxId,
    error,
    createSandbox,
    exec,
    runPython,
    runBash,
    writeFile,
  };
}
