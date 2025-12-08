"use client";

import { useState } from "react";

export default function InputField({ onSend }) {
  const [value, setValue] = useState("");

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setValue("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-3 border-t bg-[#103766] rounded-3xl flex items-center gap-2">
      <textarea
        rows={1}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask about your loan, EMI, eligibility..."
        className="flex-1 resize-none text-white rounded-2xl border-1 border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFE45E ] focus:border-transparent"
      />
      <button
        onClick={handleSend}
        className="shrink-0 rounded-full bg-white text-[#103766] hover:bg-[#103766] hover:text-white hover:border-white border border-[#1e3a8a] px-4 py-2 text-sm font-medium transition"
      >
        Send
      </button>
    </div>
  );
}
