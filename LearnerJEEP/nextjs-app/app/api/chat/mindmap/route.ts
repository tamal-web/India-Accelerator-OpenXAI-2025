import { streamObject, UIMessage } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { convertToModelMessages } from "ai";

export const config = { runtime: "edge" };

// import { z } from "zod";

/**
 * Sub-node schema (title required, description optional)
 */
const SubNodeSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
});

/**
 * Raw node schema accepts either `sub_nodes` or `sub_node` (both optional).
 * Then we transform it so the output always has `sub_nodes: SubNode[]`.
 */
const NodeRawSchema = z
  .object({
    title: z.string(),
    description: z.string().optional(),
    sub_nodes: z.array(SubNodeSchema).optional(),
    // accept the typo variant as well
    sub_node: z.array(SubNodeSchema).optional(),
  })
  .transform(({ sub_nodes, sub_node, ...rest }) => ({
    ...rest,
    sub_nodes: sub_nodes ?? sub_node ?? [],
  }));

/**
 * Group (contains nodes)
 */
const GroupSchema = z.object({
  nodes: z.array(NodeRawSchema),
});

/**
 * Top-level MindMap schema
 */
export const MindMapSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  group: z.array(GroupSchema),
});

/**
 * Types
 */
export type SubNode = z.infer<typeof SubNodeSchema>;
export type Node = z.infer<typeof NodeRawSchema>; // Node will have `sub_nodes: SubNode[]`
export type Group = z.infer<typeof GroupSchema>;
export type MindMapData = z.infer<typeof MindMapSchema>;

/**
 * Example usage:
 *
 * const parsed = MindMapSchema.parse(demoData);
 * // `parsed` now has every node normalized to use `sub_nodes: SubNode[]`
 */

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
You are a concise mind-map creator.When the user names a topic, break it into up to four top-level groups that cover the whole subject. Under each group list the minimum number of specific nodes needed for comprehension.
For every item:
* Title: two-to-three words, no more.
* Description: one short, clear sentence.
* If the concept involves a standard formula, append the formula in parentheses after the description.
Maintain these rules exactly; give no extra text beyond the mind-map content itself.`,
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
      schema: MindMapSchema,
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
