"use client";

import { useState } from "react";

interface Message {
  id: string;
  sender: "bot" | "user";
  text: string;
}

interface ChatbotProps {
  role: "admin" | "user";
  title?: string;
}

export default function Chatbot({ role, title = "IND-SPHINX AI Assistant" }: ChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      sender: "bot",
      text: role === "admin"
        ? "Greetings Admin. I am ready to assist with system logs, user access audits, and server status checks."
        : "Hello! I am your IND-SPHINX Corporate Assistant. How can I assist you with your workspace or MFA settings today?",
    },
  ]);
  const [input, setInput] = useState("");

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), sender: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    // Simulated Bot Response
    setTimeout(() => {
      let botReply = "I have received your query and logged it for security compliance.";
      if (role === "admin") {
        botReply = "Admin command acknowledged. Running operational analysis on system metrics...";
      } else {
        botReply = "Thank you for reaching out. Please check your employee dashboard or contact IT support for further escalation.";
      }
      setMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), sender: "bot", text: botReply }]);
    }, 1000);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold px-5 py-3.5 rounded-full shadow-2xl hover:scale-105 hover:brightness-110 transition-all border border-cyan-400/30"
        >
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          {role === "admin" ? "Admin AI Terminal" : "AI Assistant"}
        </button>
      ) : (
        <div className="w-80 sm:w-96 bg-slate-900/95 border border-cyan-500/30 rounded-2xl shadow-2xl backdrop-blur-xl flex flex-col h-[480px] overflow-hidden">
          {/* Header */}
          <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">{title}</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white text-sm font-bold px-2 py-1"
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 font-sans text-xs">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-xl p-3 ${
                    msg.sender === "user"
                      ? "bg-blue-600 text-white rounded-br-none"
                      : "bg-slate-800 text-slate-200 border border-slate-700/60 rounded-bl-none"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSend} className="p-3 bg-slate-950/90 border-t border-slate-800 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask AI Assistant..."
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
            />
            <button
              type="submit"
              className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-3 py-2 rounded-lg text-xs transition-colors"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
