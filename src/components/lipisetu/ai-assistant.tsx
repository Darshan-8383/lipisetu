"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import { Sparkles, X, Send, Trash2, Loader2, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAppStore } from "@/lib/store";
import {
  geminiChat,
  GeminiError,
  getApiKey,
  prettyModelName,
  type ChatTurn,
} from "@/lib/gemini";

const MD_COMPONENTS: Components = {
  p: (props) => <p className="my-1 leading-relaxed" {...props} />,
  ul: (props) => <ul className="my-1 list-disc space-y-0.5 pl-5" {...props} />,
  ol: (props) => <ol className="my-1 list-decimal space-y-0.5 pl-5" {...props} />,
  strong: (props) => <strong className="font-semibold" {...props} />,
  code: (props) => (
    <code className="rounded bg-background/70 px-1 py-0.5 text-[0.85em]" {...props} />
  ),
  a: (props) => (
    <a className="underline" target="_blank" rel="noreferrer noopener" {...props} />
  ),
  h1: (props) => <p className="my-1 font-semibold" {...props} />,
  h2: (props) => <p className="my-1 font-semibold" {...props} />,
  h3: (props) => <p className="my-1 font-semibold" {...props} />,
};

type Msg = ChatTurn & { id: number; error?: boolean };

const SUGGESTIONS = [
  "Explain this translation word by word",
  "What does “svasti śrī” mean?",
  "How do I photograph an inscription clearly?",
  "Teach me sandhi with a simple example",
];

const WELCOME: Msg = {
  id: 0,
  role: "assistant",
  text:
    "नमस्ते! 🙏 I'm your LipiSetu assistant. Ask me about Sanskrit grammar, inscription formulas, the text you're translating, or how to use the app.",
};

export function AiAssistant() {
  const { assistantContext, view, navigate } = useAppStore();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState<string | null>(null);
  const idRef = useRef(1);
  const endRef = useRef<HTMLDivElement>(null);
  const abortedRef = useRef(false);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading, open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const hasContext = !!(assistantContext?.sanskrit || assistantContext?.english);

  async function send(text: string) {
    const question = text.trim();
    if (!question || loading) return;
    abortedRef.current = false;

    const userMsg: Msg = { id: idRef.current++, role: "user", text: question };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      // Skip the static welcome message and any failed turns when calling the API.
      const history: ChatTurn[] = next
        .filter((m) => m.id !== 0 && !m.error)
        .map(({ role, text }) => ({ role, text }));
      const { reply, model: used } = await geminiChat(history, {
        ...assistantContext,
        view: assistantContext?.view ?? view,
      });
      if (abortedRef.current) return;
      setModel(used);
      setMessages((m) => [
        ...m,
        { id: idRef.current++, role: "assistant", text: reply },
      ]);
    } catch (e) {
      if (abortedRef.current) return;
      const msg =
        e instanceof GeminiError
          ? e.message
          : "Something went wrong. Please try again.";
      setMessages((m) => [
        ...m,
        { id: idRef.current++, role: "assistant", text: msg, error: true },
      ]);
    } finally {
      if (!abortedRef.current) setLoading(false);
    }
  }

  function clearChat() {
    abortedRef.current = true;
    setLoading(false);
    setMessages([WELCOME]);
  }

  const noKey = typeof window !== "undefined" && !getApiKey();

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open AI assistant"
          className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow-lg transition hover:scale-105 hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Sparkles className="h-5 w-5" />
          <span className="hidden sm:inline">Ask AI</span>
        </button>
      )}

      {open && (
        <div
          role="dialog"
          aria-label="LipiSetu AI assistant"
          className="fixed inset-x-3 bottom-3 z-50 flex h-[min(600px,calc(100vh-1.5rem))] flex-col overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-2xl sm:inset-x-auto sm:bottom-5 sm:right-5 sm:w-[400px]"
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-2 border-b bg-primary px-4 py-3 text-primary-foreground">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              <div className="leading-tight">
                <p className="text-sm font-semibold">LipiSetu Assistant</p>
                <p className="text-[11px] opacity-80">
                  {model ? prettyModelName(model) : "OCR"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={clearChat}
                aria-label="Clear conversation"
                className="rounded-md p-1.5 hover:bg-white/15"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close assistant"
                className="rounded-md p-1.5 hover:bg-white/15"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Context chip */}
          {hasContext && (
            <div className="border-b bg-muted/50 px-4 py-1.5 text-xs text-muted-foreground">
              ✓ I can see the inscription you&apos;re working on — just say
              &ldquo;this text&rdquo;.
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {noKey && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs">
                <KeyRound className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  No API key found.{" "}
                  <button
                    type="button"
                    className="font-medium underline"
                    onClick={() => {
                      setOpen(false);
                      navigate("profile");
                    }}
                  >
                    Add one in Profile → AI Engine
                  </button>
                  .
                </div>
              </div>
            )}

            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl px-3 py-2 text-sm ${
                    m.role === "user"
                      ? "rounded-br-sm bg-primary text-primary-foreground"
                      : m.error
                        ? "rounded-bl-sm border border-destructive/40 bg-destructive/10 text-destructive"
                        : "rounded-bl-sm bg-muted"
                  }`}
                >
                  {m.role === "assistant" && !m.error ? (
                    <div className="break-words">
                      <ReactMarkdown components={MD_COMPONENTS}>{m.text}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap break-words">{m.text}</p>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm bg-muted px-3 py-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Thinking…
                </div>
              </div>
            )}

            {messages.length === 1 && !loading && (
              <div className="flex flex-wrap gap-2 pt-1">
                {SUGGESTIONS.filter(
                  (s) => hasContext || !/this translation/i.test(s)
                ).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    className="rounded-full border bg-background px-3 py-1 text-xs hover:bg-muted"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Input */}
          <div className="flex items-end gap-2 border-t p-3">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              placeholder="Ask about Sanskrit, inscriptions, or this app…"
              rows={1}
              className="max-h-28 min-h-10 resize-none"
              aria-label="Message the assistant"
            />
            <Button
              type="button"
              size="icon"
              onClick={() => send(input)}
              disabled={loading || !input.trim()}
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
