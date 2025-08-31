// // import { Message as msg } from "ai";
// import Dexie from "dexie";
// import { Table } from "dexie";

// export interface MSG {
//   id:string;
//   role: "user" | "assistant" | "system" | "data";
//   createdAt: Date;
//   model:string|null;
//   content: string;
// }

// export interface ChatMessage {
//   chatId: string; // conversation identifier
//   title: string;
//   createdAt: Date; // timestamp for ordering
//   // messages: msg[];
//   messages: MSG[];
// }

// export class ChatDB extends Dexie {
//   chats2!: Table<ChatMessage, string>;

//   constructor() {
//     super("ChatDatabase");
//     this.version(1).stores({
//       // Primary key ++id; chatId is indexed; createdAt for sorting
//       // chats: '++id,&chatId,createdAt'
//       chats2: "chatId, createdAt, title, messages",
//     });
//   }
// }

// export const db2 = new ChatDB();
