"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DEFAULT_TOOL_SETTINGS,
  TOOL_LIST,
  type Tool,
  type ToolName,
  type ToolSettings,
} from "@/utils/chat/tools";

const STORAGE_KEY = "cui_tools";
const listeners = new Set<() => void>();

function loadTools(): ToolSettings {
  if (typeof window === "undefined") {
    return DEFAULT_TOOL_SETTINGS;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return DEFAULT_TOOL_SETTINGS;
    }

    const parsed = JSON.parse(raw) as Partial<ToolSettings>;
    return {
      web_search: parsed.web_search ?? true,
      calculate: parsed.calculate ?? true,
      get_current_time: parsed.get_current_time ?? true,
      read_url: parsed.read_url ?? true,
      read_skill: parsed.read_skill ?? true,
      list_skills: parsed.list_skills ?? true,
      run_python: parsed.run_python ?? true,
      run_bash: parsed.run_bash ?? true,
      write_file: parsed.write_file ?? true,
    };
  } catch {
    return DEFAULT_TOOL_SETTINGS;
  }
}

function saveTools(settings: ToolSettings) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // silent fail
  }
}

function notify() {
  listeners.forEach((listener) => listener());
}

export function useTools() {
  const [toolSettings, setToolSettingsState] = useState<ToolSettings>(loadTools);

  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem(STORAGE_KEY)) {
      saveTools(DEFAULT_TOOL_SETTINGS);
    }

    const handleChange = () => {
      setToolSettingsState(loadTools());
    };

    listeners.add(handleChange);
    return () => {
      listeners.delete(handleChange);
    };
  }, []);

  const setToolSettings = useCallback((next: ToolSettings) => {
    setToolSettingsState(next);
    saveTools(next);
    notify();
  }, []);

  const setToolEnabled = useCallback((name: ToolName, enabled: boolean) => {
    setToolSettingsState((prev) => {
      const next = { ...prev, [name]: enabled };
      saveTools(next);
      notify();
      return next;
    });
  }, []);

  const enabledTools = useMemo<Tool[]>(() => {
    const order: ToolName[] = [
      "web_search",
      "calculate",
      "get_current_time",
      "read_url",
      "read_skill",
      "list_skills",
      "run_python",
      "run_bash",
      "write_file",
    ];
    return order
      .filter((name) => toolSettings[name])
      .map((name) => TOOL_LIST.find((tool) => tool.name === name))
      .filter((tool): tool is Tool => Boolean(tool));
  }, [toolSettings]);

  return {
    toolSettings,
    setToolSettings,
    setToolEnabled,
    enabledTools,
  };
}
