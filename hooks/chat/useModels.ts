"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface ModelInfo {
  id: string;
  object: string;
}

interface ModelResponse {
  data: ModelInfo[];
}

const FALLBACK_MODELS: ModelInfo[] = [
  { id: "claude-sonnet-4-5", object: "model" },
  { id: "gpt-4o", object: "model" },
  { id: "gpt-4o-mini", object: "model" },
  { id: "claude-3-opus", object: "model" },
  { id: "claude-3-haiku", object: "model" },
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
  const [models, setModels] = useState<ModelInfo[]>(FALLBACK_MODELS);
  const [selectedModel, setSelectedModelState] = useState<string>(
    () => loadStoredModel() || FALLBACK_MODELS[0].id
  );
  const [loading, setLoading] = useState(false);
  const fetchedRef = useRef(false);

  const setSelectedModel = useCallback((model: string) => {
    setSelectedModelState(model);
    saveStoredModel(model);
  }, []);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
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
            : FALLBACK_MODELS;
        setModels(list);
        const stored = loadStoredModel();
        if (!stored || !list.some((m) => m.id === stored)) {
          setSelectedModelState(list[0].id);
          saveStoredModel(list[0].id);
        }
      })
      .catch(() => {
        setModels(FALLBACK_MODELS);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [apiBaseUrl, apiKey]);

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
