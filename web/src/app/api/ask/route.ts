import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  stepCountIs,
  streamText,
  toUIMessageStream,
} from "ai";
import { openai } from "@ai-sdk/openai";
import { createMCPClient } from "@ai-sdk/mcp";
import { client as sanityClient } from "@/sanity/lib/client";
import { rateLimit, clientIp, limitResponse } from "@/lib/rate-limit";
import { logQuestion } from "@/lib/db";

export const maxDuration = 60;

const SYSTEM_PROMPT = `You are the Ask California Black Stories assistant. You answer questions about Black history in California using only the California Black Stories knowledge base, a collection of fact-checked stories with per-claim source citations.

Rules:
1. Use the knowledge base tools for every factual claim. Never answer from your own training data, not even partially.
2. Cite your sources on every factual paragraph. Name the story each fact comes from, then link it with that story’s URLs from the "Story source URLs" section below, copied exactly as Markdown links. Only URLs from that section may appear in your answer: never invent, shorten, or guess a URL, and never use "#" or any placeholder link. Never cite with bare numbered labels like "Source 1" or "Source 2": every citation must show the story name and a real, clickable URL. If the story is not listed in that section, name it without linking.
3. If the knowledge base does not contain the answer, say so plainly and stop. Do not add background, context, or a summary from your own training data. A refusal followed by general-knowledge facts still violates this rule.
4. If sources disagree about a fact, present both accounts side by side with their sources instead of silently choosing one.
5. Keep answers focused and conversational: clear, direct, respectful.`;

// Pull the latest user question out of the UI message list for logging.
function lastUserQuestion(messages: unknown[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i] as {
      role?: string;
      parts?: Array<{ type: string; text?: string }>;
    };
    if (m?.role === "user" && Array.isArray(m.parts)) {
      const text = m.parts
        .filter((p) => p.type === "text")
        .map((p) => p.text ?? "")
        .join(" ")
        .trim();
      if (text) return text.slice(0, 500);
    }
  }
  return "";
}

export async function POST(req: Request) {
  // 20 questions per hour per visitor. Approximate on serverless, but stops
  // casual abuse from running up the OpenAI bill.
  if (!rateLimit(clientIp(req), 20, 60 * 60 * 1000)) {
    return limitResponse();
  }

  const mcpUrl = process.env.SANITY_CONTEXT_MCP_URL;
  const mcpToken = process.env.SANITY_CONTEXT_TOKEN;

  if (!mcpUrl || !mcpToken) {
    return new Response(
      "Server is missing SANITY_CONTEXT_MCP_URL or SANITY_CONTEXT_TOKEN.",
      { status: 500 },
    );
  }

  const headers = { Authorization: `Bearer ${mcpToken}` };

  let mcpClient;
  try {
    mcpClient = await createMCPClient({
      transport: { type: "http", url: mcpUrl, headers },
    });
  } catch (err) {
    console.error("Failed to connect to the Sanity Context MCP endpoint:", err);
    return new Response("Could not reach the knowledge base.", { status: 502 });
  }

  try {
    const { messages } = await req.json();

    const question = lastUserQuestion(messages);
    if (question) await logQuestion(question);

    // The KB outline, fetched once and injected so the model starts with the map.
    let outline = "";
    try {
      const res = await fetch(`${mcpUrl.replace(/\/$/, "")}/initial-context`, {
        headers,
      });
      if (res.ok) outline = await res.text();
    } catch {
      // Fall through; the model can call initial_context itself.
    }

    // The KB entries cite story titles but carry no URLs, so the real source
    // URLs are injected here. The model copies from this list, which proved
    // more reliable than a lookup tool it sometimes skipped.
    let sourceUrlSection = "";
    try {
      const stories = await sanityClient.fetch<
        Array<{ title: string; sourceUrls?: string[] }>
      >(`*[_type == "story"]{title, sourceUrls}`);
      const lines = stories
        .filter((s) => s.sourceUrls && s.sourceUrls.length > 0)
        .map((s) => `- ${s.title}: ${s.sourceUrls!.join(", ")}`);
      if (lines.length > 0) {
        sourceUrlSection = `\n\n## Story source URLs\nUse only these URLs when citing sources. Copy them exactly; never invent or guess a URL.\n${lines.join("\n")}`;
      }
    } catch {
      // Fall through; the model names stories without linking.
    }

    const allTools = await mcpClient.tools();
    let kbTools = allTools;
    let system = SYSTEM_PROMPT;
    if (outline) {
      const { initial_context: _outlineAlreadyInjected, ...rest } = allTools;
      kbTools = rest;
      system = `${SYSTEM_PROMPT}\n\n# Knowledge base outline\n${outline}`;
    }
    system = `${system}${sourceUrlSection}`;

    const tools = { ...kbTools };

    const result = streamText({
      model: openai(process.env.OPENAI_MODEL || "gpt-4o-mini"),
      system,
      messages: await convertToModelMessages(messages),
      tools,
      stopWhen: stepCountIs(5),
      onFinish: async () => {
        await mcpClient.close();
      },
    });

    return createUIMessageStreamResponse({
      stream: toUIMessageStream({ stream: result.stream, tools }),
    });
  } catch (err) {
    await mcpClient.close();
    throw err;
  }
}
