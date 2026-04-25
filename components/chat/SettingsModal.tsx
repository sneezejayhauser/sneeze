"use client";

import { useState, useEffect, useCallback } from "react";
import { useChatContext } from "@/context/ChatContext";
import { useConversations } from "@/hooks/chat/useConversations";
import { useTools } from "@/hooks/chat/useTools";
import type { ToolName, ToolSettings } from "@/utils/chat/tools";

interface SettingsModalProps {
  onClose: () => void;
}

const TOOL_OPTIONS: Array<{ key: ToolName; label: string }> = [
  { key: "web_search", label: "Web Search" },
  { key: "get_current_time", label: "Get Current Time" },
  { key: "calculate", label: "Calculator" },
  { key: "read_url", label: "Read URL" },
  { key: "read_skill", label: "Read Skill" },
  { key: "list_skills", label: "List Skills" },
  { key: "run_python", label: "Run Python" },
  { key: "run_bash", label: "Run Bash" },
  { key: "write_file", label: "Write File" },
];

export default function SettingsModal({ onClose }: SettingsModalProps) {
  const { apiBaseUrl, settings, setSettings, availableSkillIds } = useChatContext();
  const { clearAll } = useConversations();
  const { toolSettings, setToolSettings } = useTools();

  const [systemPrompt, setSystemPrompt] = useState(settings.systemPrompt);
  const [customModel, setCustomModel] = useState(settings.customModel);
  const [draftTools, setDraftTools] = useState<ToolSettings>(toolSettings);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleSave = useCallback(() => {
    setSettings({ systemPrompt, customModel });
    setToolSettings(draftTools);
    onClose();
  }, [systemPrompt, customModel, draftTools, setSettings, setToolSettings, onClose]);

  const handleClear = useCallback(async () => {
    await clearAll();
    setShowClearConfirm(false);
    onClose();
  }, [clearAll, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-md space-y-5 rounded-xl border border-[var(--chat-border2)] bg-[var(--chat-bg2)] p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--chat-text)]">Settings</h2>
          <button onClick={onClose} className="text-[var(--chat-text3)] transition-colors hover:text-[var(--chat-text)]">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="rounded-lg border border-[var(--chat-border)] bg-[var(--chat-bg)] px-3 py-2">
          <p className="text-xs uppercase tracking-wider text-[var(--chat-text3)]">API Config</p>
          <p className="mt-1 text-sm text-[var(--chat-text2)]">Base URL: {apiBaseUrl}</p>
          <p className="text-xs text-[var(--chat-text3)]">Configured on the server</p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--chat-text2)]">Custom Model ID</label>
          <input
            type="text"
            value={customModel}
            onChange={(event) => setCustomModel(event.target.value)}
            placeholder="e.g. my-custom-model"
            className="w-full rounded-lg border border-[var(--chat-border)] bg-[var(--chat-bg)] px-3 py-2 text-sm text-[var(--chat-text)] outline-none transition-colors focus:border-[var(--chat-border2)]"
          />
          <p className="mt-1 text-xs text-[var(--chat-text3)]">
            Appears in the model selector as &quot;Custom&quot;
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--chat-text2)]">System Prompt</label>
          <textarea
            value={systemPrompt}
            onChange={(event) => setSystemPrompt(event.target.value)}
            rows={4}
            placeholder="You are a helpful assistant."
            className="w-full resize-none rounded-lg border border-[var(--chat-border)] bg-[var(--chat-bg)] px-3 py-2 text-sm text-[var(--chat-text)] outline-none transition-colors focus:border-[var(--chat-border2)]"
          />
        </div>

        {availableSkillIds.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-medium text-[var(--chat-text2)]">Loaded Skills</p>
            <div className="flex flex-wrap gap-2 rounded-lg border border-[var(--chat-border)] bg-[var(--chat-bg)] p-3">
              {availableSkillIds.map((skillId) => (
                <span
                  key={skillId}
                  className="inline-flex items-center rounded-full bg-[var(--chat-accent)]/20 px-2.5 py-1 text-xs font-medium text-[var(--chat-accent)]"
                >
                  {skillId}
                </span>
              ))}
            </div>
          </div>
        )}

        <div>
          <p className="mb-2 text-sm font-medium text-[var(--chat-text2)]">Tools</p>
          <div className="space-y-1.5 rounded-lg border border-[var(--chat-border)] bg-[var(--chat-bg)] p-2">
            {TOOL_OPTIONS.map((tool) => (
              <label
                key={tool.key}
                className="flex cursor-pointer items-center justify-between rounded-md px-2 py-1.5 text-sm text-[var(--chat-text2)] transition-colors hover:bg-[var(--chat-bg3)]"
              >
                <span>{tool.label}</span>
                <input
                  type="checkbox"
                  checked={draftTools[tool.key]}
                  onChange={(event) =>
                    setDraftTools((prev) => ({
                      ...prev,
                      [tool.key]: event.target.checked,
                    }))
                  }
                  className="h-4 w-4 rounded border-[var(--chat-border2)] bg-[var(--chat-bg2)] accent-[var(--chat-accent)]"
                />
              </label>
            ))}
          </div>
        </div>

        <div className="border-t border-[var(--chat-border)] pt-4">
          {!showClearConfirm ? (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="text-sm text-[var(--chat-text2)] transition-colors hover:text-[var(--chat-text)]"
            >
              Clear all conversations
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-sm text-[var(--chat-text2)]">Are you sure?</span>
              <button
                onClick={handleClear}
                className="rounded-md bg-[var(--chat-accent)] px-3 py-1 text-xs font-medium text-[var(--chat-bg)] transition-colors hover:bg-[var(--chat-accent-hover)]"
              >
                Yes, clear
              </button>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="rounded-md bg-[var(--chat-bg3)] px-3 py-1 text-xs font-medium text-[var(--chat-text2)] transition-colors hover:text-[var(--chat-text)]"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-[var(--chat-border)] px-4 py-2 text-sm font-medium text-[var(--chat-text2)] transition-colors hover:bg-[var(--chat-bg3)] hover:text-[var(--chat-text)]"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="rounded-lg bg-[var(--chat-accent)] px-4 py-2 text-sm font-medium text-[var(--chat-bg)] transition-colors hover:bg-[var(--chat-accent-hover)]"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
