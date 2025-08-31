// tools/chat-store.ts
import { generateId } from 'ai';
import { writeFile, readFile } from 'fs/promises';
import path from 'path';

const CHAT_DIR = path.resolve(process.cwd(), 'chats');

export async function createChat() {
  const id = generateId();
  const file = path.join(CHAT_DIR, `${id}.json`);
  await writeFile(file, JSON.stringify([]));      // start empty
  return id;
}

export async function loadChat(id: string) {
  const file = path.join(CHAT_DIR, `${id}.json`);
  const data = await readFile(file, 'utf8');
  return JSON.parse(data);
}

export async function saveChat(id: string, messages: any[]) {
  const file = path.join(CHAT_DIR, `${id}.json`);
  await writeFile(file, JSON.stringify(messages));
}
