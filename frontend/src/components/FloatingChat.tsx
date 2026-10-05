"use client";

import React, { useState, useRef, useEffect } from "react";
import { History, MessageSquare, Trash2, ArrowLeft, X, Send, Plus } from "lucide-react";

interface Message {
  sender: "user" | "bot";
  text: string;
  time: string;
}

interface ChatSession {
  id: string;
  title: string;
  time: string;
  messages: Message[];
}

interface FloatingChatProps {
  role?: "user" | "admin";
  title?: string;
}

function createChatSessionId(): string {
  return `session-${Date.now()}`;
}

export default function FloatingChat({
  role = "user",
  title = "Ind Sphinx IT Assistant",
}: FloatingChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([
    {
      id: "session-1",
      title: "Enterprise Security Query",
      time: "03:18 PM",
      messages: [
        {
          sender: "bot",
          text: `Hello! I am your ${title}.\nHow can I assist with your technical or security queries today?`,
          time: "03:18 PM",
        },
      ],
    },
  ]);
  const [activeSessionId, setActiveSessionId] = useState<string>("session-1");
  const [inputQuery, setInputQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeSession?.messages, showHistory, isOpen, loading]);

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const fetchChatResponse = async (userQuery: string): Promise<string> => {
    const headers = new Headers({ "Content-Type": "application/json" });
    if (role === "admin") {
      const token = localStorage.getItem("access_token");
      if (token) headers.set("Authorization", `Bearer ${token}`);
    }

    const response = await fetch("/api/chat", {
      method: "POST",
      headers,
      body: JSON.stringify({
        message: userQuery,
        role,
        history: activeSession.messages.map(({ sender, text }) => ({ sender, text })),
      }),
    });
    const data: { response?: string; error?: string } = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || "The assistant could not respond right now.");
    }
    if (typeof data.response !== "string" || !data.response.trim()) {
      throw new Error("The assistant returned an empty response. Please try again.");
    }

    return data.response;
  };

  const handleSend = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const query = customText || inputQuery;
    if (!query.trim() || loading) return;

    const time = getCurrentTime();

    setSessions((prev) =>
      prev.map((session) => {
        if (session.id === activeSessionId) {
          const isDefaultTitle =
            session.title === "New Conversation" || session.title === "Enterprise Security Query";
          const newTitle = isDefaultTitle ? query.slice(0, 20) : session.title;
          return {
            ...session,
            title: newTitle,
            messages: [...session.messages, { sender: "user", text: query, time }],
          };
        }
        return session;
      })
    );

    if (!customText) setInputQuery("");

    setLoading(true);

    try {
      const botResponseText = await fetchChatResponse(query);
      setSessions((prev) =>
        prev.map((session) => session.id === activeSessionId
          ? { ...session, messages: [...session.messages, { sender: "bot", text: botResponseText, time: getCurrentTime() }] }
          : session
        )
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "The assistant could not respond right now.";
      setSessions((prev) =>
        prev.map((session) => session.id === activeSessionId
          ? { ...session, messages: [...session.messages, { sender: "bot", text: errorMessage, time: getCurrentTime() }] }
          : session
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = () => {
    const newId = createChatSessionId();
    const newSession: ChatSession = {
      id: newId,
      title: "New Conversation",
      time: getCurrentTime(),
      messages: [
        {
          sender: "bot",
          text: `Hello! I am your ${title}.\nHow can I assist with your technical support today?`,
          time: getCurrentTime(),
        },
      ],
    };
    setSessions([newSession, ...sessions]);
    setActiveSessionId(newId);
    setShowHistory(false);
  };

  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const filtered = sessions.filter((s) => s.id !== id);
    if (filtered.length === 0) {
      handleNewChat();
    } else {
      setSessions(filtered);
      if (activeSessionId === id) {
        setActiveSessionId(filtered[0].id);
      }
    }
  };

  return (
    <>
      {/* Full-Screen Immersive AI Assistant Window */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-[#020617]/98 backdrop-blur-3xl flex flex-col text-left overflow-hidden animate-fadeIn">
          
          {/* Top Navigation Bar spanning full width */}
          <div className="bg-slate-900/95 px-6 py-4 border-b border-cyan-500/30 flex items-center justify-between shrink-0 shadow-[0_4px_30px_rgba(0,0,0,0.8)]">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-2xl bg-slate-950 border-2 border-cyan-400/80 flex items-center justify-center font-black text-base text-cyan-300 tracking-wider shadow-[0_0_20px_rgba(6,182,212,0.4)]">
                AI
              </div>
              <div>
                <h3 className="text-base font-black text-white tracking-wide flex items-center gap-2.5">
                  <span>{title}</span>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400 text-cyan-300 font-mono font-bold">
                    FULLSCREEN ASSISTANT
                  </span>
                </h3>
                <p className="text-xs text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-2 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{role === "admin" ? "Dynamic Enterprise Admin AI" : "Employee IT Support AI Desk"}</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-slate-400 normal-case font-medium">Ready to solve queries instantly</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowHistory(!showHistory)}
                className="text-xs bg-slate-950 hover:bg-slate-800 text-slate-200 hover:text-white px-4 py-2.5 rounded-xl border border-slate-700 font-bold flex items-center gap-2 transition-all shadow-sm cursor-pointer"
              >
                <History className="w-4 h-4 text-cyan-400" />
                <span>Chat History</span>
                <span className="bg-cyan-500/20 text-cyan-300 text-xs px-2 py-0.5 rounded-md font-extrabold border border-cyan-500/30">
                  {sessions.length}
                </span>
              </button>

              <button
                type="button"
                onClick={handleNewChat}
                className="text-xs bg-slate-950 hover:bg-slate-800 text-slate-200 hover:text-white px-4 py-2.5 rounded-xl border border-slate-700 font-bold flex items-center gap-2 transition-all shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4 text-cyan-400" />
                <span>New Conversation</span>
              </button>

              {/* Large, Prominent Close Cross Button */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-11 h-11 rounded-2xl bg-rose-500/15 hover:bg-rose-500/30 border-2 border-rose-500/50 hover:border-rose-400 text-rose-300 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-[0_0_20px_rgba(244,63,94,0.35)] active:scale-95 ml-2"
                title="Close AI Fullscreen Window (Esc)"
              >
                <X className="w-6 h-6 stroke-[2.5]" />
              </button>
            </div>
          </div>

          {/* Body Section */}
          {showHistory ? (
            <div className="flex-1 overflow-y-auto p-6 max-w-4xl w-full mx-auto space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
                <button
                  type="button"
                  onClick={() => setShowHistory(false)}
                  className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-2 font-black cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to Chat
                </button>
                <span className="text-xs text-slate-400 uppercase font-black tracking-wider">
                  Saved Chat Conversations
                </span>
              </div>

              {sessions.map((s) => (
                <div
                  key={s.id}
                  onClick={() => {
                    setActiveSessionId(s.id);
                    setShowHistory(false);
                  }}
                  className={`p-4 rounded-2xl border-2 flex items-center justify-between cursor-pointer transition-all ${
                    s.id === activeSessionId
                      ? "bg-slate-900 border-cyan-400 text-white shadow-[0_0_20px_rgba(6,182,212,0.25)]"
                      : "bg-slate-950/70 border-slate-800 text-slate-400 hover:bg-slate-900 hover:text-slate-200 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-3.5 truncate">
                    <MessageSquare className="w-5 h-5 text-cyan-400 shrink-0" />
                    <div className="truncate">
                      <div className="truncate text-sm font-bold text-slate-200">{s.title}</div>
                      <div className="text-xs text-slate-500 font-semibold">{s.time}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => handleDeleteSession(s.id, e)}
                    className="text-slate-500 hover:text-rose-400 p-2 transition-colors cursor-pointer"
                    title="Delete Chat"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden max-w-5xl w-full mx-auto px-4 sm:px-8 py-4">
              
              {/* Quick Prompt Chips */}
              <div className="py-2.5 flex items-center gap-2.5 overflow-x-auto shrink-0 border-b border-slate-800/80 mb-4">
                <span className="text-xs text-slate-500 font-black uppercase shrink-0">Quick Topics:</span>
                <button
                  type="button"
                  onClick={() => handleSend(undefined, "How to reset my login password?")}
                  className="bg-slate-900/90 hover:bg-slate-800 text-cyan-300 hover:text-cyan-200 px-4 py-2 rounded-xl border border-cyan-500/30 whitespace-nowrap transition-all font-bold text-xs cursor-pointer shadow-sm active:scale-95"
                >
                  🔑 Password Reset Help
                </button>
                <button
                  type="button"
                  onClick={() => handleSend(undefined, "Company network and Wi-Fi not working")}
                  className="bg-slate-900/90 hover:bg-slate-800 text-cyan-300 hover:text-cyan-200 px-4 py-2 rounded-xl border border-cyan-500/30 whitespace-nowrap transition-all font-bold text-xs cursor-pointer shadow-sm active:scale-95"
                >
                  🌐 Network & Wi-Fi Issue
                </button>
                <button
                  type="button"
                  onClick={() => handleSend(undefined, "Printer offline or paper jam")}
                  className="bg-slate-900/90 hover:bg-slate-800 text-cyan-300 hover:text-cyan-200 px-4 py-2 rounded-xl border border-cyan-500/30 whitespace-nowrap transition-all font-bold text-xs cursor-pointer shadow-sm active:scale-95"
                >
                  🖨️ Printer Support
                </button>
                <button
                  type="button"
                  onClick={() => handleSend(undefined, "Software crash and application installation")}
                  className="bg-slate-900/90 hover:bg-slate-800 text-cyan-300 hover:text-cyan-200 px-4 py-2 rounded-xl border border-cyan-500/30 whitespace-nowrap transition-all font-bold text-xs cursor-pointer shadow-sm active:scale-95"
                >
                  💻 Software & PC Problem
                </button>
              </div>

              {/* Chat Messages Stream - Spacious & High Readability */}
              <div className="flex-1 overflow-y-auto space-y-6 pr-2 select-text">
                {activeSession.messages.map((m, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[80%] px-5 py-4 rounded-3xl whitespace-pre-line leading-relaxed text-[15px] select-text shadow-lg ${
                        m.sender === "user"
                          ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black rounded-tr-none shadow-[0_6px_25px_rgba(6,182,212,0.4)]"
                          : "bg-slate-900/95 text-slate-100 font-semibold border-2 border-slate-800 rounded-tl-none shadow-md backdrop-blur-md"
                      }`}
                    >
                      {m.text}
                    </div>
                    <span className="text-xs text-slate-500 mt-1.5 font-bold px-2">
                      {m.time}
                    </span>
                  </div>
                ))}

                {loading && (
                  <div className="flex items-center gap-2 text-cyan-400 text-sm font-bold animate-pulse px-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                    <span>AI Assistant is analyzing and preparing answer...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Large Fullscreen Input Box */}
              <form
                onSubmit={(e) => handleSend(e)}
                className="mt-4 p-3 bg-slate-900/90 border-2 border-cyan-500/40 rounded-2xl flex items-center gap-3 shadow-[0_0_30px_rgba(6,182,212,0.15)] shrink-0"
              >
                <input
                  type="text"
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  placeholder="Type your message or ask any IT problem query..."
                  className="flex-1 bg-transparent px-4 py-3 text-base text-white placeholder-slate-400 outline-none font-semibold select-text"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-gradient-to-r from-cyan-400 via-cyan-500 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-slate-950 font-black px-6 py-3.5 rounded-xl text-sm shadow-[0_0_20px_rgba(6,182,212,0.4)] active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer uppercase tracking-wider"
                >
                  <span>Send</span>
                  <Send className="w-4 h-4 stroke-[2.5]" />
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 rounded-2xl flex items-center justify-center shadow-[0_0_25px_rgba(6,182,212,0.5)] border-2 border-cyan-300/60 transition-all z-50 active:scale-95"
        title="Toggle AI Assistant"
      >
        {isOpen ? (
          <X className="w-7 h-7 text-slate-950 stroke-[2.5]" />
        ) : (
          <div className="relative flex items-center justify-center">
            <span className="font-black text-lg text-slate-950 tracking-tighter">AI</span>
            <span className="absolute -top-1 -right-2 w-3 h-3 bg-emerald-400 border-2 border-slate-950 rounded-full animate-pulse" />
          </div>
        )}
      </button>
    </>
  );
}