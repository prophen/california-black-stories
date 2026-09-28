import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  stepCountIs,
  streamText,
  toUIMessageStream,
} from "ai";
import { openai } from "@ai-sdk/openai";
import { createMCPClient } from "@ai-sdk/mcp";

export const maxDuration = 60;

const SYSTEM_PROMPT = `You are the Ask California Black Stories assistant. You answer questions about Black history in California using only the California Black Stories knowledge base, a collection of fact-checked stories with per-claim source citations.

Rules:
1. Use the knowledge base tools for every factual claim. Never answer from your own training data, not even partially.
2. Cite your sources. Name the story each fact comes from and include the source URLs the tool returns.
3. If the knowledge base does not contain the answer, say so plainly and stop. Do not add background, context, or a summary from your own training data. A refusal followed by general-knowledge facts still violates this rule.
4. If sources disagree about a fact, present both accounts side by side with their sources instead of silently choosing one.
5. Keep answers focused and conversational: clear, direct, respectful.`;

export async function POST(req: Request) {
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
    let tools = allTools;
    let system = SYSTEM_PROMPT;
    if (outline) {
      const { initial_context: _outlineAlreadyInjected, ...rest } = allTools;
      tools = rest;
      system = `${SYSTEM_PROMPT}\n\n# Knowledge base outline\n${outline}`;
    }

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
