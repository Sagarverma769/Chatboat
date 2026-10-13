"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import {
  AlertTriangle,
  CheckCircle2,
  History,
  MessageSquare,
  Trash2,
  ArrowLeft,
  Send,
  Plus,
  CornerDownRight,
} from "lucide-react";

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

const quickTopicOptions = [
  "Hardware Issues",
  "Software Issues",
  "Printer Issues",
  "Computer Issues",
  "SAP / ERP Issues",
];

function createChatSessionId(): string {
  return `session-${Date.now()}`;
}

function createWelcomeChatSession(time: string): ChatSession {
  return {
    id: createChatSessionId(),
    title: "New Conversation",
    time,
    messages: [
      {
        sender: "bot",
        text: "Welcome to Saarthi AI. What can I help you with today?",
        time,
      },
    ],
  };
}

/**
 * Intelligent renderer for Bot Messages:
 * - Bold actionable header
 * - Selection menus rendered as Gemini cards with dots (NO 1 2 3 4 numbers)
 * - Troubleshooting steps rendered with clean bullet dots (•), normal text, NO cards
 * - Interactive follow-up options with direct ticket opening
 */
function BotMessageRenderer({
  text,
  onOptionClick,
  onRaiseTicket,
}: {
  text: string;
  onOptionClick: (opt: string) => void;
  onRaiseTicket: () => void;
}) {
  // Check if text ends with follow-up question
  const followUpRegex = /Did this resolve your issue, or would you like further assistance\?/i;
  const followUpMatch = text.match(followUpRegex);
  let mainBody = text;
  let hasFollowUp = false;

  if (followUpMatch && followUpMatch.index !== undefined) {
    mainBody = text.slice(0, followUpMatch.index).trim();
    hasFollowUp = true;
  }

  const lines = mainBody.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) {
    return <div className="text-slate-700 font-normal">{text}</div>;
  }

  // Determine if this is a troubleshooting solution
  const isSolution =
    /recommended steps|to fix|steps to|steps for/i.test(lines[0]) ||
    lines[0].toLowerCase().startsWith("here are");

  // Determine if this is an interactive menu
  const isMenu =
    !isSolution &&
    (/please select|issues:|menu|choose|categories/i.test(lines[0]) ||
      lines[0].includes("?") ||
      lines.slice(1).some((l) =>
        /^[•\-\*\d\.]+\s*(?:Keyboard|Monitor|Mouse|Power|Overheating|Audio|Storage|RAM|App|Windows|Slow|Install|Virus|Blue|Browser|File|Printer|SAP|Computer|Hardware|Software|Laptop|Battery|Sudden|Charger|Raise)/i.test(
          l
        )
      ));

  const headerLines: string[] = [];
  const listItems: string[] = [];
  const otherLines: string[] = [];

  for (const line of lines) {
    // Match bullet dots (•, -, *) or numbered items (1., 2., etc.)
    const itemMatch = line.match(/^(?:[•\-\*]|\d{1,2}[\.\)])\s*(.*)$/);
    if (itemMatch) {
      listItems.push(itemMatch[1].trim());
    } else if (listItems.length === 0) {
      headerLines.push(line);
    } else {
      otherLines.push(line);
    }
  }

  return (
    <div className="space-y-3.5 select-text">
      {/* Header Prompt - Bold and prominent */}
      {headerLines.length > 0 && (
        <div className="font-extrabold text-slate-900 text-[18px] sm:text-[20px] leading-snug tracking-wide">
          {headerLines.join("\n")}
        </div>
      )}

      {/* Selection Menu: Rendered as Gemini cards with dots (NO 1 2 3 4 numbers) */}
      {isMenu && listItems.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          {listItems.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                if (
                  item.toLowerCase().includes("raise it support ticket") ||
                  item.toLowerCase().includes("generate ticket")
                ) {
                  onRaiseTicket();
                } else {
                  onOptionClick(item);
                }
              }}
              className="w-full text-left bg-white hover:bg-blue-50 active:bg-blue-100 border border-blue-300 hover:border-blue-500 text-black px-4 py-2.5 rounded-xl font-medium text-[15px] flex items-center justify-between gap-3 transition-all cursor-pointer shadow-sm group active:scale-[0.99]"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-2 h-2 rounded-full bg-slate-900 shrink-0 group-hover:scale-125 transition-transform" />
                <span className="font-semibold text-black truncate">
                  {item}
                </span>
              </div>
              <CornerDownRight className="w-4 h-4 text-blue-700 shrink-0 group-hover:translate-x-0.5 transition-transform" />
            </button>
          ))}
        </div>
      )}

      {/* Troubleshooting Steps: Rendered as clean bullet dots (•), normal text, NO cards */}
      {!isMenu && listItems.length > 0 && (
        <div className="space-y-2.5 pt-1">
          {listItems.map((item, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 text-[14.5px] text-slate-700 font-normal leading-relaxed"
            >
              <span className="text-cyan-400 text-lg leading-none select-none mt-0.5">•</span>
              <span className="flex-1">{item}</span>
            </div>
          ))}
        </div>
      )}

      {/* Trailing descriptive text */}
      {otherLines.length > 0 && (
        <div className="text-sm text-slate-700 font-normal leading-relaxed pt-1 whitespace-pre-line">
          {otherLines.join("\n")}
        </div>
      )}

      {/* Interactive Follow-up Prompt */}
      {hasFollowUp && (
        <div className="mt-4 pt-3.5 border-t border-cyan-500/25">
          <p className="text-xs font-bold text-cyan-300 uppercase tracking-wider mb-2.5">
            Did this resolve your issue, or would you like further assistance?
          </p>
          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => onOptionClick("Yes, Problem Solved")}
              className="bg-white hover:bg-blue-50 active:bg-blue-100 text-black border border-blue-300 hover:border-blue-500 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm group"
            >
              <span>✅ Yes, Problem Solved</span>
              <CornerDownRight className="w-3.5 h-3.5 text-blue-700 shrink-0 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              type="button"
              onClick={() => onOptionClick("Still Facing Issue")}
              className="bg-white hover:bg-blue-50 active:bg-blue-100 text-black border border-blue-300 hover:border-blue-500 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm group"
            >
              <span>🔄 Still Facing Issue</span>
              <CornerDownRight className="w-3.5 h-3.5 text-blue-700 shrink-0 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              type="button"
              onClick={onRaiseTicket}
              className="bg-white hover:bg-blue-50 active:bg-blue-100 text-black border border-blue-300 hover:border-blue-500 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm group"
            >
              <span>📩 Raise IT Support Ticket</span>
              <CornerDownRight className="w-3.5 h-3.5 text-blue-700 shrink-0 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function FloatingChat({
  role = "user",
  title = "Saarthi",
}: FloatingChatProps) {
  const [isOpen, setIsOpen] = useState(role === "user");
  const [showHistory, setShowHistory] = useState(false);
  const [showClearConfirmation, setShowClearConfirmation] = useState(false);
  const [chatDeletedNotice, setChatDeletedNotice] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([
    {
      id: "session-1",
      title: "New Conversation",
      time: "10:00 AM",
      messages: [
        {
          sender: "bot",
          text: "Welcome to Saarthi AI. How can I help you with today?",
          time: "10:00 AM",
        },
      ],
    },
  ]);
  const [activeSessionId, setActiveSessionId] = useState<string>("session-1");
  const [inputQuery, setInputQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];
  const displayTitle = role === "user" ? "Welcome to IT Chatboat (Saarthi)" : title;
  const raiseTicketLabel = role === "user" ? "RAISE CHATBOT COMPLAINT TO IT TEAM" : "RAISE IT TICKET";

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeSession?.messages, showHistory, isOpen, loading]);

  useEffect(() => {
    if (!chatDeletedNotice) return;
    const timeoutId = window.setTimeout(() => setChatDeletedNotice(false), 4000);
    return () => window.clearTimeout(timeoutId);
  }, [chatDeletedNotice]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const openChatbot = () => setIsOpen(true);

  const handleRaiseTicketClick = () => {
    if (typeof window !== "undefined") {
      if (window.location.pathname !== "/user") {
        window.location.href = "/user#support-ticket-desk";
      } else {
        const el = document.getElementById("support-ticket-desk");
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
          setTimeout(() => {
            const input = document.getElementById("ticket-description-input");
            input?.focus();
          }, 350);
        }
      }
    }
    setIsOpen(false);
  };

  useEffect(() => {
    const openEvent = () => setIsOpen(true);
    window.addEventListener("chatbot:open", openEvent);
    return () => window.removeEventListener("chatbot:open", openEvent);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

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
            session.title === "New Conversation" ||
            session.title === "IT Support Assistant" ||
            session.title === "Saarthi";
          const newTitle = isDefaultTitle ? query.slice(0, 22) : session.title;
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
        prev.map((session) =>
          session.id === activeSessionId
            ? {
                ...session,
                messages: [
                  ...session.messages,
                  { sender: "bot", text: botResponseText, time: getCurrentTime() },
                ],
              }
            : session
        )
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "The assistant could not respond right now.";
      setSessions((prev) =>
        prev.map((session) =>
          session.id === activeSessionId
            ? {
                ...session,
                messages: [
                  ...session.messages,
                  { sender: "bot", text: errorMessage, time: getCurrentTime() },
                ],
              }
            : session
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = () => {
    const newSession = createWelcomeChatSession(getCurrentTime());
    setSessions([newSession, ...sessions]);
    setActiveSessionId(newSession.id);
    setShowHistory(false);
  };

  const handleClearChat = () => {
    if (loading) return;

    const newSession = createWelcomeChatSession(getCurrentTime());
    setSessions((currentSessions) => [
      newSession,
      ...currentSessions.filter((session) => session.id !== activeSessionId),
    ]);
    setActiveSessionId(newSession.id);
    setInputQuery("");
    setShowHistory(false);
    setShowClearConfirmation(false);
    setChatDeletedNotice(true);
  };

  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const filtered = sessions.filter((s) => s.id !== id);
    if (filtered.length === 0) {
      const newSession = createWelcomeChatSession(getCurrentTime());
      setSessions([newSession]);
      setActiveSessionId(newSession.id);
      setShowHistory(false);
    } else {
      setSessions(filtered);
      if (activeSessionId === id) {
        setActiveSessionId(filtered[0].id);
      }
    }
    setChatDeletedNotice(true);
  };

  return (
    <>
      {chatDeletedNotice && (
        <div
          role="status"
          aria-live="polite"
          className="fixed right-5 top-5 z-[70] flex items-center gap-2.5 rounded-xl border border-emerald-300 bg-white px-4 py-3 text-sm font-semibold text-emerald-800 shadow-xl"
        >
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
          <span>Chat deleted successfully.</span>
          <button
            type="button"
            onClick={() => setChatDeletedNotice(false)}
            aria-label="Dismiss notification"
            className="ml-2 cursor-pointer rounded px-1 text-emerald-700 hover:bg-emerald-50"
          >
            ×
          </button>
        </div>
      )}

      {/* Full-screen support workspace */}
      {isOpen && (
        <div className="chatbot-workspace fixed inset-0 z-50 flex h-[100dvh] w-full animate-fadeIn">
            {/* Top Navigation Bar with Distinct Header Styling */}
            <div className="relative flex h-full min-h-0 w-full flex-col overflow-hidden bg-sky-50 text-left text-slate-900">
              <div className="bg-white px-4 py-3 border-b border-sky-200 flex items-center justify-between gap-4 shrink-0 shadow-sm sm:px-6 sm:py-3.5">
                <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                  {role === "user" && (
                    <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-100 via-white to-blue-100 shadow-sm sm:h-14 sm:w-14">
                      <div className="absolute inset-1 rounded-xl border border-cyan-200/70" />
                      <Image
                        src="/chatbot-avatar.svg"
                        alt="Chatbot"
                        width={56}
                        height={56}
                        priority
                        className="relative h-11 w-11 object-contain sm:h-[52px] sm:w-[52px]"
                      />
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <h3 className="text-base font-black tracking-wide text-slate-900 sm:text-xl">
                        {displayTitle}
                      </h3>
                      {role !== "user" && (
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400 text-cyan-300 font-mono font-bold">
                          ASSISTANT DESK
                        </span>
                      )}
                    </div>
                    {role === "admin" && (
                      <p className="mt-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-cyan-700 sm:text-xs">
                        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span>Enterprise Admin AI</span>
                      </p>
                    )}
                    {role === "user" && (
                      <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.14em] text-black sm:text-[10px]">
                        Designed by IT Team
                      </p>
                    )}
                  </div>
                </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setShowHistory(!showHistory)}
                  className="text-xs bg-white hover:bg-sky-100 text-slate-700 hover:text-slate-900 px-3 sm:px-4 py-2.5 rounded-xl border border-slate-200 font-bold flex items-center gap-2 transition-all shadow-sm cursor-pointer"
                  title="View Chat History"
                >
                  <History className="w-4 h-4 text-cyan-400" />
                  <span className="hidden sm:inline">History</span>
                  <span className="bg-cyan-500/20 text-cyan-300 text-xs px-1.5 py-0.5 rounded-md font-extrabold border border-cyan-500/30">
                    {sessions.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleNewChat}
                  className="text-xs bg-white hover:bg-sky-100 text-slate-700 hover:text-slate-900 px-3 sm:px-4 py-2.5 rounded-xl border border-slate-200 font-bold flex items-center gap-2 transition-all shadow-sm cursor-pointer"
                  title="Start New Conversation"
                >
                  <Plus className="w-4 h-4 text-cyan-400" />
                  <span className="hidden sm:inline">New Chat</span>
                </button>

                {activeSession.messages.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setShowClearConfirmation(true)}
                    disabled={loading}
                    className="text-xs bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-700 px-3 sm:px-4 py-2.5 rounded-xl border border-slate-200 font-bold flex items-center gap-2 transition-all shadow-sm cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                    title="Clear current conversation"
                  >
                    <Trash2 className="w-4 h-4 text-rose-500" />
                    <span className="hidden sm:inline">Clear Chat</span>
                  </button>
                )}

              </div>
            </div>

            {/* Body Section */}
            {!showHistory && (
                <div className="shrink-0 border-b border-sky-100 bg-sky-50 px-4 py-2.5 sm:px-6">
                  <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-600">
                    <span className="text-slate-700">Quick Topics:</span>
                    <div className="flex flex-wrap gap-2">
                      {quickTopicOptions.map((topic) => (
                        <button
                          key={topic}
                          type="button"
                          onClick={() => handleSend(undefined, topic)}
                          className="cursor-pointer rounded-full border border-sky-300 bg-transparent px-3 py-1.5 text-xs font-semibold text-slate-700 transition-all hover:border-cyan-500 hover:bg-cyan-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 active:scale-[0.99]"
                        >
                          {topic}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

            {showClearConfirmation && (
              <div
                className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"
                role="presentation"
                onClick={() => setShowClearConfirmation(false)}
              >
                <div
                  className="w-full max-w-md rounded-2xl border-2 border-rose-300 bg-white p-6 shadow-[0_12px_40px_rgba(239,68,68,0.2)]"
                  role="alertdialog"
                  aria-modal="true"
                  aria-labelledby="clear-chat-title"
                  aria-describedby="clear-chat-description"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="mb-3 flex items-center gap-3 text-rose-700">
                    <AlertTriangle className="h-6 w-6 shrink-0" />
                    <h2 id="clear-chat-title" className="text-base font-black">
                      Clear Chat History?
                    </h2>
                  </div>
                  <p id="clear-chat-description" className="mb-5 text-sm leading-relaxed text-slate-700">
                    Are you sure you want to permanently clear this conversation? It will be removed from your chat history.
                  </p>
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowClearConfirmation(false)}
                      className="cursor-pointer rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleClearChat}
                      className="flex cursor-pointer items-center gap-2 rounded-xl border border-rose-300 bg-rose-50 px-4 py-2 text-xs font-black text-rose-700 transition-colors hover:border-rose-400 hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Confirm Clear</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {showHistory ? (
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 w-full space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-4">
                  <button
                    type="button"
                    onClick={() => setShowHistory(false)}
                    className="text-sm text-cyan-700 hover:text-cyan-900 flex items-center gap-2 font-black cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back to Chat
                  </button>
                  <span className="text-xs text-slate-600 uppercase font-black tracking-wider">
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
                        ? "bg-sky-100 border-cyan-500 text-slate-900 shadow-sm"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-sky-50 hover:text-slate-900 hover:border-sky-300"
                    }`}
                  >
                    <div className="flex items-center gap-3.5 truncate">
                      <MessageSquare className="w-5 h-5 text-cyan-400 shrink-0" />
                      <div className="truncate">
                        <div className="truncate text-sm font-bold text-slate-800">{s.title}</div>
                        <div className="text-xs text-slate-500 font-semibold">{s.time}</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteSession(s.id, e)}
                      className="text-slate-500 hover:text-rose-600 p-2 transition-colors cursor-pointer"
                      title="Delete Chat"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex flex-col overflow-hidden w-full">
                {/* Chat Messages Stream - Spacious & High Readability */}
                <div className="flex-1 overflow-y-auto space-y-2.5 px-4 sm:px-6 py-2 select-text">
                  {activeSession.messages.map((m, idx) => (
                    <div
                      key={idx}
                      className={`flex w-full flex-col ${
                        m.sender === "user" ? "items-end" : "items-start"
                      }`}
                    >
                      <div
                        className={`${
                          m.sender === "bot"
                            ? "w-full max-w-[98%]"
                            : "max-w-[95%] sm:max-w-[90%]"
                        } px-5 py-2.5 rounded-3xl select-text shadow-lg ${
                          m.sender === "user"
                            ? "bg-gradient-to-r from-cyan-400 via-cyan-500 to-blue-600 text-slate-950 font-black rounded-tr-none shadow-[0_4px_20px_rgba(6,182,212,0.35)] text-[15px] sm:text-[16px] leading-relaxed"
                            : "bg-white text-slate-800 border border-sky-200 rounded-tl-none shadow-sm"
                        }`}
                      >
                        {m.sender === "user" ? (
                          <div className="whitespace-pre-line">{m.text}</div>
                        ) : (
                          <BotMessageRenderer
                            text={m.text}
                            onOptionClick={(opt) => handleSend(undefined, opt)}
                            onRaiseTicket={handleRaiseTicketClick}
                          />
                        )}
                      </div>
                      {m.sender === "bot" &&
                        !(idx === 0 && activeSession.messages.length === 1) && (
                          <span className="text-xs text-slate-500 mt-1 font-bold px-2">
                            {m.time}
                          </span>
                        )}
                    </div>
                  ))}

                  {loading && (
                    <div className="flex items-center gap-2.5 text-cyan-400 text-sm font-bold animate-pulse px-2 py-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                      <span>AI Assistant is analyzing and preparing answer...</span>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Form with Numeric & Text Support */}
                <div className="p-3 sm:p-4 bg-white border-t border-sky-200 space-y-3 shrink-0">
                  <form onSubmit={(e) => handleSend(e)} className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                    <input
                      type="text"
                      value={inputQuery}
                      onChange={(e) => setInputQuery(e.target.value)}
                      placeholder="Type your message or ask any IT problem..."
                      className="min-w-[220px] flex-1 bg-sky-50 border border-sky-200 focus:border-cyan-500 rounded-xl px-4 py-3.5 text-base sm:text-lg text-slate-900 placeholder-slate-500 outline-none transition-all font-medium select-text"
                    />
                    <button
                      type="submit"
                      disabled={loading}
                      className="order-2 mx-auto flex h-12 w-fit shrink-0 items-center justify-center gap-2 rounded-xl border border-blue-400 bg-white px-4 text-[11px] font-black uppercase tracking-wide text-black shadow-sm transition-all hover:bg-blue-50 hover:border-blue-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 sm:order-none sm:mx-0"
                    >
                      <span>Send</span>
                      <Send className="w-4 h-4 stroke-[2.5]" />
                    </button>
                    {role === "user" && (
                      <button
                        type="button"
                        onClick={handleRaiseTicketClick}
                        className="order-3 mx-auto flex h-12 w-fit max-w-[210px] shrink-0 items-center justify-center rounded-xl border border-blue-400 bg-white px-3 text-center text-[10px] font-black uppercase leading-tight tracking-wide text-black shadow-sm transition-all hover:bg-blue-50 hover:border-blue-600 active:scale-95 cursor-pointer sm:order-none sm:mx-0 sm:text-[11px]"
                      >
                        {raiseTicketLabel}
                      </button>
                    )}
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}