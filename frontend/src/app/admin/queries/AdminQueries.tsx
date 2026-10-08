"use client";

import React, { useState, useEffect } from "react";
import {
  Inbox,
  RotateCw,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  User,
  MapPin,
  Send,
  Sparkles,
  Trash2,
  Check,
  Hash,
  MessageSquare,
  ShieldCheck,
  X
} from "lucide-react";

export interface ITTicket {
  id: string;
  unit: string;
  location: string;
  userName: string;
  userEmail: string;
  employeeCode?: string;
  deviceIp?: string;
  title: string;
  description: string;
  status: "Pending" | "In Progress" | "Remote Connected" | "Resolved";
  resolutionNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminQueries() {
  const [tickets, setTickets] = useState<ITTicket[]>([]);
  const [loading, setLoading] = useState(false);
  const [ticketLoadError, setTicketLoadError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Pending" | "Resolved">("All");

  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<string>("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [ticketToDelete, setTicketToDelete] = useState<ITTicket | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const fetchTickets = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch("/api/tickets?admin=true", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Failed to load backend tickets.");
      const nextTickets = Array.isArray(data.tickets) ? (data.tickets as ITTicket[]) : [];
      setTickets((prev) => {
        if (
          prev.length === nextTickets.length &&
          prev.every(
            (t, i) =>
              t.id === nextTickets[i]?.id &&
              t.status === nextTickets[i]?.status &&
              t.resolutionNotes === nextTickets[i]?.resolutionNotes
          )
        ) {
          return prev;
        }
        return nextTickets;
      });
      setTicketLoadError(null);
    } catch (error) {
      console.error("Error fetching tickets:", error);
      setTicketLoadError(error instanceof Error ? error.message : "Ticket service is unavailable.");
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    void fetchTickets(true);
    const intervalId = window.setInterval(() => void fetchTickets(), 10000);
    return () => window.clearInterval(intervalId);
  }, []);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Reply to query and mark as Resolved
  const handleReplyAndResolve = async (ticket: ITTicket, customMessage?: string) => {
    const messageToSend = customMessage !== undefined ? customMessage : replyText;
    if (!messageToSend.trim()) {
      alert("Please enter a reply message for the user.");
      return;
    }

    setUpdatingId(ticket.id);
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch("/api/tickets", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          id: ticket.id,
          status: "Resolved",
          assignedMember: "IT Admin",
          resolutionNotes: messageToSend.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Failed to send reply.");
      const updated = data.ticket as ITTicket;

      setTickets((prev) => prev.map((t) => (t.id === ticket.id ? updated : t)));
      setActiveReplyId(null);
      setReplyText("");
      triggerToast(`Reply sent to ${ticket.userName || "user"} & marked as Resolved!`);
    } catch (error) {
      triggerToast(error instanceof Error ? error.message : "Failed to update query.");
    } finally {
      setUpdatingId(null);
    }
  };

  // Delete ticket so other admins don't get confused
  const confirmDeleteTicket = async () => {
    if (!ticketToDelete) return;
    const { id, userName } = ticketToDelete;
    setDeletingId(id);

    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`/api/tickets?id=${encodeURIComponent(id)}&admin=true`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok && response.status !== 204) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || "Failed to delete ticket.");
      }

      setTickets((prev) => prev.filter((t) => t.id !== id));
      triggerToast(`Query for ${userName || "user"} deleted.`);
      setTicketToDelete(null);
    } catch (error) {
      triggerToast(error instanceof Error ? error.message : "Failed to delete ticket.");
    } finally {
      setDeletingId(null);
    }
  };

  // Filter queries based on search & status
  const filteredTickets = tickets.filter((ticket) => {
    const matchesStatus =
      statusFilter === "All" ||
      (statusFilter === "Pending" && ticket.status !== "Resolved") ||
      (statusFilter === "Resolved" && ticket.status === "Resolved");

    const empCode = ticket.employeeCode || ticket.deviceIp || ticket.title || "";
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      !term ||
      ticket.userName.toLowerCase().includes(term) ||
      empCode.toLowerCase().includes(term) ||
      ticket.location.toLowerCase().includes(term) ||
      ticket.description.toLowerCase().includes(term) ||
      ticket.userEmail.toLowerCase().includes(term);

    return matchesStatus && matchesSearch;
  });

  const totalCount = tickets.length;
  const pendingCount = tickets.filter((t) => t.status !== "Resolved").length;
  const resolvedCount = tickets.filter((t) => t.status === "Resolved").length;

  return (
    <div className="space-y-6 text-left">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-950/95 border-2 border-emerald-400 text-emerald-200 px-5 py-3 rounded-2xl shadow-[0_0_25px_rgba(16,185,129,0.4)] flex items-center gap-3 text-xs font-black backdrop-blur-xl animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {ticketToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border-2 border-rose-500/50 p-6 shadow-[0_0_40px_rgba(244,63,94,0.3)]">
            <div className="flex items-center gap-3 text-rose-400 mb-3">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-base font-black text-white">Delete Query Record?</h3>
            </div>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              Are you sure you want to delete this query for{" "}
              <strong className="text-white">{ticketToDelete.userName}</strong> (Code:{" "}
              {ticketToDelete.employeeCode || ticketToDelete.deviceIp || "N/A"})? This removes the query permanently so other admins won’t see it.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setTicketToDelete(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteTicket}
                disabled={Boolean(deletingId)}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-black transition-all flex items-center gap-2 cursor-pointer shadow-lg active:scale-95"
              >
                {deletingId ? <RotateCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="bg-slate-900/90 border-2 border-cyan-500/50 rounded-3xl p-6 backdrop-blur-2xl shadow-[0_0_40px_rgba(6,182,212,0.15)] space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-cyan-500/20 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border-2 border-cyan-400/60 flex items-center justify-center text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <Inbox className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white uppercase tracking-wider">
                  IT HELPDESK & CHATBOT QUERIES
                </h2>
                <span className="text-xs px-2.5 py-0.5 rounded-md bg-cyan-500/20 border border-cyan-400 text-cyan-300 font-mono font-bold">
                  LIVE DESK
                </span>
              </div>
              <p className="text-xs text-slate-400 font-bold mt-1">
                View employee chatbot queries, send resolution replies, and manage records
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-cyan-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search name, code, room..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2.5 text-xs bg-slate-950 border border-cyan-500/40 focus:border-cyan-400 text-cyan-200 placeholder-slate-500 rounded-xl outline-none transition-all w-48 sm:w-64 font-bold shadow-inner"
              />
            </div>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={() => void fetchTickets(true)}
              className="px-4 py-2.5 rounded-xl bg-slate-950 border border-cyan-500/40 text-cyan-300 font-extrabold text-xs flex items-center gap-2 hover:bg-cyan-500/10 transition-all cursor-pointer active:scale-95"
            >
              <RotateCw className={`w-4 h-4 text-cyan-400 ${loading ? "animate-spin" : ""}`} />
              <span>{loading ? "Refreshing..." : "Refresh"}</span>
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-950/80 border border-cyan-500/30 rounded-2xl p-4 flex items-center gap-3.5 shadow-[0_0_20px_rgba(6,182,212,0.1)]">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
              <Inbox className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-extrabold uppercase text-slate-400">Total Queries</p>
              <p className="text-lg font-black text-white font-mono">{totalCount} Submitted</p>
            </div>
          </div>

          <div className="bg-slate-950/80 border border-amber-500/30 rounded-2xl p-4 flex items-center gap-3.5 shadow-[0_0_20px_rgba(245,158,11,0.1)]">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-extrabold uppercase text-slate-400">Pending Review</p>
              <p className="text-lg font-black text-amber-300 font-mono">{pendingCount} Action Needed</p>
            </div>
          </div>

          <div className="bg-slate-950/80 border border-emerald-500/30 rounded-2xl p-4 flex items-center gap-3.5 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-extrabold uppercase text-slate-400">Resolved</p>
              <p className="text-lg font-black text-emerald-300 font-mono">{resolvedCount} Completed</p>
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          {(["All", "Pending", "Resolved"] as const).map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setStatusFilter(filter)}
              className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                statusFilter === filter
                  ? "bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.4)]"
                  : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              {filter}
              {filter === "Pending" && pendingCount > 0 && (
                <span className="ml-2 px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px]">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Error message */}
        {ticketLoadError && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{ticketLoadError}</span>
          </div>
        )}

        {/* Queries List */}
        {filteredTickets.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-slate-800 rounded-2xl bg-slate-950/40">
            <Inbox className="w-12 h-12 text-slate-600 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-400">No queries found matching the criteria.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTickets.map((ticket) => {
              const isResolved = ticket.status === "Resolved";
              const isReplying = activeReplyId === ticket.id;
              const empCode = ticket.employeeCode || ticket.deviceIp || ticket.title || "N/A";

              return (
                <div
                  key={ticket.id}
                  className={`rounded-2xl border p-5 transition-all bg-slate-950/80 ${
                    isResolved
                      ? "border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.06)]"
                      : "border-cyan-500/40 hover:border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.08)]"
                  }`}
                >
                  {/* Top Bar: Employee Info & Action Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3 mb-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-300 font-black text-xs">
                          {ticket.userName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-xs font-black text-white flex items-center gap-2">
                            <span>{ticket.userName}</span>
                            <span className="font-mono text-cyan-300 bg-cyan-950/90 border border-cyan-500/40 px-2 py-0.5 rounded text-[11px] font-bold">
                              CODE: {empCode}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 font-bold flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-slate-500" />
                            <span>Location: {ticket.location}</span>
                            <span className="text-slate-600">•</span>
                            <span className="text-slate-500">{ticket.userEmail}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Status Badge */}
                      <span
                        className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${
                          isResolved
                            ? "bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                            : "bg-amber-500/20 border-amber-400 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.2)]"
                        }`}
                      >
                        {isResolved ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                            RESOLVED
                          </>
                        ) : (
                          <>
                            <Clock className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                            PENDING
                          </>
                        )}
                      </span>

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={() => setTicketToDelete(ticket)}
                        title="Delete query record"
                        className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 hover:text-rose-200 transition-all cursor-pointer flex items-center gap-1 text-[11px] font-bold active:scale-95"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>

                  {/* Complaint Description */}
                  <div className="space-y-1 mb-3">
                    <p className="text-[11px] font-black text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>User Query / Complaint regarding Chatbot:</span>
                    </p>
                    <p className="text-xs text-slate-200 leading-relaxed bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 font-medium">
                      {ticket.description}
                    </p>
                  </div>

                  {/* Existing Reply View (if already replied) */}
                  {ticket.resolutionNotes && !isReplying && (
                    <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-3.5 mb-3 flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-1.5 text-xs font-black text-emerald-300 mb-1">
                          <ShieldCheck className="w-4 h-4 text-emerald-400" />
                          <span>Admin Response (Sent to User):</span>
                        </div>
                        <p className="text-xs text-emerald-100 font-semibold leading-relaxed">
                          {ticket.resolutionNotes}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveReplyId(ticket.id);
                          setReplyText(ticket.resolutionNotes || "");
                        }}
                        className="px-3 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/50 text-emerald-200 text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap"
                      >
                        Update Reply
                      </button>
                    </div>
                  )}

                  {/* Reply Input Form (either when replying or if not resolved yet) */}
                  {(!ticket.resolutionNotes || isReplying) && (
                    <div className="mt-3 bg-slate-900/90 border border-cyan-500/30 rounded-xl p-3.5 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-black text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                          <Send className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Reply to Employee & Mark as Resolved:</span>
                        </label>
                        {isReplying && (
                          <button
                            type="button"
                            onClick={() => setActiveReplyId(null)}
                            className="text-slate-400 hover:text-white text-xs font-bold"
                          >
                            Cancel
                          </button>
                        )}
                      </div>

                      {/* Quick Reply Presets */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] text-slate-400 font-bold uppercase mr-1">Quick Presets:</span>
                        {[
                          "Aapki problem solve ho gayi hai",
                          "Query has been added to chatbot!",
                          "Resolved by IT Team - Thank you for feedback",
                        ].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => {
                              setActiveReplyId(ticket.id);
                              setReplyText(preset);
                            }}
                            className="text-[10px] px-2.5 py-1 rounded-lg bg-cyan-950 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/20 font-bold transition-all cursor-pointer"
                          >
                            + {preset}
                          </button>
                        ))}
                      </div>

                      {/* Reply Textarea & Send Button */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <input
                          type="text"
                          placeholder="Type reply message (e.g. Aapki problem solve ho gayi hai / Query added to chatbot)..."
                          value={activeReplyId === ticket.id ? replyText : ""}
                          onFocus={() => {
                            if (activeReplyId !== ticket.id) {
                              setActiveReplyId(ticket.id);
                              setReplyText("");
                            }
                          }}
                          onChange={(e) => {
                            setActiveReplyId(ticket.id);
                            setReplyText(e.target.value);
                          }}
                          className="flex-1 bg-slate-950 border border-cyan-500/40 focus:border-cyan-400 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-xs font-bold outline-none shadow-inner"
                        />

                        <button
                          type="button"
                          onClick={() => handleReplyAndResolve(ticket)}
                          disabled={updatingId === ticket.id || activeReplyId !== ticket.id || !replyText.trim()}
                          className={`px-5 py-2.5 rounded-xl font-black text-xs uppercase flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg whitespace-nowrap ${
                            activeReplyId === ticket.id && replyText.trim()
                              ? "bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.4)] active:scale-95"
                              : "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed"
                          }`}
                        >
                          {updatingId === ticket.id ? (
                            <RotateCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                          <span>Send Reply & Resolve</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Submission Timestamp Footer */}
                  <div className="mt-2 text-[10px] text-slate-500 font-mono">
                    Submitted: {new Date(ticket.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
