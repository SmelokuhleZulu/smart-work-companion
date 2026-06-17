import { createFileRoute } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { MessageSquare, Send, Trash2, Sparkles, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/page-header";
import { logActivity, storageKeys } from "@/lib/storage";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "AI Chat — Workplace AI" },
      { name: "description", content: "Chat with your AI workplace assistant." },
    ],
  }),
  component: ChatPage,
});

const SUGGESTIONS = [
  "Create a follow-up email to a client",
  "Summarize this document for me",
  "Plan my workday",
  "Prepare a meeting agenda",
];

function loadInitial(): UIMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(storageKeys.chat);
    return raw ? (JSON.parse(raw) as UIMessage[]) : [];
  } catch {
    return [];
  }
}

function ChatPage() {
  const [initial] = useState<UIMessage[]>(() => loadInitial());
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { messages, sendMessage, status, setMessages } = useChat({
    id: "main",
    messages: initial,
    transport: new DefaultChatTransport({ api: "/api/chat" }),
    onFinish: ({ message }) => {
      try {
        const next = [...messages, message];
        window.localStorage.setItem(storageKeys.chat, JSON.stringify(next));
      } catch {
        /* noop */
      }
      logActivity("chat", "AI chat message");
    },
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKeys.chat, JSON.stringify(messages));
    } catch {
      /* noop */
    }
  }, [messages]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, [status]);

  const isLoading = status === "submitted" || status === "streaming";

  async function submit(text: string) {
    if (!text.trim() || isLoading) return;
    setInput("");
    await sendMessage({ text: text.trim() });
  }

  function clearChat() {
    setMessages([]);
    try {
      window.localStorage.removeItem(storageKeys.chat);
    } catch {
      /* noop */
    }
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-7rem)] max-w-4xl flex-col">
      <PageHeader
        title="AI Chat"
        description="Your workplace AI assistant."
        icon={<MessageSquare className="h-5 w-5" />}
        actions={
          messages.length > 0 ? (
            <Button variant="outline" size="sm" onClick={clearChat}>
              <Trash2 className="mr-2 h-4 w-4" /> Clear
            </Button>
          ) : null
        }
      />

      <Card className="flex flex-1 flex-col overflow-hidden">
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl text-primary-foreground"
                style={{ background: "var(--gradient-primary)" }}
              >
                <Sparkles className="h-5 w-5" />
              </div>
              <h2 className="mt-4 text-lg font-semibold">How can I help you today?</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Ask anything about email, planning, research, or summarizing.
              </p>
              <div className="mt-6 grid w-full max-w-xl grid-cols-1 gap-2 sm:grid-cols-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => submit(s)}
                    className="rounded-md border border-border bg-card px-3 py-2 text-left text-sm transition-colors hover:border-primary/40 hover:bg-accent"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((m) => (
                <MessageBubble key={m.id} message={m} />
              ))}
              {status === "submitted" ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Thinking…
                </div>
              ) : null}
            </div>
          )}
        </div>
        <CardContent className="border-t pt-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit(input);
            }}
            className="flex items-end gap-2"
          >
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit(input);
                }
              }}
              rows={1}
              placeholder="Message your AI assistant…"
              className="min-h-[44px] resize-none"
            />
            <Button type="submit" disabled={!input.trim() || isLoading} size="icon">
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
          <p className="mt-2 text-xs text-muted-foreground">
            AI responses may be inaccurate. Verify important information.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function MessageBubble({ message }: { message: UIMessage }) {
  const isUser = message.role === "user";
  const text = message.parts
    .map((p) => (p.type === "text" ? p.text : ""))
    .join("");
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      {isUser ? (
        <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground">
          {text}
        </div>
      ) : (
        <div className="max-w-[90%] text-sm leading-relaxed">
          <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:font-semibold prose-p:my-2 prose-ul:my-2 prose-ol:my-2">
            <ReactMarkdown>{text || "…"}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}
