import { NextResponse } from "next/server";
import OpenAI from "openai";

const lm = new OpenAI({
  apiKey: "lm-studio",
  baseURL: "http://127.0.0.1:1234/v1",
});

export async function GET() {
  const res = await lm.models.list();
  return NextResponse.json({ output: res.data });
}
