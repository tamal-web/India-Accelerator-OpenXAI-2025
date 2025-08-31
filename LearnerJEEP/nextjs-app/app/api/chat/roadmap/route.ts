import { generateObject, streamObject, UIMessage } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { convertToModelMessages } from "ai";
import { uuidv4 } from "zod/v4";
export const config = { runtime: "edge" };

// Define your response schema
export const roadmapSchema = z.object({
  title: z.string(),
  description: z.string(),
  subtopics: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      sub_topics: z.array(z.string()),
    })
  ),
});

export type RoadmapT = z.infer<typeof roadmapSchema>;
const a = [];
const length: Number = a.length;
const openaiProvider = createOpenAI({
  apiKey: "lmstudio",
  baseURL: "http://127.0.0.1:1234/v1",
});

export async function POST(req: NextRequest) {
  const { modelName } = await req.json();
  const inputUser = req.headers.get("inputUser");

  const custom: UIMessage[] = [
    {
      id: "1",
      role: "user",
      parts: [
        {
          type: "text",
          text: `
    You are an expert educational curriculum designer and learning path architect whose role is to create comprehensive beginner- friendly learning roadmaps for any topic requested by the user.
Your task: when a user asks for a learning roadmap you must analyze the topic, structure it for beginners, group related concepts, ensure completeness, and provide clear descriptions for each section.
Learning path principles: always start with prerequisites, maintain logical flow, cover all major concepts, keep explanations beginner-friendly, and include practical applications where relevant.
Guidelines for subtopics: create four to eight main subtopics depending on the topic’s complexity, list three to six specific concepts under each subtopic, order subtopics from foundational to advanced, use descriptive titles that highlight progression, and make each subtopic a distinct learning milestone.
Guidelines for descriptions: the title description should explain what the topic is, its applications, and its benefits; each subtopic description should state the skills or knowledge gained; use clear encouraging language and avoid jargon in descriptions.
Quality standards: ensure the roadmap enables a motivated beginner to progress from zero knowledge to competence, order concepts logically so nothing depends on undiscovered ideas, include both theory and practice where helpful, and keep the progression achievable. 
,`,
        },
      ],
      metadata: {
        createdAt: new Date().toISOString(),
      },
    },
    {
      id: "2",
      role: "user",
      parts: [
        {
          type: "text",
          text: "Generate a roadmap on " + inputUser,
        },
      ],
      metadata: {
        createdAt: new Date().toISOString(),
      },
    },
  ];
  try {
    const m = convertToModelMessages(custom);
    const result = await streamObject({
      model: openaiProvider.chat(modelName || "dolphin3.0-llama3.1-8b"),
      messages: m,
      system:
        "You must respond only with valid JSON data following the specified schema. Do not include any explanatory text outside the JSON structure.",
      schema: roadmapSchema,
      abortSignal: req.signal,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Error in generateObject:", error);
    return NextResponse.json(
      { error: "Failed to generate response" },
      {
        status: 500,
      }
    );
  }
}
