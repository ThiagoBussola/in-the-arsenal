"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { apiFetch, authHeaders } from "../../lib/api";
import { SparklesIcon } from "../../icons";

interface AIWritingAssistantProps {
  content: string;
  getSelectedText: () => string;
  onInsert: (text: string) => void;
  accessToken: string | null;
}

type AIAction = "continue" | "improve" | "title" | "summarize";

const SYSTEM_PROMPTS: Record<AIAction, string> = {
  continue:
    "You are a writing assistant for a Flesh and Blood TCG blog. Continue writing the article naturally from where the author left off. Match the tone and style. Return ONLY the continuation text, no explanations.",
  improve:
    "You are a writing assistant. Improve the following text: make it more engaging, fix grammar, improve flow. Return ONLY the improved text, no explanations or preamble.",
  title:
    "You are a writing assistant for a Flesh and Blood TCG blog. Based on the article content, suggest a compelling title. Return ONLY the title text, nothing else.",
  summarize:
    "You are a writing assistant. Create a concise excerpt/summary (2-3 sentences) of the following article content. Return ONLY the summary, no explanations.",
};

export function AIWritingAssistant({
  content,
  getSelectedText,
  onInsert,
  accessToken,
}: AIWritingAssistantProps) {
  const t = useTranslations("blog.ai");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const execute = async (action: AIAction) => {
    if (!accessToken) return;
    setLoading(true);

    let userMessage = "";

    switch (action) {
      case "continue": {
        const last500 = content.slice(-500);
        userMessage = `Continue writing from here:\n\n${last500}`;
        break;
      }
      case "improve": {
        const selected = getSelectedText();
        if (!selected) {
          setLoading(false);
          return;
        }
        userMessage = `Improve this text:\n\n${selected}`;
        break;
      }
      case "title":
        userMessage = `Generate a title for this article:\n\n${content.slice(0, 1000)}`;
        break;
      case "summarize":
        userMessage = `Summarize this article:\n\n${content.slice(0, 2000)}`;
        break;
    }

    try {
      const data = await apiFetch<{ reply: string }>("/ai/chat", {
        method: "POST",
        headers: authHeaders(accessToken),
        body: JSON.stringify({
          message: userMessage,
          systemPrompt: SYSTEM_PROMPTS[action],
        }),
      });

      if (data.reply) {
        onInsert(data.reply);
      }
    } catch {
      // Silently fail — the user can retry
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  const actions: { key: AIAction; label: string; needsSelection?: boolean }[] = [
    { key: "continue", label: t("continueWriting") },
    { key: "improve", label: t("improveSelection"), needsSelection: true },
    { key: "title", label: t("generateTitle") },
    { key: "summarize", label: t("summarize") },
  ];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        disabled={loading}
        className="flex items-center gap-1.5 rounded-sm border border-crimson/30 bg-crimson/5 px-3 py-1.5 text-xs font-medium text-crimson-bright transition-all hover:border-crimson/50 hover:bg-crimson/10 disabled:opacity-50"
      >
        <SparklesIcon className="h-3.5 w-3.5" />
        {loading ? t("generating") : t("title")}
      </button>

      {open && !loading && (
        <div className="absolute right-0 top-full z-50 mt-1 w-56 overflow-hidden rounded-sm border border-surface-border bg-surface shadow-xl">
          {actions.map((action) => (
            <button
              key={action.key}
              type="button"
              onClick={() => execute(action.key)}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-muted transition-colors hover:bg-surface-raised hover:text-foreground"
            >
              <SparklesIcon className="h-3.5 w-3.5 text-crimson/60" />
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
