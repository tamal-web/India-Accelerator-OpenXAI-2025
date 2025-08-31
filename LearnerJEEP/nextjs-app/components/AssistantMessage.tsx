// assistantMessage.tsx
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { msgDB } from "../lib/db3";
import { useState, useEffect, memo, useCallback } from "react";
// import { UIMessage } from "ai";
import { UIMessage } from "ai";

export const AssistantMessage = memo(
  ({
    m,
    refresh,
    isStreaming = false,
  }: {
    m: UIMessage;
    refresh: boolean;
    isStreaming?: boolean;
  }) => {
    const [model, setModel] = useState("");
    // const [isExpanded, setIsExpanded] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Use client-side only rendering for IndexedDB access
    useEffect(() => {
      // Only run in browser environment
      if (typeof window === "undefined") return;

      let mounted = true;
      setIsLoading(true);

      // Safely access IndexedDB
      try {
        msgDB.msgs3
          .get(m.id)
          .then((msg) => {
            if (mounted) {
              setModel(msg?.model || "");
              setIsLoading(false);
            }
          })
          .catch((err) => {
            console.error("Error fetching model:", err);
            if (mounted) {
              setIsLoading(false);
            }
          });
      } catch (err) {
        console.error("IndexedDB error:", err);
        setIsLoading(false);
      }

      return () => {
        mounted = false;
      };
    }, [m.id, refresh]);

    // Detect if content is large enough to warrant special handling
    // const isLargeContent = m.content.length > 5000;

    // Memoized copy function to prevent re-renders
    const copyToClipboard = useCallback(async (text: string) => {
      try {
        // For very large content, use a chunked approach
        if (text.length > 50000) {
          // Create a hidden textarea for large content
          const textArea = document.createElement("textarea");
          textArea.value = text;
          textArea.style.position = "fixed";
          textArea.style.opacity = "0";
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          document.execCommand("copy");
          document.body.removeChild(textArea);
        } else if (
          typeof window !== "undefined" &&
          window.isSecureContext &&
          navigator.clipboard
        ) {
          await navigator.clipboard.writeText(text);
        } else {
          // Fallback for browsers without clipboard API
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
    return (
      <div className={`assistant_container flex group relative justify-start`}>
        <div
          className={`relative max-w-[100%] w-[100%] flex flex-col gap-[0.3rem] items-start p-2`}
        >
          {m.role === "assistant" && (
            <div className="w-full max-w-full overflow-x-hidden">
              {/* {isLargeContent && (
                  <div className="mb-2">
                    <Button
                      onClick={() => setIsExpanded(!isExpanded)}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                    >
                      {isExpanded ? 'Show less' : 'Show full content'}
                    </Button>
                  </div>
                )} */}

              <div
                className="overflow-hidden break-words w-full"
                style={{ maxWidth: "100%", overflowX: "hidden" }}
              >
                {m.parts[0].type == "text" && m.parts[0].text}
              </div>
            </div>
          )}

          <div className={`flex flex-row items-center rounded-md mt-2`}>
            <Button
              onClick={() =>
                copyToClipboard(
                  (m.parts[0].type == "text" && m.parts[0].text) || "no message"
                )
              }
              variant="ghost"
              className="rounded-full p-1"
              title="Copy message"
            >
              <Copy className="h-3 w-3" />
            </Button>

            {isLoading ? (
              <span className="opacity-50 text-[0.85rem] animate-pulse">
                Loading model info...
              </span>
            ) : (
              <span className="opacity-50 text-[0.85rem]">
                model: {model || ""}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }
);

AssistantMessage.displayName = "AssistantMessage";
