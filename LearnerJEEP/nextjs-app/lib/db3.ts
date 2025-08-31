// import { Message as msg } from "ai";
import Dexie from "dexie";
import type { RoadmapT } from "@/app/api/chat/roadmap/route";
import { Table } from "dexie";

export interface MSG3 {
  MsgId: string;
  chatId: string;
  role: "user" | "assistant" | "system" | "data";
  createdAt: Date;
  model: string | null;
  content: string;
}

export interface ChatMessage3 {
  chatId: string; // conversation identifier
  title: string;
  createdAt: Date; // timestamp for ordering
  pinned: boolean;
}

export interface RoadMap {
  id: string;
  chatId: string;
  roadmap: RoadmapT;
}

export class ChatDB extends Dexie {
  chats3!: Table<ChatMessage3, string>;

  constructor() {
    super("ChatDatabase");
    this.version(1).stores({
      chats3: "chatId, createdAt, title,pinned",
    });
  }
}

export class RoadmapDB extends Dexie {
  roadmap!: Table<RoadMap, string>;

  constructor() {
    super("RoadMap");
    this.version(1).stores({
      roadmap: "id, chatId, RoadmapT",
    });
  }
}
export class MSGDB extends Dexie {
  msgs3!: Table<MSG3, string>;

  constructor() {
    super("MsgDatabase");
    this.version(1).stores({
      msgs3: "MsgId, chatId, role, createdAt, model, content",
    });
  }
}

export const chatDB = new ChatDB();
export const msgDB = new MSGDB();
export const roadmapDB = new RoadmapDB();
