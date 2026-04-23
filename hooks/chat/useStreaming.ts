"use client";

import { useCallback, useRef, useState } from "react";
import {
  getToolByName,
  getToolInputPreview,
  getToolProgressLabel,
  parseToolArguments,
  toOpenAITools,
  type Tool,
  type ToolCallInfo,
  type ToolRun,
} from "@/utils/chat/tools";

interface StreamState {
  content: string;
  done: boolean;
  error: string | null;
  toolRuns: ToolRun[];
  toolsUnavailableNote: string | null;
}

interface StreamChoice {
  delta?: {
    content?: string;
    tool_calls?: Array<{
      index?: number;
      id?: string;
      function?: {
        name?: string;
        arguments?: string;
      };
    }>;
  };
  finish_reason?: string | null;
}

interface StreamCompletionResult {
  content: string;
  finishReason: string | null;
  toolCalls: ToolCallInfo[];
  status: number;
}

interface StartStreamResult {
  content: string;
  toolRuns: ToolRun[];
}

function parseSseLines(chunk: string): string[] {
  return chunk
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("data: "))
    .map((line) => line.slice(6))
    .filter((line) => line !== "[DONE]");
}

export function useStreaming() {
  const [state, setState] = useState<StreamState>({
    content: "",
    done: true,
    error: null,
    toolRuns: [],
    toolsUnavailableNote: null,
  });

  const abortRef = useRef<AbortController | null>(null);
  const contentRef = useRef("");

  const streamCompletion = useCallback(
    async (
      messages: Array<Record<string, unknown>>,
      model: string,
      apiBaseUrl: string,
      apiKey: string,
      tools: Tool[]
    ): Promise<StreamCompletionResult> => {
      const controller = abortRef.current;
      if (!controller) {
        throw new Error("No active request");
      }

      const body: Record<string, unknown> = {
        model,
        messages,
        stream: true,
      };

      if (tools.length > 0) {
        body.tools = toOpenAITools(tools);
      }

      const res = await fetch(`${apiBaseUrl}/v1/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!res.ok) {
        return {
          content: "",
          finishReason: null,
          toolCalls: [],
          status: res.status,
        };
      }

      const reader = res.body?.getReader();
      if (!reader) {
        throw new Error("No readable stream");
      }

      const decoder = new TextDecoder("utf-8");
      let buffer = "";
      let accumulated = "";
      let finishReason: string | null = null;
      const toolCallMap = new Map<number, ToolCallInfo>();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split("\n\n");
        buffer = chunks.pop() ?? "";

        for (const chunk of chunks) {
          const lines = parseSseLines(chunk);
          for (const line of lines) {
            try {
              const parsed = JSON.parse(line) as { choices?: StreamChoice[] };
              const choice = parsed.choices?.[0];
              if (!choice) continue;

              const nextContent = choice.delta?.content ?? "";
              if (nextContent) {
                accumulated += nextContent;
              }

              if (Array.isArray(choice.delta?.tool_calls)) {
                for (const incomingToolCall of choice.delta.tool_calls) {
                  const index = incomingToolCall.index ?? 0;
                  const current =
                    toolCallMap.get(index) ??
                    ({
                      id: incomingToolCall.id ?? `tool-${index}`,
                      name: incomingToolCall.function?.name ?? "",
                      arguments: "",
                    } satisfies ToolCallInfo);

                  if (incomingToolCall.id) {
                    current.id = incomingToolCall.id;
                  }
                  if (incomingToolCall.function?.name) {
                    current.name = incomingToolCall.function.name;
                  }
                  if (incomingToolCall.function?.arguments) {
                    current.arguments += incomingToolCall.function.arguments;
                  }

                  toolCallMap.set(index, current);
                }
              }

              if (choice.finish_reason) {
                finishReason = choice.finish_reason;
              }
            } catch {
              // ignore malformed SSE lines
            }
          }
        }

        contentRef.current = accumulated;
        setState((prev) => ({ ...prev, content: accumulated, done: false, error: null }));
      }

      const toolCalls = [...toolCallMap.entries()]
        .sort((a, b) => a[0] - b[0])
        .map(([, value]) => value);

      return {
        content: accumulated,
        finishReason: finishReason ?? (toolCalls.length > 0 ? "tool_calls" : null),
        toolCalls,
        status: res.status,
      };
    },
    []
  );

  const startStream = useCallback(
    async (
      messages: Array<{ role: string; content: unknown }>,
      model: string,
      apiBaseUrl: string,
      apiKey: string,
      tools: Tool[]
    ): Promise<StartStreamResult> => {
      setState({
        content: "",
        done: false,
        error: null,
        toolRuns: [],
        toolsUnavailableNote: null,
      });
      contentRef.current = "";

      const controller = new AbortController();
      abortRef.current = controller;

      const workingMessages = [...messages] as Array<Record<string, unknown>>;
      const completedToolRuns: ToolRun[] = [];
      let activeTools = [...tools];

      try {
        while (true) {
          setState((prev) => ({ ...prev, content: "", done: false }));
          contentRef.current = "";

          const completion = await streamCompletion(
            workingMessages,
            model,
            apiBaseUrl,
            apiKey,
            activeTools
          );

          if (completion.status === 400 && activeTools.length > 0) {
            activeTools = [];
            setState((prev) => ({
              ...prev,
              toolsUnavailableNote: "Tools unavailable for this model",
            }));
            continue;
          }

          if (completion.status >= 400) {
            throw new Error(`HTTP ${completion.status}`);
          }

          if (
            completion.finishReason === "tool_calls" &&
            completion.toolCalls.length > 0 &&
            activeTools.length > 0
          ) {
            workingMessages.push({
              role: "assistant",
              content: completion.content,
              tool_calls: completion.toolCalls.map((toolCall) => ({
                id: toolCall.id,
                type: "function",
                function: {
                  name: toolCall.name,
                  arguments: toolCall.arguments,
                },
              })),
            });

            for (const toolCall of completion.toolCalls) {
              const args = parseToolArguments(toolCall.arguments);
              const inputPreview = getToolInputPreview(toolCall.name, args);
              const runningTool: ToolRun = {
                id: toolCall.id,
                name: toolCall.name,
                status: "running",
                label: getToolProgressLabel(toolCall.name),
                inputPreview,
                result: "",
              };

              setState((prev) => ({
                ...prev,
                content: "",
                toolRuns: [...prev.toolRuns, runningTool],
              }));

              const tool = getToolByName(toolCall.name);
              const result = tool
                ? await tool.execute(args)
                : `Could not run tool: ${toolCall.name}`;

              const doneTool: ToolRun = {
                ...runningTool,
                status: "done",
                result,
              };

              completedToolRuns.push(doneTool);

              setState((prev) => ({
                ...prev,
                toolRuns: prev.toolRuns.map((item) =>
                  item.id === doneTool.id ? doneTool : item
                ),
              }));

              workingMessages.push({
                role: "tool",
                tool_call_id: toolCall.id,
                content: result,
              });
            }

            continue;
          }

          setState((prev) => ({
            ...prev,
            content: completion.content,
            done: true,
            error: null,
          }));

          return {
            content: completion.content,
            toolRuns: completedToolRuns,
          };
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Something went wrong";

        if (controller.signal.aborted || message.includes("AbortError") || message.includes("aborted")) {
          setState((prev) => ({ ...prev, done: true }));
          return {
            content: contentRef.current,
            toolRuns: completedToolRuns,
          };
        }

        setState((prev) => ({
          ...prev,
          done: true,
          error: message,
        }));

        return {
          content: contentRef.current,
          toolRuns: completedToolRuns,
        };
      }
    },
    [streamCompletion]
  );

  const abort = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  return { ...state, startStream, abort };
}
