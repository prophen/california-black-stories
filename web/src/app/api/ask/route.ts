import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  jsonSchema,
  stepCountIs,
  streamText,
  tool,
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
2. Cite your sources on every factual paragraph. Name the story each fact comes from, then call lookup_story_sources with the story's exact title and include the real URLs it returns as Markdown links. Copy URLs exactly as returned; never invent a URL and never use "#" or any placeholder link. Never cite with bare numbered labels like "Source 1" or "Source 2": every citation must show the story name and a real, clickable URL. If the lookup returns no URLs, name the story without linking.
3. If the knowledge base does not contain the answer, say so plainly and stop. Do not add background, context, or a summary from your own training data. A refusal followed by general-knowledge facts still violates this rule.
4. If sources disagree about a fact, present both accounts side by side with their sources instead of silently choosing one.
5. Keep answers focused and conversational: clear, direct, respectful.
6. End with the answer itself. Never close with a generic invitation like "let me know if you want more details" or "feel free to ask follow-up questions."`;

// The KB entries cite story titles but carry no URLs, so the model looks up
// the real source URLs from the Sanity dataset before answering.
const lookupStorySources = tool({
  description:
    "Look up the source URLs for a California Black Stories story by its exact title, as listed in the knowledge base Sources section. Call this for every story you cite, then include the returned URLs in your answer.",
  inputSchema: jsonSchema<{ title: string }>({
    type: "object",
    properties: {
      title: {
        type: "string",
        description: "The story's exact title",
      },
    },
    required: ["title"],
    additionalProperties: false,
  }),
  execute: async ({ title }) => {
    const stories = await sanityClient.fetch(
      `*[_type == "story" && title == $title]{title, sourceUrls}`,
      { title },
    );
    return stories;
  },
});

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

    const allTools = await mcpClient.tools();
    let kbTools = allTools;
    let system = SYSTEM_PROMPT;
    if (outline) {
      const { initial_context: _outlineAlreadyInjected, ...rest } = allTools;
      kbTools = rest;
      system = `${SYSTEM_PROMPT}\n\n# Knowledge base outline\n${outline}`;
    }

    const tools = { ...kbTools, lookup_story_sources: lookupStorySources };

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
