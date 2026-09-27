"use client";

import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";

const STARTERS = [
  "Who was Biddy Mason?",
  "What is the story of Allensworth, California?",
  "Tell me about Black firefighters in Los Angeles.",
];

export default function AskPage() {
  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: "/api/ask" }),
  });
  const [input, setInput] = useState("");

  const isLoading = status === "submitted" || status === "streaming";

  const ask = (text: string) => {
    if (!text.trim() || isLoading) return;
    sendMessage({ text });
    setInput("");
  };

  return (
    <div className="flex min-h-full flex-col bg-zinc-50 font-sans dark:bg-black">
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-12">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          Ask California Black Stories
        </h1>
        <p className="mt-2 max-w-xl text-zinc-600 dark:text-zinc-400">
          Answers come only from the California Black Stories knowledge base:
          150 fact-checked stories with per-claim sources. When sources
          disagree, you will see both accounts.
        </p>

        <div className="mt-8 flex flex-1 flex-col gap-4">
          {messages.length === 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                Try one:
              </p>
              <div className="flex flex-wrap gap-2">
                {STARTERS.map((q) => (
                  <button
                    key={q}
                    onClick={() => ask(q)}
                    disabled={isLoading}
                    className="rounded-full border border-zinc-300 px-4 py-2 text-sm text-zinc-700 transition-colors hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-[15px] leading-7 whitespace-pre-wrap ${
                  m.role === "user"
                    ? "bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900"
                    : "bg-white text-zinc-800 ring-1 ring-zinc-200 dark:bg-zinc-950 dark:text-zinc-200 dark:ring-zinc-800"
                }`}
              >
                {m.parts.map((part, i) =>
                  part.type === "text" ? (
                    <span key={i}>{part.text}</span>
                  ) : null,
                )}
              </div>
            </div>
          ))}

          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-white px-4 py-3 text-sm text-zinc-500 ring-1 ring-zinc-200 dark:bg-zinc-950 dark:text-zinc-400 dark:ring-zinc-800">
                Searching the knowledge base…
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200 dark:bg-red-950 dark:text-red-300 dark:ring-red-900">
              Something went wrong: {error.message}
            </div>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask(input);
          }}
          className="sticky bottom-0 mt-8 flex gap-2 bg-zinc-50 py-4 dark:bg-black"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about Black history in California…"
            className="h-12 flex-1 rounded-full border border-zinc-300 bg-white px-5 text-[15px] text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="h-12 rounded-full bg-zinc-900 px-6 text-[15px] font-medium text-zinc-50 transition-colors hover:bg-zinc-700 disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            Ask
          </button>
        </form>
      </main>
    </div>
  );
}
