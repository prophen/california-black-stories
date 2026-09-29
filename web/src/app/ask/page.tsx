"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

const STARTERS = [
  "Who was Biddy Mason?",
  "What is the story of Allensworth, California?",
  "Tell me about Black firefighters in Los Angeles.",
];

const mdComponents: Components = {
  p: ({ children }) => (
    <p className="my-2 leading-7 first:mt-0 last:mb-0">{children}</p>
  ),
  h2: ({ children }) => (
    <h2 className="mt-4 mb-2 text-lg font-semibold text-zinc-950 first:mt-0 dark:text-zinc-50">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-3 mb-1 text-base font-semibold text-zinc-950 first:mt-0 dark:text-zinc-50">
      {children}
    </h3>
  ),
  ul: ({ children }) => (
    <ul className="my-2 list-disc space-y-1 pl-5">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="my-2 list-decimal space-y-1 pl-5">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-7">{children}</li>,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="font-medium break-words text-zinc-900 underline decoration-zinc-400 underline-offset-2 hover:decoration-zinc-700 dark:text-zinc-100 dark:decoration-zinc-500 dark:hover:decoration-zinc-300"
    >
      {children}
    </a>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-zinc-950 dark:text-zinc-50">
      {children}
    </strong>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-2 border-l-2 border-zinc-300 pl-3 text-zinc-600 italic dark:border-zinc-700 dark:text-zinc-400">
      {children}
    </blockquote>
  ),
  code: ({ children }) => (
    <code className="rounded bg-zinc-100 px-1 py-0.5 text-sm text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre className="my-2 overflow-x-auto rounded-lg bg-zinc-100 p-3 text-sm dark:bg-zinc-800">
      {children}
    </pre>
  ),
};

function AskChat() {
  const searchParams = useSearchParams();
  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: "/api/ask" }),
  });
  const [input, setInput] = useState("");
  const sentQueryRef = useRef(false);

  // Prefill from the landing page's sample questions (e.g. /ask?q=Who+was+...).
  useEffect(() => {
    const q = searchParams.get("q");
    if (q && !sentQueryRef.current && status === "ready") {
      sentQueryRef.current = true;
      sendMessage({ text: q });
    }
  }, [searchParams, status, sendMessage]);

  const isLoading = status === "submitted" || status === "streaming";

  const messageText = (m: (typeof messages)[number]) =>
    m.parts
      .filter((part) => part.type === "text")
      .map((part) => (part as { text: string }).text)
      .join("");

  const lastMessage = messages[messages.length - 1];
  const showTyping =
    isLoading &&
    (!lastMessage ||
      lastMessage.role === "user" ||
      !messageText(lastMessage));

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

          {messages.map((m) => {
            const text = messageText(m);
            const isUser = m.role === "user";
            if (!isUser && !text) return null;
            return (
              <div
                key={m.id}
                className={`flex ${isUser ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-[15px] ${
                    isUser
                      ? "bg-zinc-900 text-zinc-50 whitespace-pre-wrap dark:bg-zinc-100 dark:text-zinc-900"
                      : "bg-white text-zinc-800 ring-1 ring-zinc-200 dark:bg-zinc-950 dark:text-zinc-200 dark:ring-zinc-800"
                  }`}
                >
                  {isUser ? (
                    <span>{text}</span>
                  ) : (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={mdComponents}
                    >
                      {text}
                    </ReactMarkdown>
                  )}
                </div>
              </div>
            );
          })}

          {showTyping && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm text-zinc-500 ring-1 ring-zinc-200 dark:bg-zinc-950 dark:text-zinc-400 dark:ring-zinc-800">
                <span>Searching the knowledge base</span>
                <span className="flex gap-1" aria-hidden="true">
                  <span
                    className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 dark:bg-zinc-500"
                    style={{ animationDelay: "0ms" }}
                  />
                  <span
                    className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 dark:bg-zinc-500"
                    style={{ animationDelay: "150ms" }}
                  />
                  <span
                    className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 dark:bg-zinc-500"
                    style={{ animationDelay: "300ms" }}
                  />
                </span>
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

export default function AskPage() {
  return (
    <Suspense>
      <AskChat />
    </Suspense>
  );
}
