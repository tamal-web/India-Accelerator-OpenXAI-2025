// import { NextResponse } from "next/server";
// import OpenAI from "openai";

// export async function POST(req: Request) {
//   const { messages, model } = await req.json();

//   const openai = new OpenAI({
//     baseURL: "http://127.0.0.1:1234/v1/",
//     apiKey: "process.env.OPENAI_API_KEY",
//   });

//   const systemPrompt = {
//     role: "user",
//     content: "Generate a concise 2-4 word title summarizing the conversation.",
//   };

//   try {
//     const completion = await openai.chat.completions.create({
//       model: model,
//       messages: [...messages, systemPrompt],
//       temperature: 0.5,
//     });

//     let title = completion.choices[0].message?.content;
//     if (typeof title !== "string") {
//       throw new Error("No title generated");
//     }
//     title = title
//       .trim()
//       .replace(/[\n\r]/g, "")
//       .replace(/^["']|["']$/g, "");

//     return new NextResponse(title, {
//       status: 200,
//       headers: { "Content-Type": "text/plain" },
//     });
//   } catch (error) {
//     console.error("Error generating title:", error);
//     return new NextResponse("Failed to generate title", { status: 500 });
//   }
// }

import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
// import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
export const config = { runtime: "edge" };

const openaiProvider = createOpenAI({
  apiKey: "lmstudio",
  baseURL: "http://127.0.0.1:1234/v1",
});

export async function POST(req: NextRequest) {
  const { messages, modelName } = await req.json();

  console.log("Received messages:", JSON.stringify(messages, null, 2));

  // const modelMessages = convertToModelMessages(messages);
  // console.log("Converted messages:", JSON.stringify(modelMessages, null, 2));

  try {
    // if (streaming) {
    const result = await generateText({
      model: openaiProvider.chat(modelName || "dolphin3.0-llama3.1-8b"),
      system:
        // "Generate a concise title of 2-4 words as a topic for the conversation.",
        "Give a 2-4 word topic as a title for the conversation.",
      messages: messages,
      abortSignal: req.signal,
    });
    let title = result.text;
    if (typeof title !== "string") {
      throw new Error("No title generated");
    }
    const title2 = title
      .trim()
      .replace(/[\n\r]/g, "")
      .replace(/^["']|["']$/g, "");
    return new NextResponse(title2, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });

    // }
    // ... rest of your code
  } catch (error) {
    console.error("Error in streamText:", error);
    return new Response(JSON.stringify({ error: error }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
