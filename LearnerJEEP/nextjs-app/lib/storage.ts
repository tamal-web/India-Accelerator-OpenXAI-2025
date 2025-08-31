// Updated imports for v5
import { UIMessage } from "ai";
import { chatDB, ChatMessage3 } from "./db3";
import { MSG3, msgDB } from "./db3";
import { roadmapDB, RoadMap } from "./db3";
import { RoadmapT } from "@/app/api/chat/roadmap/route";
import { v4 as uuidv4 } from "uuid";

// Helper function to extract text content from UIMessage parts
function extractTextContent(message: UIMessage): string {
  if (!message.parts) return "";

  const textParts = message.parts
    .filter((part: any) => part.type === "text")
    .map((part: any) => part.text)
    .filter(Boolean);

  return textParts.join(" ");
}

// Helper function to get createdAt timestamp (with fallback to current time)
function getMessageTimestamp(message: UIMessage): Date {
  // Try to get timestamp from metadata if it exists
  if (message.metadata && typeof message.metadata === "object") {
    const metadata = message.metadata as any;
    if (metadata.createdAt) {
      return new Date(metadata.createdAt);
    }
  }

  // Fallback to current time
  return new Date();
}

export async function saveRoadmap(chatId: string, roadmap: RoadmapT) {
  try {
    await roadmapDB.roadmap.add({
      id: uuidv4(),
      chatId: chatId,
      roadmap: roadmap,
    });
  } catch {
    console.log("📍📍error");
  }
}

export async function loadRoadmapsFromChatId(chatId: string) {
  const a = await roadmapDB.roadmap.where("chatId").equals(chatId).toArray();
  return a.map((item) => {
    return item.roadmap;
  });
}

export async function newChatRequestWithResponse3(
  chatId: string,
  request: UIMessage,
  response: UIMessage,
  modelName: string | null
) {
  // Extract timestamps with fallbacks
  const requestTime = getMessageTimestamp(request);
  const responseTime = new Date(
    Math.max(getMessageTimestamp(response).getTime(), requestTime.getTime() + 1)
  );

  const newRequestMSG: MSG3 = {
    MsgId: request.id,
    chatId: chatId,
    role: request.role as "user" | "assistant" | "system",
    createdAt: requestTime,
    model: null,
    content: extractTextContent(request),
  };

  const newResponseMSG: MSG3 = {
    MsgId: response.id,
    chatId: chatId,
    role: response.role as "user" | "assistant" | "system",
    createdAt: responseTime,
    model: modelName,
    content: extractTextContent(response),
  };

  // Generate title from request - you may need to adjust this to work with parts
  const title = await fetch("/api/title", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messages: [
        { role: request.role, content: extractTextContent(request) },
        { role: response.role, content: extractTextContent(response) },
      ],
      model: "mistral-7b-instruct-v0.3",
    }),
  }).then((res) => res.text());

  const newChatObj: ChatMessage3 = {
    chatId: chatId,
    title: title,
    createdAt: new Date(),
    pinned: false,
  };

  console.log("💾 Saving chat to Dexie:", newChatObj);

  try {
    await chatDB.chats3.add(newChatObj);
    await msgDB.msgs3.bulkAdd([newRequestMSG, newResponseMSG]);
  } catch {
    console.log("📍📍error");
  }
}

export async function newChatWithRoadmap(
  chatId: string,
  roadmap: RoadmapT,
  request: string
) {
  // Extract timestamps with fallbacks

  // Generate title from request - you may need to adjust this to work with parts
  const title = await fetch("/api/title", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messages: [{ role: "user", content: request }],
      model: "",
    }),
  }).then((res) => res.text());

  const newChatObj: ChatMessage3 = {
    chatId: chatId,
    title: title,
    createdAt: new Date(),
    pinned: false,
  };
  const newRoadmap: RoadMap = {
    id: uuidv4(),
    chatId: chatId,
    roadmap: roadmap,
  };

  console.log("💾 Saving chat to Dexie:", newChatObj);

  try {
    await chatDB.chats3.add(newChatObj);
    await roadmapDB.roadmap.add(newRoadmap);
    // await msgDB.msgs3.bulkAdd([newRequestMSG, newResponseMSG]);
  } catch {
    console.log("📍📍error");
  }
}

export function convertMessageToMSG3(
  chatId: string,
  message: UIMessage,
  modelName: string | null
): MSG3 {
  return {
    MsgId: message.id,
    chatId: chatId,
    content: extractTextContent(message),
    role: message.role as "user" | "assistant" | "system",
    createdAt: getMessageTimestamp(message),
    model: message.role === "assistant" ? modelName : null,
  };
}

export async function loadMessages3(
  chatId: string | undefined
): Promise<UIMessage[]> {
  if (!chatId) return [];

  // Get messages and sort them by createdAt timestamp
  const chat = await msgDB.msgs3.where("chatId").equals(chatId).toArray();

  // Sort by createdAt to ensure proper chronological order
  chat.sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    // If timestamps are the same, put user messages before assistant messages
    if (dateA === dateB) {
      if (a.role === "user" && b.role === "assistant") return -1;
      if (a.role === "assistant" && b.role === "user") return 1;
    }
    return dateA - dateB; // Ascending order - oldest first
  });

  // Convert to UIMessage format with parts array
  const msgs: UIMessage[] = chat.map((msg) => ({
    id: msg.MsgId,
    role: msg.role as "user" | "assistant" | "system",
    parts: [
      {
        type: "text",
        text: msg.content,
      },
    ],
    metadata: {
      createdAt: msg.createdAt.toISOString(),
      model: msg.model,
    },
  }));

  return msgs;
}

export async function loadMsg3(chatId: string): Promise<MSG3[]> {
  const chat = await msgDB.msgs3.where("chatId").equals(chatId).toArray();
  return chat;
}

export async function saveRequestWithResponse3(
  chatId: string,
  request: UIMessage,
  response: UIMessage,
  modelName: string | null
) {
  const chat = await chatDB.chats3.get(chatId);

  // Extract timestamps with fallbacks
  const requestTime = getMessageTimestamp(request);
  const responseTime = new Date(
    Math.max(getMessageTimestamp(response).getTime(), requestTime.getTime() + 1)
  );

  const RequestMSG: MSG3 = {
    MsgId: request.id,
    chatId: chatId,
    role: request.role as "user" | "assistant" | "system",
    createdAt: requestTime,
    model: null,
    content: extractTextContent(request),
  };

  const ResponseMSG: MSG3 = {
    MsgId: response.id,
    chatId: chatId,
    role: response.role as "user" | "assistant" | "system",
    createdAt: responseTime,
    model: modelName,
    content: extractTextContent(response),
  };

  if (chat) {
    const newMessages = [RequestMSG, ResponseMSG];
    await msgDB.msgs3.bulkAdd(newMessages);
  } else {
    // If the chat doesn't exist, create a new one with the message
    const newChat: ChatMessage3 = {
      chatId,
      title: "New Chat",
      createdAt: new Date(),
      pinned: false,
    };
    await chatDB.chats3.add(newChat);
  }
}
