"use client";

import { useState } from "react";
import { Send } from "lucide-react";
export function Chat() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState("");
  const [error, setError] = useState("");

  return (
    <div className="bg-gray-100 h-[100dvh] flex flex-col items-center justify-center">
      {error && <span style={{ color: "red" }}>{error}</span>}
      <span>{response}</span>
      <div className="relative flex flex-col">
        <textarea
          className="border-1 resize-none w-[30rem] h-[8rem] rounded-[1.6rem] py-2 px-3"
          disabled={loading}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button
          className="absolute bottom-[0.5rem] right-[0.5rem] border rounded-[1rem] p-3"
          disabled={loading}
          onClick={() => {
            setLoading(true);
            setMessage("");
            fetch("/api/chat", {
              method: "POST",
              body: JSON.stringify({
                message,
              }),
            })
              .then(async (res) => {
                if (res.ok) {
                  await res.json().then((data) => {
                    setError("");
                    setResponse(data.message);
                  });
                } else {
                  await res.json().then((data) => {
                    setError(data.error);
                    setResponse("");
                  });
                }
              })
              .finally(() => setLoading(false));
          }}
        >
          {/* Send */}
          <Send />
        </button>
      </div>
    </div>
  );
}
