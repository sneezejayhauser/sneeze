"use client";

import { useState, useEffect, useCallback } from "react";
import { useChatContext } from "@/context/ChatContext";
import { useConversations } from "@/hooks/chat/useConversations";

interface SettingsModalProps {
  onClose: () => void;
}

export default function SettingsModal({ onClose }: SettingsModalProps) {
  const { apiBaseUrl, settings, setSettings } = useChatContext();
  const { clearAll } = useConversations();
  const [systemPrompt, setSystemPrompt] = useState(settings.systemPrompt);
  const [customModel, setCustomModel] = useState(settings.customModel);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleSave = useCallback(() => {
    setSettings({ systemPrompt, customModel });
    onClose();
  }, [systemPrompt, customModel, setSettings, onClose]);

  const handleClear = useCallback(() => {
    clearAll();
    setShowClearConfirm(false);
    onClose();
  }, [clearAll, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-xl border border-slate-700/60 bg-slate-900 shadow-2xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Settings</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="rounded-lg border border-slate-700/60 bg-slate-800/40 px-3 py-2">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">API Config</p>
          <p className="mt-1 text-sm text-slate-300">Base URL: {apiBaseUrl}</p>
          <p className="text-xs text-slate-500">Configured on the server</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Custom Model ID
          </label>
          <input
            type="text"
            value={customModel}
            onChange={(e) => setCustomModel(e.target.value)}
            placeholder="e.g. my-custom-model"
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-sky-500 transition-colors"
          />
          <p className="mt-1 text-xs text-slate-500">
            Appears in the model selector as &quot;Custom&quot;
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            System Prompt
          </label>
          <textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            rows={4}
            placeholder="You are a helpful assistant."
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-sky-500 transition-colors resize-none"
          />
        </div>

        <div className="border-t border-slate-800 pt-4">
          {!showClearConfirm ? (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="text-sm text-red-400 hover:text-red-300 transition-colors"
            >
              Clear all conversations
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-300">Are you sure?</span>
              <button
                onClick={handleClear}
                className="rounded-md bg-red-500 px-3 py-1 text-xs font-medium text-white hover:bg-red-600 transition-colors"
              >
                Yes, clear
              </button>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="rounded-md bg-slate-700 px-3 py-1 text-xs font-medium text-slate-200 hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-600 transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
