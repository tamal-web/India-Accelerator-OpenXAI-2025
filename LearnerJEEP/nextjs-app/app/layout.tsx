"use client";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
// import { Nav } from "@/components/nav";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning>
      <head></head>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="flex flex-row max-h-[100dvh] w-screen overflow-x-hidden overflow-y-hidden">
            <main className="flex-1 max-h-[100dvh] flex flex-col overflow-x-hidden overflow-y-hidden">
              {/* <Nav /> */}
              {children}
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
