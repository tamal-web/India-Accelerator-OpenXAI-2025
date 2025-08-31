"use client";
// import "./globals.css";
import { SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
// import { Nav } from "@/components/nav";
// import { useSidebar, SidebarTrigger } from "@/components/ui/sidebar";
// import { Outlet } from "react-router";
// import { BrowserRouter, Routes, Route } from "react-router-dom";
// import ChatPage from "@/src/pages/ChatPage";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // const { open } = useSidebar();
  // export default function ChatLayout() {
  //   const defaultOpen = true;
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {/* <SidebarProvider defaultOpen={defaultOpen}> */}
      <div className="flex flex-row w-screen overflow-hidden">
        <AppSidebar variant="inset" />
        <SidebarInset>
          <main className="flex-1 flex flex-col overflow-hidden">
            {children}
          </main>
        </SidebarInset>
      </div>
      {/* </SidebarProvider> */}
    </ThemeProvider>
  );
}
