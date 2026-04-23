"use client";

import { useState, useRef, useCallback } from "react";
import type { Attachment } from "@/utils/chat/buildMessages";

interface InputBarProps {
  onSend: (text: string, attachments: Attachment[]) => void;
  disabled?: boolean;
  placeholder?: string;
  notice?: string | null;
}

export default function InputBar({ onSend, disabled, placeholder, notice }: InputBarProps) {
  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [comingSoon, setComingSoon] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const hasText = text.trim().length > 0;

  const handleSend = useCallback(() => {
    if (disabled) return;
    const trimmed = text.trim();
    if (!trimmed && attachments.length === 0) return;
    onSend(trimmed, attachments);
    setText("");
    setAttachments([]);
    setPopoverOpen(false);
  }, [text, attachments, onSend, disabled]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
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
    setAttachments((prev) => prev.filter((attachment) => attachment.id !== id));
  }, []);

  const showComingSoon = useCallback((label: string) => {
    setComingSoon(label);
    setTimeout(() => setComingSoon(null), 2000);
  }, []);

  return (
    <div className="border-t border-[var(--chat-border)] bg-[var(--chat-bg)] px-4 py-3 md:px-6">
      {comingSoon && (
        <div className="mb-2 rounded-md bg-[var(--chat-accent-dim)] px-3 py-1.5 text-center text-xs text-[var(--chat-text2)]">
          {comingSoon} — Coming soon
        </div>
      )}

      {attachments.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="relative h-12 w-12 overflow-hidden rounded-lg border border-[var(--chat-border)]"
            >
              <img src={attachment.dataUrl} alt={attachment.name} className="h-full w-full object-cover" />
              <button
                onClick={() => removeAttachment(attachment.id)}
                className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-bl bg-[var(--chat-bg)] text-[var(--chat-text3)] transition-colors hover:text-[var(--chat-text)]"
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

      <div className="chat-input-pill flex items-end gap-2 px-3 py-2.5">
        <div className="relative">
          <button
            onClick={() => setPopoverOpen((open) => !open)}
            className="rounded-full p-1.5 text-[var(--chat-text3)] transition-colors hover:text-[var(--chat-text2)]"
            aria-label="Add attachment"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>

          {popoverOpen && (
            <div className="absolute bottom-full left-0 z-50 mb-2 w-40 rounded-lg border border-[var(--chat-border)] bg-[var(--chat-bg2)] py-1 shadow-xl">
              <button
                onClick={() => fileRef.current?.click()}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[var(--chat-text2)] transition-colors hover:bg-[var(--chat-bg3)] hover:text-[var(--chat-text)]"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                  />
                </svg>
                Attach file
              </button>
              <button
                onClick={() => {
                  setPopoverOpen(false);
                  showComingSoon("Take screenshot");
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[var(--chat-text2)] transition-colors hover:bg-[var(--chat-bg3)] hover:text-[var(--chat-text)]"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Take screenshot
              </button>
            </div>
          )}
        </div>

        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || "Message…"}
          rows={1}
          disabled={disabled}
          className="flex-1 resize-none bg-transparent py-1.5 text-sm text-[var(--chat-text)] outline-none placeholder:text-[var(--chat-text3)] disabled:opacity-50"
          style={{ minHeight: "1.5rem", maxHeight: "8rem" }}
        />

        <button
          onClick={handleSend}
          disabled={disabled || (!hasText && attachments.length === 0)}
          className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--chat-text)] transition-[background-color] duration-[120ms] ease-out disabled:opacity-60"
          style={{
            backgroundColor: hasText ? "var(--chat-accent)" : "var(--chat-bg3)",
          }}
          aria-label="Send"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {notice && (
        <p className="mt-2 text-center text-[11px] text-[var(--chat-text3)]">{notice}</p>
      )}

      <p className="mt-2 text-center text-[11px] text-[var(--chat-text3)]">
        Claude is AI and can make mistakes. Please double-check responses.
      </p>

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
