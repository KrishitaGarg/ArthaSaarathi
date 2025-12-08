"use client";
import { useState, useRef, useEffect } from "react";
import MessageBubble from "./MessageBubble";
import InputField from "./InputField";
import DocumentUpload from "./DocumentUpload";

export default function ChatContainer() {
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [canUpload, setCanUpload] = useState(false);
  const [sessionId, setSessionId] = useState(() => crypto.randomUUID());
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (message) => {
    const userMsg = {
      id: Date.now(),
      text: message,
      sender: "user",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);

    setIsTyping(true);
    const res = await fetch("/api/chat/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, session_id: sessionId }),
    });
    const data = await res.json();
    setIsTyping(false);

    const botMsg = {
      id: Date.now() + 1,
      text: data.bot_response,
      sender: "bot",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, botMsg]);

    if (data.next_action === "upload_docs") {
      setCanUpload(true);
    }

    // optional: save stage
    await fetch("/api/session/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: sessionId,
        stage: canUpload ? "documents" : "chat",
      }),
    });
  };

  const handleUploaded = async (ocrData) => {
    setCanUpload(false);

    const infoMsg = {
      id: Date.now(),
      text: "Document submitted ✅",
      sender: "user",
      timestamp: new Date(),
    };
    const followupMsg = {
      id: Date.now() + 1,
      text: "Thanks for uploading your documents. I’m checking your eligibility and EMI options now.",
      sender: "bot",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, infoMsg, followupMsg]);

    await fetch("/api/session/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId, stage: "docs_uploaded" }),
    });
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
