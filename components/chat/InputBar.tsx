"use client";

import { useState, useRef, useCallback } from "react";
import type { Attachment } from "@/utils/chat/buildMessages";

interface InputBarProps {
  onSend: (text: string, attachments: Attachment[]) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function InputBar({ onSend, disabled, placeholder }: InputBarProps) {
  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [comingSoon, setComingSoon] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSend = useCallback(() => {
    if (disabled) return;
    const trimmed = text.trim();
    if (!trimmed && attachments.length === 0) return;
    onSend(trimmed, attachments);
    setText("");
    setAttachments([]);
  }, [text, attachments, onSend, disabled]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setAttachments((prev) => [
          ...prev,
          {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            dataUrl,
            name: file.name,
            type: file.type,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
    setPopoverOpen(false);
    if (fileRef.current) fileRef.current.value = "";
  }, []);

  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const showComingSoon = useCallback((label: string) => {
    setComingSoon(label);
    setTimeout(() => setComingSoon(null), 2000);
  }, []);

  return (
    <div className="border-t border-slate-800 bg-slate-950 px-4 py-3">
      {comingSoon && (
        <div className="mb-2 rounded-md bg-sky-500/20 px-3 py-1.5 text-xs text-sky-400 text-center">
          {comingSoon} — Coming soon
        </div>
      )}

      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {attachments.map((att) => (
            <div key={att.id} className="relative h-12 w-12 rounded-lg overflow-hidden border border-slate-700">
              <img src={att.dataUrl} alt={att.name} className="h-full w-full object-cover" />
              <button
                onClick={() => removeAttachment(att.id)}
                className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-bl bg-slate-900/80 text-slate-300 hover:text-white"
                aria-label="Remove attachment"
              >
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="chat-input-pill flex items-end gap-2 px-3 py-2">
        <div className="relative">
          <button
            onClick={() => setPopoverOpen((o) => !o)}
            className="rounded-full p-1.5 text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors"
            aria-label="Add attachment"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
          {popoverOpen && (
            <div className="absolute bottom-full left-0 mb-2 w-40 rounded-lg border border-slate-700/60 bg-slate-900 shadow-xl py-1 z-50">
              <button
                onClick={() => fileRef.current?.click()}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-300 hover:bg-slate-800/60 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                Attach file
              </button>
              <button
                onClick={() => {
                  setPopoverOpen(false);
                  showComingSoon("Take screenshot");
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-300 hover:bg-slate-800/60 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Take screenshot
              </button>
            </div>
          )}
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || "Message…"}
          rows={1}
          disabled={disabled}
          className="flex-1 resize-none bg-transparent py-1.5 text-sm text-white outline-none placeholder:text-slate-500 disabled:opacity-50"
          style={{ minHeight: "1.5rem", maxHeight: "8rem" }}
        />

        <button
          onClick={handleSend}
          disabled={disabled || (!text.trim() && attachments.length === 0)}
          className="rounded-full p-1.5 text-sky-400 hover:text-sky-300 hover:bg-sky-500/10 disabled:text-slate-600 disabled:hover:bg-transparent transition-colors"
          aria-label="Send"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
