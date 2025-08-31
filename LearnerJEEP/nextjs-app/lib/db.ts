// lib/db.ts
import Dexie, { Table } from "dexie";

// import { Timestamp } from "next/dist/server/lib/cache-handlers/types";

export interface Completion {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: [{ index: number; message: Message }];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  system_fingerprint: string;
}

export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface Chat {
  id: string; // unique chat ID
  title: string; // generated 2–4 word title
  createdAt: Date;
  messages: Messages[];
}
export interface Messages {
  id: string;
  model: string | "user";
  userMessage: Message;
  assistantMessage: Completion | null;
  createdAt: Date;
}

class ChatDatabase extends Dexie {
  chats!: Table<Chat, string>;

  constructor() {
    super("ChatDatabase");
    // key = id, index on createdAt for ordering
    this.version(1).stores({
      chats: "id, createdAt, title, messages",
    });
  }
}

export const db = new ChatDatabase();

// export interface ChatMessage {
//   id?: number;        // auto-increment primary key
//   chatId: string;     // conversation identifier
//   role: 'user' | 'assistant' | 'system' | 'data';
//   content: string;
//   createdAt: number;  // timestamp for ordering
// }

// export class ChatDB extends Dexie {
//   chats!: Table<ChatMessage, number>;

//   constructor() {
//     super('ChatDatabase');
//     this.version(1).stores({
//       // Primary key ++id; chatId is indexed; createdAt for sorting
//       chats: '++id,&chatId,createdAt'
//     });
//   }
// }

// export const db2 = new ChatDB();


