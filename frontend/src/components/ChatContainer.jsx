"use client";

import { useState, useRef, useEffect } from "react";
import MessageBubble from "./MessageBubble";
import InputField from "./InputField";
import DocumentUpload from "./DocumentUpload";

export default function ChatContainer() {
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [canUpload, setCanUpload] = useState(false);

  const [sessionId] = useState(() =>
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).substring(2, 10)
  );

  const messagesEndRef = useRef(null);
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = async (message) => {
    if (!message?.trim()) return;

    if (!API_BASE) {
      return;
    }

    const userMsg = {
      id: crypto.randomUUID(),
      text: message,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const res = await fetch(`${API_BASE}/api/chat/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          session_id: sessionId,
        }),
      });

      const rawText = await res.text();

      let data;
      try {
        data = JSON.parse(rawText);
      } catch {
        throw new Error("Invalid JSON from backend");
      }

      const botMsg = {
        id: crypto.randomUUID(),
        text: data?.ai_message || "Sorry, something went wrong.",
        sender: "bot",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMsg]);

      if (data?.next_action === "upload_docs") {
        setCanUpload(true);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          text: "⚠️ Unable to connect to server. Please try again.",
          sender: "bot",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleUploaded = async (ocrData) => {
    setCanUpload(false);

    const infoMsg = {
      id: crypto.randomUUID(),
      text: "Document submitted ✅",
      sender: "user",
      timestamp: new Date(),
    };

    const followupMsg = {
      id: crypto.randomUUID(),
      text: "Thanks for uploading your documents. I’m checking your eligibility and EMI options now.",
      sender: "bot",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, infoMsg, followupMsg]);
  };

  return (
    <div className="fixed inset-0 w-full h-full bg-white flex flex-col z-50">
      {/* Header */}
      <div className="p-4 border-b bg-[#103766] text-white shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse" />
          <h3 className="font-bold text-lg">ArthaSaarathi</h3>
          <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
            Session: {sessionId.slice(0, 6)}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {isTyping && (
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-2xl">
            <div className="flex gap-1 mt-1">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:0.1s]" />
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:0.2s]" />
            </div>
            <span className="text-sm text-gray-500">
              ArthaSaarathi is typing...
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Bottom */}
      <div className="border-t bg-white px-4 py-3 space-y-3">
        {canUpload && (
          <DocumentUpload sessionId={sessionId} onUploaded={handleUploaded} />
        )}
        <InputField onSend={handleSend} />
      </div>
    </div>
  );
}
