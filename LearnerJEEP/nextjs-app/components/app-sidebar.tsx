"use client";
import { useLiveQuery } from "dexie-react-hooks";
import { MoreHorizontal } from "lucide-react";
import { useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuAction,
  SidebarFooter,
  SidebarHeader,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Copy } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NavUser } from "@/components/nav-user";
// import { usePathname } from "next/navigation";
import { useLocation } from "react-router-dom";
import { Link } from "react-router-dom";
import { CommandPalette } from "./commandk";
const user = {
  name: "shadcn",
  email: "Free",
  avatar: "/avatar/logo.jpeg",
};
import NextImage from "next/image";
// import { useRouter } from "next/navigation";
// import { useNavigate } from 'react-router-dom';
import { ChatMessage3, chatDB } from "@/lib/db3";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  // const navigate = useNavigate();
  // const [chats, setChats] = useState<Chat[]>([]);
  // 👇 live query: re-runs whenever db.chats changes
  const chats = useLiveQuery(
    () => chatDB.chats3.orderBy("createdAt").reverse().toArray(),
    []
  ) as ChatMessage3[];
  // console.log("📍", chats);

  const [renameDialogId, setRenameDialogId] = useState<string | null>(null);
  const [shareDialogId, setShareDialogId] = useState<string | null>(null);

  const [deleteDialogId, setDeleteDialogId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  // const [setOpenMenuId] = useState<string | null>(null);

  // useEffect(() => {
  //   db.chats.orderBy("createdAt").reverse().toArray().then(setChats);
  // }, []);

  const renameChat = async (chat: ChatMessage3) => {
    if (title) {
      await chatDB.chats3.update(chat.chatId, { title: title });
    }
  };

  const deleteChat = async (chat: ChatMessage3) => {
    await chatDB.chats3.delete(chat.chatId);

    // }
  };
  const pathname = useLocation();
  // const { open } = useSidebar();
  return (
    // <Router>
    <Sidebar className="h-full border-" collapsible="offcanvas" {...props}>
      {/* Desktop-only sidebar trigger - hidden on mobile */}
      <div
        className={`fixed left-[0.35rem] top-[1.1rem] z-[9999] transition-all md:hidden block`}
      >
        {/* <SidebarTrigger
          className={`hover:opacity-80 transition-opacity z-[99]`}
        /> */}
      </div>
      <SidebarHeader className="pb-[0.25rem] flex flex-col gap-[1.4rem] bg-whit relative">
        <div className="relative h-[4rem] mt-[0.78rem] bg-whit pb-0">
          <NextImage
            src="/logo.png"
            alt=""
            fill
            style={{
              objectFit: "contain",
              filter: " ",
            }}
            className="dark:invert"
          />
        </div>
        <CommandPalette />
      </SidebarHeader>

      <SidebarContent className="h-full py-2 overflow-y-auto">
        <SidebarGroup>
          <SidebarGroupLabel>History</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {chats?.map((chat) => (
                <SidebarMenuItem key={chat.chatId}>
                  <div className="flex items-center justify-between w-full">
                    <SidebarMenuButton
                      asChild
                      className={`flex-grow ${
                        pathname.pathname === "/chat/" + chat.chatId
                          ? "!bg-neutral-200 dark:!bg-neutral-800"
                          : ""
                      }`}
                    >
                      <Link
                        to={`/chat/${chat.chatId}`}
                        className="truncate"
                        // onMouseEnter={() => {
                        //   prefetch(`/chat/v2/${chat.chatId}`);
                        // }}
                      >
                        {chat.title}
                      </Link>
                    </SidebarMenuButton>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <SidebarMenuAction
                          showOnHover
                          className="focus-visible:ring-0"
                        >
                          <MoreHorizontal />
                        </SidebarMenuAction>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" side="right">
                        {/* <DropdownMenuItem
                          onSelect={() => {
                            requestAnimationFrame(() => {
                              setShareDialogId(chat.id);
                            });
                          }}
                        >
                          Share
                        </DropdownMenuItem> */}
                        <DropdownMenuItem
                          onSelect={() => {
                            requestAnimationFrame(() => {
                              setRenameDialogId(chat.chatId);
                              setTitle(chat.title);
                            });
                          }}
                        >
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => {
                            requestAnimationFrame(() => {
                              setDeleteDialogId(chat.chatId);
                            });
                          }}
                          className="text-destructive"
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      {chats?.map((chat) =>
        renameDialogId == chat.chatId ? (
          <Dialog
            key={chat.chatId}
            open={renameDialogId == chat.chatId}
            onOpenChange={(open) => {
              if (!open) setRenameDialogId(null);
            }}
          >
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Edit Chat Name</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Chat Name
                  </Label>
                  <Input
                    id="name"
                    defaultValue={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="submit"
                  onClick={() => {
                    renameChat(chat);
                    setRenameDialogId(null);
                  }}
                >
                  Save
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        ) : null
      )}
      {chats?.map((chat) =>
        shareDialogId == chat.chatId ? (
          <Dialog
            key={chat.chatId}
            open={shareDialogId == chat.chatId}
            onOpenChange={(open) => {
              if (!open) setShareDialogId(null);
            }}
          >
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Share link</DialogTitle>
                <DialogDescription>
                  Anyone who has this link will be able to view this.
                </DialogDescription>
              </DialogHeader>
              <div className="flex items-center space-x-2">
                <div className="grid flex-1 gap-2">
                  <Label htmlFor="link" className="sr-only">
                    Link
                  </Label>
                  <Input
                    id="link"
                    defaultValue="https://ui.shadcn.com/docs/installation"
                    readOnly
                  />
                </div>
                <Button type="submit" size="sm" className="px-3">
                  <span className="sr-only">Copy</span>
                  <Copy />
                </Button>
              </div>
              <DialogFooter className="sm:justify-start">
                <DialogClose asChild>
                  <Button type="button" variant="secondary">
                    Close
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        ) : null
      )}
      {chats?.map((chat) =>
        deleteDialogId == chat.chatId ? (
          <AlertDialog
            open={deleteDialogId == chat.chatId}
            key={chat.chatId}
            onOpenChange={(open) => {
              if (!open) setDeleteDialogId(null);
            }}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete
                  this Chat and remove all messages.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <Button asChild variant={"destructive"}>
                  <AlertDialogAction onClick={() => deleteChat(chat)}>
                    Yes, Delete
                  </AlertDialogAction>
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : null
      )}
    </Sidebar>
    // </Router>
  );
}
