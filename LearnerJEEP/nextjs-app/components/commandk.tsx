"use client";
import * as React from "react";
import { Moon, PlusCircle, Search, Settings, Sun, User, BrainCircuit, PanelLeftIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  CommandCustomDialog,
  CommandCustomEmpty,
  CommandCustomGroup,
  CommandCustomInput,
  CommandCustomItem,
  CommandCustomList,
  CommandCustomShortcut,
  CommandCustomSeparator,
} from "@/components/ui/customCommand";
import { useCommandState } from "cmdk"; // Import directly from cmdk
import {  useEffect } from "react";
import { ChatMessage3 } from "@/lib/db3";
import { chatDB } from "@/lib/db3";
import { useLiveQuery } from "dexie-react-hooks";
// import chat from "@/ui/chat";
import { useTheme } from "next-themes";
import { useSidebar } from "@/components/ui/sidebar";
export function CommandPalette() {
  const { resolvedTheme, setTheme } = useTheme();
  const { toggleSidebar } = useSidebar()
  const chats = useLiveQuery(
    () => chatDB.chats3.orderBy("createdAt").reverse().toArray(),
    []
  ) as ChatMessage3[];
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);



  const prefetchItem = (itemValue: string) => {
    // Your prefetching logic here
    // console.log("Prefetching item:", itemValue);

    // If the item is a chat route
    if (itemValue.startsWith("chat:")) {
      const chatId = itemValue.replace("chat:", "");
      router.prefetch(`/chat/v2/${chatId}`);
    } else if (itemValue === "profile") {
      router.prefetch("/profile");
    } else if (itemValue === "billing") {
      router.prefetch("/billing");
    } else if (itemValue === "settings") {
      router.prefetch("/settings");
    }else if (itemValue === "New Chat") {
      router.prefetch("/chat/v2/");
    }
  };

  // Use cmdk's useCommandState hook to track the active value
  // This needs to be in a separate component because useCommandState
  // must be used within the command dialog context
  const ActiveItemWatcher = () => {
    // Get the currently active value from cmdk state
    const activeValue = useCommandState((state) => state.value);

    // Prefetch content whenever the active item changes
    useEffect(() => {
      if (activeValue) {
        prefetchItem(activeValue);
      }
    }, [activeValue]);

    return null;
  };

  return (
    <>
{/* Search bar to search through chat history */}
<div className="search-bar relative">
  <div className="relative">  
    <button 
      onClick={() => setOpen(true)}
      className="!w-full h-10 flex items-center gap-2 px-3.5 py-2 bg-background text-muted-foreground rounded-md border shadow-sm hover:bg-accent transition-colors"
    >
      <Search className="h-4 w-4" /> 
      <span className="text-sm">Search chats...</span>
      <kbd className="ml-2 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground absolute right-[0.6rem]">
        <span className="text-xs">⌘</span>K
      </kbd>
    </button>
  </div>
</div>
    

      <CommandCustomDialog open={open} onOpenChange={setOpen}>
        <CommandCustomInput placeholder="Type a command or search..." />
        <ActiveItemWatcher />
        <CommandCustomList>
          <CommandCustomEmpty>No results found.</CommandCustomEmpty>
          <CommandCustomGroup heading="">
            <CommandCustomItem
            key={"NewChat"}
            value={`chat:${"New Chat caht"}`} // Set a unique value for cmdk to track
            onSelect={() => {
              router.push(`/chat/v2/`);
              setOpen(false);
            }}
            onMouseEnter={() => prefetchItem(`chat:${"NewChat"}`)}
            >
              <PlusCircle />
              <span>New Chat</span>
              <CommandCustomShortcut>Enter</CommandCustomShortcut>
            </CommandCustomItem>
          </CommandCustomGroup>
          <CommandCustomGroup heading="History">
            {chats?.map((chat) => (
              <CommandCustomItem
                key={chat.chatId}
                value={`chat:${chat.chatId}`} // Set a unique value for cmdk to track
                keywords={[chat.title]}
                onSelect={() => {
                  router.push(`/chat/v2/${chat.chatId}`);
                  setOpen(false);
                }}
                onMouseEnter={() => prefetchItem(`chat:${chat.chatId}`)}
              >
                <span>{chat.title}</span>
                <CommandCustomShortcut></CommandCustomShortcut>
              </CommandCustomItem>
            ))}
          </CommandCustomGroup>
          <CommandCustomSeparator />
          <CommandCustomGroup heading="Settings">
            <CommandCustomItem
              value="profile" // Value for tracking active state
              onSelect={() => router.push("/profile")}
              onMouseEnter={() => prefetchItem("profile")}
            >
              <User />
              <span>Profile</span>
              <CommandCustomShortcut>⌘P</CommandCustomShortcut>
            </CommandCustomItem>
            <CommandCustomItem
              value="settings"
              onSelect={() => router.push("/settings")}
              onMouseEnter={() => prefetchItem("settings")}
            >
              <Settings />
              <span>Settings</span>
              <CommandCustomShortcut>⌘B</CommandCustomShortcut>
            </CommandCustomItem>
            <CommandCustomItem
              value="theme"
              onSelect={() => {setTheme(resolvedTheme === "dark" ? "light" : "dark")}}
            >
              {resolvedTheme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
              <span>Switch Theme</span>
              {/* <CommandCustomShortcut>⌘B</CommandCustomShortcut> */}
            </CommandCustomItem>
            <CommandCustomItem
              value="Sidebar"
              onSelect={() => {toggleSidebar()}}
              keywords={["Sidebar", "sidebar", "toggle sidebar"]}
            >
              <PanelLeftIcon className="h-4 w-4" />
              <span>Toggle Sidebar</span>
              {/* <CommandCustomShortcut>⌘B</CommandCustomShortcut> */}
            </CommandCustomItem>
            <CommandCustomItem
              value="AIModels"
              keywords={["AI Models", "model", "ai"]}
              onSelect={() => router.push("/models")}
              onMouseEnter={() => prefetchItem("AIModels")}
            >
{/* lucide react icon for AI Models */}
              <BrainCircuit/>
              <span>AI Models</span>
              {/* <CommandCustomShortcut>⌘B</CommandCustomShortcut> */}
            </CommandCustomItem>
          </CommandCustomGroup>
        </CommandCustomList>
      </CommandCustomDialog>
    </>
  );
}
