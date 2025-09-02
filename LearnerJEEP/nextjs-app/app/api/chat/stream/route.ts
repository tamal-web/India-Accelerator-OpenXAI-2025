import { streamText, convertToModelMessages } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import type { NextRequest } from "next/server";

export const config = { runtime: "edge" };

const openaiProvider = createOpenAI({
  apiKey: "lmstudio",
  baseURL: "http://127.0.0.1:1234/v1",
});

export async function POST(req: NextRequest) {
  const { messages, modelName = true } = await req.json();
  console.log("Received messages:", JSON.stringify(messages, null, 2));

  const modelMessages = convertToModelMessages(messages);
  console.log("Converted messages:", JSON.stringify(modelMessages, null, 2));

  try {
    const result = streamText({
      model: openaiProvider.chat(modelName || "dolphin3.0-llama3.1-8b"),
      messages: modelMessages,
      abortSignal: req.signal,
    });
    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Error in text generation:", error);
    return new Response(JSON.stringify({ error: error }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
