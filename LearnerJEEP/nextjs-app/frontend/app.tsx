import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import ChatPage from "./pages/chat";
import ChatLayout from "./layout/chat-layout";

import { SidebarProvider } from "@/components/ui/sidebar";
export default function App() {
  return (
    <BrowserRouter>
      <SidebarProvider>
        <Routes>
          <Route
            path="/"
            element={
              <>
                <Navigate to="/chat" replace />
              </>
            }
          />
          <Route
            path="/chat"
            element={
              <>
                <ChatLayout>
                  <ChatPage />
                </ChatLayout>
              </>
            }
          />
          <Route
            path="/chat/:chatId"
            element={
              <>
                <ChatLayout>
                  <ChatPage />
                </ChatLayout>
              </>
            }
          />
        </Routes>
      </SidebarProvider>
    </BrowserRouter>
  );
}
