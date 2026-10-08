"use client";

import React, { useState, useEffect } from "react";
import {
  Send,
  CheckCircle2,
  Clock,
  AlertTriangle,
  User,
  Hash,
  MapPin,
  MessageSquare,
  Sparkles,
  RotateCw,
  Trash2,
  Inbox,
  ShieldCheck,
  Check
} from "lucide-react";

interface Ticket {
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
}

interface UserSupportDeskProps {
  userName: string;
  userEmail: string;
}

export default function UserSupportDesk({ userName, userEmail }: UserSupportDeskProps) {
  const [employeeName, setEmployeeName] = useState("");
  const [employeeCode, setEmployeeCode] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const [myTickets, setMyTickets] = useState<Ticket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [ticketLoadError, setTicketLoadError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const getActiveEmail = () => {
    if (userEmail && userEmail.trim()) return userEmail.trim().toLowerCase();
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("userEmail") || localStorage.getItem("email") || "";
      if (stored.trim()) return stored.trim().toLowerCase();
    }
    return "user@indsphinx.com";
  };

  const getAuthHeaders = (): Record<string, string> => {
    if (typeof window === "undefined") return {};
    const token = localStorage.getItem("access_token") || localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchMyTickets = async (showLoading = false) => {
    if (showLoading) setLoadingTickets(true);
    try {
      const activeEmail = getActiveEmail();
      const response = await fetch(`/api/tickets?email=${encodeURIComponent(activeEmail)}`, {
        headers: getAuthHeaders(),
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Failed to load your requests.");
      setMyTickets(Array.isArray(data.tickets) ? (data.tickets as Ticket[]) : []);
      setTicketLoadError(null);
    } catch (error) {
      console.error("Failed to load tickets:", error);
      setTicketLoadError(error instanceof Error ? error.message : "Ticket service is unavailable.");
    } finally {
      if (showLoading) setLoadingTickets(false);
    }
  };

  useEffect(() => {
    void fetchMyTickets(true);
    const intervalId = window.setInterval(() => void fetchMyTickets(), 6000);
    return () => window.clearInterval(intervalId);
  }, [userEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeName.trim() || !employeeCode.trim() || !location.trim() || !description.trim()) {
      alert("Please fill all 3 fields and your query description.");
      return;
    }

    setSubmitting(true);
    const activeEmail = getActiveEmail();

    try {
      const payload = {
        employeeName: employeeName.trim(),
        employeeCode: employeeCode.trim(),
        location: location.trim(),
        description: description.trim(),
        userName: employeeName.trim(),
        userEmail: activeEmail,
        title: employeeCode.trim(),
        unit: "General",
        category: "Chatbot",
        priority: "Medium",
      };

      const response = await fetch("/api/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Unable to submit your query.");

      setSuccessToast("Query submitted successfully! IT Admin has been notified.");
      setDescription("");
      await fetchMyTickets();
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err) {
      console.error("Error submitting query:", err);
      alert(err instanceof Error ? err.message : "Unable to submit your request.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this query from records?")) return;
    setDeletingId(id);
    try {
      const response = await fetch(`/api/tickets?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!response.ok && response.status !== 204) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || "Failed to delete query.");
      }
      setMyTickets((prev) => prev.filter((t) => t.id !== id));
      setSuccessToast("Query record deleted successfully.");
      setTimeout(() => setSuccessToast(null), 3000);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete query.");
    } finally {
      setDeletingId(null);
    }
  };

  const isFormValid =
    employeeName.trim().length > 0 &&
    employeeCode.trim().length > 0 &&
    location.trim().length > 0 &&
    description.trim().length > 0;

  return (
    <div className="space-y-8 text-left">
      {/* Toast Alert */}
      {successToast && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-950/95 border-2 border-emerald-400 text-emerald-200 px-5 py-3 rounded-2xl shadow-[0_0_25px_rgba(16,185,129,0.4)] flex items-center gap-3 text-xs font-black backdrop-blur-xl animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Main IT Helpdesk Submission Card */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900/90 border-2 border-cyan-500/40 p-6 sm:p-8 backdrop-blur-2xl shadow-[0_0_40px_rgba(6,182,212,0.15)]">
        {/* Glow accent */}
        <div className="absolute -right-16 -top-16 w-60 h-60 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-cyan-500/20 pb-5 mb-6">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border-2 border-cyan-400/80 flex items-center justify-center text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.35)]">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white uppercase tracking-wider">
                  IT HELPDESK & PROBLEM SUBMISSION
                </h2>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400 text-cyan-300 font-mono font-bold tracking-wide">
                  DIRECT TO IT TEAM
                </span>
              </div>
              <div className="mt-2.5 inline-flex flex-wrap items-center gap-2 px-3.5 py-1.5 rounded-xl bg-cyan-950/70 border border-cyan-500/50 text-cyan-200 text-xs font-semibold shadow-[0_0_15px_rgba(6,182,212,0.2)] backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0 animate-pulse" />
                <span>Facing an issue or want to add new questions to the AI Chatbot? Send directly to IT Admin.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* 1. Employee Name */}
            <div>
              <label className="flex items-center gap-1.5 text-[11px] font-black uppercase text-cyan-300 mb-2">
                <User className="w-3.5 h-3.5 text-cyan-400" />
                <span>1. Employee Name *</span>
              </label>
              <input
                type="text"
                required
                value={employeeName}
                onChange={(e) => setEmployeeName(e.target.value)}
                placeholder=""
                className="w-full bg-slate-950/80 border border-cyan-500/40 focus:border-cyan-400 text-white rounded-xl px-4 py-3 text-xs font-bold outline-none transition-all shadow-inner focus:ring-2 focus:ring-cyan-500/20"
              />
            </div>

            {/* 2. Employee Code */}
            <div>
              <label className="flex items-center gap-1.5 text-[11px] font-black uppercase text-cyan-300 mb-2">
                <Hash className="w-3.5 h-3.5 text-cyan-400" />
                <span>2. Employee Code *</span>
              </label>
              <input
                type="text"
                required
                value={employeeCode}
                onChange={(e) => setEmployeeCode(e.target.value)}
                placeholder=""
                className="w-full bg-slate-950/80 border border-cyan-500/40 focus:border-cyan-400 text-white rounded-xl px-4 py-3 text-xs font-bold outline-none transition-all shadow-inner focus:ring-2 focus:ring-cyan-500/20"
              />
            </div>

            {/* 3. Location / Room */}
            <div>
              <label className="flex items-center gap-1.5 text-[11px] font-black uppercase text-cyan-300 mb-2">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                <span>3. Location / Room *</span>
              </label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder=""
                className="w-full bg-slate-950/80 border border-cyan-500/40 focus:border-cyan-400 text-white rounded-xl px-4 py-3 text-xs font-bold outline-none transition-all shadow-inner focus:ring-2 focus:ring-cyan-500/20"
              />
            </div>
          </div>

          {/* Description: Any query or complaint regarding chatbot */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center gap-1.5 text-[11px] font-black uppercase text-cyan-300">
                <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                <span>Any query or complaint regarding chatbot *</span>
              </label>
              <span className="text-[10px] text-slate-500 font-mono">
                {description.length} characters
              </span>
            </div>

            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder=""
              className="w-full bg-slate-950/80 border border-cyan-500/40 focus:border-cyan-400 text-white rounded-xl p-4 text-xs font-medium outline-none transition-all shadow-inner focus:ring-2 focus:ring-cyan-500/20 resize-none leading-relaxed"
            />
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-slate-800">
            <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950/60 border border-cyan-400/50 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]"></span>
              </span>
              <span className="text-xs font-bold text-cyan-200 tracking-wide">
                Query will be delivered to IT Admin dashboard in real time.
              </span>
            </div>

            <button
              type="submit"
              disabled={submitting || !isFormValid}
              className={`w-full sm:w-auto px-8 py-3.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all shadow-lg cursor-pointer ${
                isFormValid && !submitting
                  ? "bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 shadow-[0_0_25px_rgba(6,182,212,0.5)] active:scale-95"
                  : "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed"
              }`}
            >
              <Send className={`w-4 h-4 ${submitting ? "animate-spin" : ""}`} />
              <span>{submitting ? "Submitting..." : "Submit Chatbot Query"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Submitted Queries List */}
      <div className="rounded-3xl bg-slate-900/90 border-2 border-cyan-500/30 p-6 sm:p-8 backdrop-blur-2xl shadow-[0_0_30px_rgba(6,182,212,0.1)]">
        <div className="flex items-center justify-between border-b border-cyan-500/20 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.25)]">
              <Inbox className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white uppercase tracking-wider">
                My Submitted Queries & Status
              </h3>
              <p className="text-xs text-slate-400 font-semibold">
                Track real-time admin replies and resolution status
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void fetchMyTickets(true)}
            className="px-3.5 py-1.5 rounded-xl bg-slate-950 border border-cyan-500/40 text-cyan-300 font-bold text-xs flex items-center gap-1.5 hover:bg-cyan-500/10 transition-all cursor-pointer active:scale-95 shadow-sm"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loadingTickets ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>

        {ticketLoadError && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{ticketLoadError}</span>
          </div>
        )}

        {myTickets.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-slate-800 rounded-2xl bg-slate-950/40">
            <MessageSquare className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-400">No chatbot queries submitted yet.</p>
            <p className="text-[11px] text-slate-500 mt-1">
              Submit your query above to request chatbot additions or report issues.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {myTickets.map((ticket) => {
              const isResolved = ticket.status === "Resolved";
              const empCode = ticket.employeeCode || ticket.deviceIp || ticket.title || "N/A";
              return (
                <div
                  key={ticket.id}
                  className={`rounded-2xl border p-5 transition-all bg-slate-950/80 ${
                    isResolved
                      ? "border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.12)]"
                      : "border-cyan-500/30 hover:border-cyan-400/50 shadow-[0_0_15px_rgba(6,182,212,0.06)]"
                  }`}
                >
                  {/* Top Bar: Emp Details & Status */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3 mb-3">
                    <div className="flex flex-wrap items-center gap-2.5 text-xs">
                      <span className="font-extrabold text-white flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-cyan-400" />
                        {ticket.userName}
                      </span>
                      <span className="text-slate-600">•</span>
                      <span className="font-mono text-cyan-300 bg-cyan-950/90 border border-cyan-500/40 px-2 py-0.5 rounded text-[11px] font-bold">
                        CODE: {empCode}
                      </span>
                      <span className="text-slate-600">•</span>
                      <span className="text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                        {ticket.location}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-md border flex items-center gap-1.5 ${
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
                            PENDING REVIEW
                          </>
                        )}
                      </span>

                      {/* Delete button so user can clean up data */}
                      <button
                        type="button"
                        onClick={() => handleDelete(ticket.id)}
                        disabled={deletingId === ticket.id}
                        title="Delete query record"
                        className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 hover:text-rose-200 transition-all cursor-pointer flex items-center gap-1 text-[11px] font-bold active:scale-95"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>

                  {/* Query Description */}
                  <div className="mb-3">
                    <p className="text-[11px] font-black text-cyan-300 uppercase tracking-wider mb-1">
                      Query / Complaint regarding Chatbot:
                    </p>
                    <p className="text-xs text-slate-200 leading-relaxed bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 font-medium">
                      {ticket.description}
                    </p>
                  </div>

                  {/* Admin Reply Box (if present) */}
                  {ticket.resolutionNotes && (
                    <div className="mt-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-3.5 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                      <div className="flex items-center gap-1.5 text-xs font-black text-emerald-300 mb-1">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span>IT Admin Response:</span>
                      </div>
                      <p className="text-xs text-emerald-100 font-semibold leading-relaxed">
                        {ticket.resolutionNotes}
                      </p>
                    </div>
                  )}

                  {/* Date footer */}
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