"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getDefaultModelForProvider, isPollinationsApiBaseUrl } from "@/utils/chat/modelResolver";

export interface ModelInfo {
  id: string;
  object: string;
}

interface ModelResponse {
  data: ModelInfo[];
}

const OPENAI_COMPAT_FALLBACK_MODELS: ModelInfo[] = [
  { id: "openai/gpt-4o", object: "model" },
  { id: "openai/gpt-4o-mini", object: "model" },
  { id: "anthropic/claude-sonnet-4-5", object: "model" },
];

const POLLINATIONS_FALLBACK_MODELS: ModelInfo[] = [
  { id: "openai", object: "model" },
  { id: "openai-fast", object: "model" },
  { id: "claude", object: "model" },
  { id: "gemini", object: "model" },
];

const MODEL_KEY = "cui_model";
const CUSTOM_MODEL_KEY = "cui_custom_model";

function loadStoredModel(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(MODEL_KEY);
  } catch {
    return null;
  }
}

function saveStoredModel(model: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(MODEL_KEY, model);
  } catch {
    // silent fail
  }
}

export function useModels(apiBaseUrl: string, apiKey: string) {
  const fallbackModels = isPollinationsApiBaseUrl(apiBaseUrl)
    ? POLLINATIONS_FALLBACK_MODELS
    : OPENAI_COMPAT_FALLBACK_MODELS;
  const defaultModel = getDefaultModelForProvider(apiBaseUrl);

  const [models, setModels] = useState<ModelInfo[]>(fallbackModels);
  const [selectedModel, setSelectedModelState] = useState<string>(
    () => loadStoredModel() || defaultModel
  );
  const [loading, setLoading] = useState(false);
  const fetchedRef = useRef(false);

  const setSelectedModel = useCallback((model: string) => {
    setSelectedModelState(model);
    saveStoredModel(model);
  }, []);

  useEffect(() => {
    setLoading(true);

    fetch(`${apiBaseUrl}/v1/models`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to fetch models");
        const data = (await res.json()) as ModelResponse;
        const list =
          Array.isArray(data?.data) && data.data.length > 0
            ? data.data
            : fallbackModels;
        setModels(list);
        const stored = loadStoredModel();
        if (!stored || !list.some((m) => m.id === stored)) {
          const nextModel = list.find((m) => m.id === defaultModel)?.id ?? list[0].id;
          setSelectedModelState(nextModel);
          saveStoredModel(nextModel);
        }
      })
      .catch(() => {
        setModels(fallbackModels);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [apiBaseUrl, apiKey, defaultModel, fallbackModels]);

  const customModel =
    (typeof window !== "undefined" && localStorage.getItem(CUSTOM_MODEL_KEY)) ||
    "";

  const setCustomModel = useCallback((id: string) => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(CUSTOM_MODEL_KEY, id);
    } catch {
      // silent fail
    }
  }, []);

  return {
    models,
    selectedModel,
    setSelectedModel,
    loading,
    customModel,
    setCustomModel,
  };
}
