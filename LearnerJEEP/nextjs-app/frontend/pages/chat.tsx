"use client";
import Chat from "@/ui/chat";
import { useParams } from 'react-router-dom';

export default function ChatPage() {
const { chatId } = useParams();
  return <Chat id={chatId} />;
// return ()
}
