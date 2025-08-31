// chat.tsx
"use client";
import { MindMap, type MindMapData } from "@/components/mind-map";
import { loadRoadmapsFromChatId } from "@/lib/storage";
import { UIMessage } from "ai";
import { useChat } from "@ai-sdk/react";
import { experimental_useObject as useObject } from "@ai-sdk/react";
import { roadmapSchema, RoadmapT } from "@/app/api/chat/roadmap/route";
import { DefaultChatTransport } from "ai";
import { useEffect, useRef, useState, useCallback } from "react";
import type { outputType } from "@/components/custom-chat-input2";
import { roadmapDB } from "@/lib/db3";
import {
  loadMessages3,
  newChatRequestWithResponse3,
  saveRequestWithResponse3,
} from "@/lib/storage";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { Copy, ChevronDown, BetweenHorizonalEnd } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatInput2 } from "@/components/custom-chat-input2";
import { ModelSelector } from "@/components/model-selector";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { chatDB } from "@/lib/db3";
import { AssistantMessage } from "@/components/AssistantMessage";
import dynamic from "next/dynamic";
import { ThemeToggle } from "@/components/theme-toggle";
import { Roadmap, type RoadmapItem } from "@/components/roadmap";
import { saveRoadmap, newChatWithRoadmap } from "@/lib/storage";

const ChatComponent = dynamic(() => Promise.resolve(ChatClient), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[100dvh]">
      <div className="animate-pulse text-center">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-4"></div>
        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-md w-96 mx-auto"></div>
      </div>
    </div>
  ),
});

export default function Chat({ id }: { id?: string | undefined } = {}) {
  return <ChatComponent id={id} />;
}

function ChatClient({ id }: { id?: string | undefined } = {}) {
  const [refresh, setRefresh] = useState(false);
  const { open } = useSidebar();
  const [initialMessages, setInitialMessages] = useState<UIMessage[]>([]);
  const [isAtBottom, setIsAtBottom] = useState(true);
  // const [currentInputRef, setCurrentInputRef] = useState("");
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  // const inputRef = useRef("");
  const [input, setInput] = useState("");
  const currentInputRef = useRef("");
  const [outputType, setOutputType] = useState<outputType>("roadmap");
  const [roadmaps, setRoadmaps] = useState<RoadmapT[]>([]);

  const {
    object: roadmapObject,
    submit: roadmapSubmit,
    isLoading: roadmapLoading,
  } = useObject({
    api: "/api/chat/roadmap",
    headers: { inputUser: input },
    onFinish: async (msg) => {
      const userInput = currentInputRef.current;
      const parsed = roadmapSchema.safeParse(msg.object);
      if (parsed.data) {
        setRoadmaps((prev) => [...prev, parsed.data]);
      }
      if (!id) {
        const newChatID = uuidv4();
        const parsed = roadmapSchema.safeParse(msg.object);
        if (parsed.data) {
          await newChatWithRoadmap(
            newChatID,
            parsed.data,
            currentInputRef.current
          );
        }
        setRefresh((prev) => !prev);
        navigate(`/chat/${newChatID}`);
      } else {
        const currentChat = await roadmapDB.roadmap.get(id);
        if (currentChat) {
          const parsed = roadmapSchema.safeParse(msg.object);
          if (parsed.data) {
            saveRoadmap(id, parsed.data);
          }
        } else {
          const newChatID = uuidv4();
          const parsed = roadmapSchema.safeParse(msg.object);
          if (parsed.data) {
            await newChatWithRoadmap(
              newChatID,
              parsed.data,
              currentInputRef.current
            );
          }
          setRefresh((prev) => !prev);
          navigate(`/chat/${newChatID}`);
        }
      }
    },
    schema: roadmapSchema,
  });

  const {
    object: mindmapObject,
    submit: mindmapSubmit,
    isLoading: mindmapLoading,
  } = useObject({
    api: "/api/chat/mindmap",
    headers: { inputUser: input },
    schema: roadmapSchema,
  });

  const { messages, setMessages, sendMessage, status } = useChat({
    messages: initialMessages, // CHANGED: initialMessages → messages
    transport: new DefaultChatTransport({
      // NEW: transport configuration
      api: "/api/chat/stream",
      body: {
        modelName:
          typeof window !== "undefined"
            ? localStorage.getItem("chatModel") || "mistral-7b-instruct-v0.3"
            : "mistral-7b-instruct-v0.3",
      },
    }),
    onFinish: async (message) => {
      const userInput = currentInputRef.current;
      console.log("📍👉 print input: ", userInput);
      // console.log("Before anything 📍👉 print input: ", inputRef.current);
      try {
        if (!id) {
          // console.log("📍👉yeh h tera input: ", inputRef.current.trim());
          const newChatID = uuidv4();
          await newChatRequestWithResponse3(
            newChatID,
            {
              id: uuidv4(),
              role: "user",
              parts: [
                {
                  type: "text",
                  text: userInput,
                },
              ],
              metadata: {
                createdAt: new Date().toISOString(),
              },
            },
            message.message,
            localStorage.getItem("chatModel") || "set_model"
          );
          setRefresh((prev) => !prev);
          navigate(`/chat/${newChatID}`);
        } else {
          // console.log("📍👉yeh h tera input: ", inputRef.current.trim());
          const currentChat = await chatDB.chats3.get(id);
          if (currentChat) {
            await saveRequestWithResponse3(
              id,

              {
                id: uuidv4(),
                role: "user",
                parts: [
                  {
                    type: "text",
                    text: userInput,
                  },
                ],
                metadata: {
                  createdAt: new Date().toISOString(),
                },
              },
              message.message,
              localStorage.getItem("chatModel") || "set_model"
            );
            setRefresh((prev) => !prev);
          } else {
            // console.log("📍👉yeh h tera input: ", inputRef.current.trim());
            const newChatID = uuidv4();
            await newChatRequestWithResponse3(
              newChatID,
              {
                id: uuidv4(),
                role: "user",
                parts: [
                  {
                    type: "text",
                    text: userInput,
                  },
                ],
                metadata: {
                  createdAt: new Date().toISOString(),
                },
              },
              message.message,
              localStorage.getItem("chatModel") || "set_model"
            );
            navigate(`/chat/${newChatID}`);
            setRefresh((prev) => !prev);
          }
        }
      } catch (error) {
        console.error("❌ Error in onFinish:", error);
        setRefresh((prev) => !prev);
      }
    },
  });

  // NEW: Manual input change handler
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  // NEW: Manual submit handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (input.trim) {
      try {
        const inputToSend = input.trim(); // Capture the input value
        // setCurrentInputRef(inputToSend);
        currentInputRef.current = inputToSend;

        switch (outputType) {
          case "roadmap":
            roadmapSubmit({ text: inputToSend });
            break;
          case "mindmap":
            mindmapSubmit({ text: inputToSend });
            break;
          default:
            sendMessage({ text: inputToSend });
            break;
        }

        // Store the input value for use in onFinish
      } catch {
        console.log("📍📍 Error sending message");
      }

      // CHANGED: Use sendMessage instead of append
    }
  };

  // CHANGED: Use status instead of isLoading
  const isLoading =
    status === "submitted" || status === "streaming" || roadmapLoading;

  // NEW: Stop function (if needed)
  const stop = () => {
    // Implement stop functionality if needed
    console.log("Stop requested");
  };

  const scrollToBottom = useCallback(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: "auto",
      });
    }
  }, [chatContainerRef]);

  // Load messages (simplified)
  useEffect(() => {
    if (!id) return;
    if (typeof window === "undefined") return;
    const load = async () => {
      try {
        const msgs = await loadMessages3(id);
        setMessages(msgs);
        console.log("📍👉Loaded msgs: ", msgs);
      } catch (err) {
        console.error("Error loading messages:", err);
      } finally {
        console.log("📍👉Initial Msgs: ", initialMessages);
      }
    };
    const loadRoadmap = async () => {
      try {
        const msgs = await loadRoadmapsFromChatId(id);
        if (msgs) {
          setRoadmaps(msgs);
        }
      } catch {
        console.log("error");
      }
    };
    load();
    loadRoadmap();
    console.log("📍👉Initial Msgs: ", initialMessages);
  }, [id]);

  useEffect(() => {
    console.log("📍👉Initial Msgs: ", initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    console.log("💻 roadmaps: ");
  }, [roadmaps]);

  // Auto-scroll when new messages arrive (if user is at bottom)
  useEffect(() => {
    if (chatContainerRef.current && isAtBottom) {
      scrollToBottom();
    }
  }, [messages, isAtBottom, scrollToBottom]);

  // Track whether user is at bottom
  useEffect(() => {
    const checkIfAtBottom = () => {
      if (chatContainerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } =
          chatContainerRef.current;
        const isBottom = scrollHeight - scrollTop - clientHeight < 50;
        setIsAtBottom(isBottom);
      }
    };
    const container = chatContainerRef.current;
    if (container) {
      container.addEventListener("scroll", checkIfAtBottom);
      return () => container.removeEventListener("scroll", checkIfAtBottom);
    }
  }, []);

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      if (
        typeof window !== "undefined" &&
        window.isSecureContext &&
        navigator.clipboard &&
        navigator.clipboard.writeText
      ) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
    } catch (err) {
      console.error("Clipboard copy failed:", err);
    }
  }, []);
  // const hasContent = (m: UIMessage): m is UIMessage & { content: string } => {
  //   return "content" in m && typeof m.content === "string";
  // };

  return (
    <>
      <div
        className={` ${
          open ? "left-[3.4rem lg:gap-[0rem] " : " gap-[0.5rem] left-[0.74rem "
        }  px-[0.7rem] flex flex-row items-center md:absolute top-[0.86rem] z-[11] fixed`}
        style={{ pointerEvents: "auto" }}
      >
        <SidebarTrigger
          className={`${
            open ? "md:fixed left-[1rem]" : "relative"
          } hover:opacity-80 transition-opacity md:z-[11] z-[99999999]`}
        />
        <ModelSelector
          className={`transition-transform ease-in-out duration-150 top-[0.87rem] md:top-[1.3rem] md:pl-0 z-[10] bg-background rounded-lg`}
          status={isLoading}
        />
      </div>
      <div
        className={`fixed top-[0.86rem] md:top-[1.3rem] right-[1.3rem] md:pl-0 z-[10]`}
      >
        <ThemeToggle />
      </div>
      <div className=" flex-1 flex flex-col px-2 max-h-[100dvh] w-full">
        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto flex flex-col items-center justify-start relative pt-[5rem] "
        >
          <div className="w-full px-[2rem] pt-4 flex flex-col items-center">
            {""}
            {roadmaps?.map((roadmapObject) => (
              <div key={roadmapObject.title}>
                <header className="mb-8 w-3xl">
                  <h1 className="text-balance font-sans text-3xl font-semibold tracking-tight">
                    {roadmapObject.title}
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                    {roadmapObject.description}
                  </p>
                </header>

                {roadmapObject.subtopics && (
                  <Roadmap
                    ask={(input) => {
                      // console.log("");
                      sendMessage({ text: input });
                    }}
                    className="max-w-[55rem]"
                    items={roadmapObject.subtopics?.map((item) => {
                      return {
                        title: item?.title && item.title,
                        description: item?.description,
                      };
                    })}
                    bendOffset={220}
                    segmentHeight={180}
                  />
                )}
              </div>
            ))}
            {roadmapObject && (
              <>
                <header className="mb-8 w-3xl">
                  <h1 className="text-balance font-sans text-3xl font-semibold tracking-tight">
                    {roadmapObject.title}
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                    {roadmapObject.description}
                  </p>
                </header>

                {roadmapObject.subtopics && (
                  <Roadmap
                    className="max-w-[55rem]"
                    items={roadmapObject.subtopics?.map((item) => {
                      return {
                        title: item?.title && item.title,
                        description: item?.description,
                      };
                    })}
                    bendOffset={220}
                    segmentHeight={180}
                  />
                )}
              </>
            )}
          </div>
          <div className="w-full px-[2rem] pt-4 flex flex-col items-center">
            {mindmapObject && <MindMap data={mindmapObject} />}
          </div>
          <div className="w-full max-w-3xl space-y-2 ">
            {messages
              // .filter(hasContent)
              .map((m, i) => (
                <div key={i} className="w-full">
                  {m.role === "user" && (
                    <div className="flex group relative justify-end">
                      <div className="relative max-w-[70%] flex flex-col gap-[0.3rem] items-end p-2">
                        <div className="p-3 relative bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 rounded-[0.6rem]">
                          {m.parts[0].type == "text" && m.parts[0].text}
                        </div>
                        <div className="flex items-center rounded-md">
                          <Button
                            onClick={() =>
                              copyToClipboard(
                                (m.parts[0].type == "text" &&
                                  m.parts[0].text) ||
                                  "no message"
                              )
                            }
                            variant="ghost"
                            className="rounded-full p-1"
                            title="Copy message"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                  {m.role === "assistant" && (
                    <AssistantMessage m={m} refresh={refresh} />
                  )}
                </div>
              ))}
          </div>
        </div>
        <div className="flex flex-col justify-end items-center mt-[0.4rem] p-0 m-0 gap-0 w-full sticky bottom-0 z-10 bg-background/80 backdrop-blur-sm">
          <ChatInput2
            handleSubmit={handleSubmit}
            loading={isLoading}
            input={input}
            setInput={handleInputChange}
            stop={stop}
            selectedOuput={outputType}
            setSelectedOuput={setOutputType}
          />
        </div>
        {messages.length > 0 && !isAtBottom && (
          <button
            onClick={scrollToBottom}
            className="fixed md:bottom-20 bottom-[12rem] right-8 p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-full shadow-lg z-10 transition-opacity"
            aria-label="Scroll to bottom"
          >
            <ChevronDown className="h-5 w-5" />
          </button>
        )}
      </div>
    </>
  );
}
