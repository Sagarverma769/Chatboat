"use client";

import React, { useState, useEffect } from "react";
import {
  Send,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Monitor,
  MapPin,
  Tag,
  MessageSquare,
  Wrench,
  RotateCw,
  Sparkles,
  ChevronDown,
  Layers,
  Inbox,
  UserCheck,
  Trash2,
  BellRing
} from "lucide-react";
import { IT_TEAM_MEMBERS } from "@/config/it-team";

interface Ticket {
  id: string;
  unit: "Unit A" | "Unit B" | "Unit H";
  location: string;
  userName: string;
  userEmail: string;
  deviceIp?: string;
  assignedMember: string;
  category: "Hardware" | "Software" | "Network" | "Printer" | "Access";
  priority: "Low" | "Medium" | "High" | "Critical";
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
  const [unit, setUnit] = useState<"Unit A" | "Unit B" | "Unit H">("Unit A");
  const [assignedMember, setAssignedMember] = useState<string>("Any Available IT Specialist");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState<"Hardware" | "Software" | "Network" | "Printer" | "Access">("Software");
  const [priority, setPriority] = useState<"Low" | "Medium" | "High" | "Critical">("Medium");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deviceIp, setDeviceIp] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const [myTickets, setMyTickets] = useState<Ticket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);

  // Available IT members for the selected Unit (from it-team.ts config)
  const unitMembers = IT_TEAM_MEMBERS[unit] || ["Sagar Verma", "Virender Sharma", "Ashwani Kumar"];

  // Resolved user email from props or localStorage
  const getActiveEmail = () => {
    if (userEmail && userEmail.trim()) return userEmail.trim().toLowerCase();
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("userEmail") || localStorage.getItem("email") || "";
      if (stored.trim()) return stored.trim().toLowerCase();
    }
    return "user@indsphinx.com";
  };

  const fetchMyTickets = async () => {
    setLoadingTickets(true);
    try {
      const email = getActiveEmail();
      const res = await fetch(`/api/tickets?email=${encodeURIComponent(email)}`);
      if (res.ok) {
        const data = await res.json();
        setMyTickets(data.tickets || []);
      }
    } catch (err) {
      console.error("Failed to load user tickets:", err);
    } finally {
      setLoadingTickets(false);
    }
  };

  useEffect(() => {
    fetchMyTickets();
  }, [userEmail]);

  // Update default assigned member when Unit changes
  const handleUnitChange = (newUnit: "Unit A" | "Unit B" | "Unit H") => {
    setUnit(newUnit);
    setAssignedMember("Any Available IT Specialist");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location.trim() || !title.trim() || !description.trim()) {
      alert("Please fill in Room Location, Problem Title, and Description.");
      return;
    }

    setSubmitting(true);
    const activeEmail = getActiveEmail();

    try {
      const payload = {
        unit,
        location: location.trim(),
        userName: userName || activeEmail.split("@")[0] || "Employee",
        userEmail: activeEmail,
        deviceIp: deviceIp.trim() || undefined,
        assignedMember,
        category,
        priority,
        title: title.trim(),
        description: description.trim(),
      };

      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        setSuccessToast(`Query sent to IT Team (${assignedMember})! Ticket: ${data.ticket.id}`);
        setTitle("");
        setDescription("");
        setLocation("");
        setDeviceIp("");
        fetchMyTickets();
        setTimeout(() => setSuccessToast(null), 4500);
      } else {
        alert("Failed to send query to IT Team. Please try again.");
      }
    } catch (err) {
      console.error("Error submitting query:", err);
      alert("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete completed query
  const handleDeleteTicket = async (ticketId: string) => {
    if (!confirm(`Do you want to delete completed query #${ticketId}?`)) return;

    try {
      const res = await fetch(`/api/tickets?id=${ticketId}`, { method: "DELETE" });
      if (res.ok) {
        setMyTickets((prev) => prev.filter((t) => t.id !== ticketId));
        setSuccessToast(`Ticket #${ticketId} removed from your list.`);
        setTimeout(() => setSuccessToast(null), 3500);
      }
    } catch (err) {
      console.error("Failed to delete ticket:", err);
    }
  };

  const resolvedCount = myTickets.filter((t) => t.status === "Resolved" || t.resolutionNotes).length;

  return (
    <div className="w-full space-y-6 text-left relative">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-950/95 border-2 border-emerald-400 text-emerald-200 px-5 py-3 rounded-2xl shadow-[0_0_30px_rgba(16,185,129,0.5)] flex items-center gap-3 text-xs font-black backdrop-blur-xl animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Main Support Card with Shaded Neon Border */}
      <div className="bg-slate-900/90 border-2 border-cyan-500/50 rounded-3xl p-6 sm:p-8 backdrop-blur-2xl shadow-[0_0_40px_rgba(6,182,212,0.15)] space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-cyan-500/20 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border-2 border-cyan-400/60 flex items-center justify-center text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <Wrench className="w-6 h-6 text-cyan-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white uppercase tracking-wider">
                  IT HELPDESK & PROBLEM SUBMISSION
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-cyan-500/20 border border-cyan-400 text-cyan-300 font-mono font-bold">
                  DIRECT TO ADMIN
                </span>
              </div>
              <p className="text-xs text-slate-400 font-extrabold mt-0.5">
                Facing an issue that the AI Chatbot could not solve? Send your query directly to your Unit's IT Team.
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[11px] font-bold text-slate-400">
              Active Unit Assigned:{" "}
              <strong className="text-cyan-300 font-black">{unit}</strong>
            </span>
          </div>
        </div>

        {/* Submit Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Row 1: Unit, Assigned Member, Location, Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-300 block mb-1.5 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>1. Select Company Unit *</span>
              </label>
              <select
                value={unit}
                onChange={(e) => handleUnitChange(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700/80 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-xs text-cyan-200 font-bold outline-none cursor-pointer"
              >
                <option value="Unit A">Unit A (Plant 1)</option>
                <option value="Unit B">Unit B (Plant 2)</option>
                <option value="Unit H">Unit H (Tool Room / Design)</option>
              </select>
            </div>

            {/* IT Team Member Selection */}
            <div>
              <label className="text-[10px] font-black uppercase text-slate-300 block mb-1.5 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>2. Send Query To Member:</span>
              </label>
              <select
                value={assignedMember}
                onChange={(e) => setAssignedMember(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-xs text-emerald-300 font-bold outline-none cursor-pointer"
              >
                <option value="Any Available IT Specialist">Any Available Member (Fastest)</option>
                {unitMembers.map((member) => (
                  <option key={member} value={member}>
                    {member} ({unit})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-slate-300 block mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-400" />
                <span>3. Exact Room / Lab Location *</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Unit A - Room 104, Production Lab"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 font-semibold outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-slate-300 block mb-1.5 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-amber-400" />
                <span>4. Problem Category *</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700/80 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-xs text-cyan-200 font-bold outline-none cursor-pointer"
              >
                <option value="Software">Software / Application Issue</option>
                <option value="Hardware">Hardware / PC / Monitor Issue</option>
                <option value="Network">Network / Wi-Fi / Internet</option>
                <option value="Printer">Printer / Barcode Scanner</option>
                <option value="Access">Password / Account Access</option>
              </select>
            </div>
          </div>

          {/* Row 2: Title, Priority, Device IP */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            <div className="sm:col-span-6">
              <label className="text-[10px] font-black uppercase text-slate-300 block mb-1.5">
                Problem Title / Brief Summary *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. ERP software crashing or Printer offline in my cabin"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 font-semibold outline-none"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="text-[10px] font-black uppercase text-slate-300 block mb-1.5">
                Urgency / Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700/80 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-xs text-cyan-200 font-bold outline-none cursor-pointer"
              >
                <option value="Low">Low - General Question</option>
                <option value="Medium">Medium - Normal Issue</option>
                <option value="High">High - Work Impeded</option>
                <option value="Critical">Critical - Production Line Stoppage</option>
              </select>
            </div>

            <div className="sm:col-span-3">
              <label className="text-[10px] font-black uppercase text-slate-300 block mb-1.5 flex items-center gap-1">
                <Monitor className="w-3.5 h-3.5 text-cyan-400" />
                <span>Your Device IP (For Remote Fix)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. 192.168.10.45"
                value={deviceIp}
                onChange={(e) => setDeviceIp(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-xs text-cyan-300 font-mono font-bold outline-none"
              />
            </div>
          </div>

          {/* Row 3: Detailed Description */}
          <div>
            <label className="text-[10px] font-black uppercase text-slate-300 block mb-1.5">
              Detailed Description of Problem / Error Message *
            </label>
            <textarea
              required
              rows={3}
              placeholder="Describe what error you see, or what problem occurred despite checking with the AI chatbot, so the IT team knows exactly how to fix it..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 focus:border-cyan-400 rounded-xl p-3.5 text-xs text-white placeholder-slate-500 font-medium outline-none resize-none leading-relaxed"
            />
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
            <p className="text-[11px] text-slate-400 font-semibold">
              Logged in as: <strong className="text-white">{userName || getActiveEmail()}</strong> ({getActiveEmail()})
            </p>

            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-400 via-cyan-500 to-blue-600 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2.5 hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? "Sending to IT..." : "Submit Query to IT Team"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Submitted Queries History Tracker - Strictly for THIS User */}
      <div className="bg-slate-950 border-2 border-cyan-500/30 rounded-3xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <Inbox className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-black uppercase text-white tracking-wider">
              My Submitted IT Queries ({myTickets.length})
            </h3>
            {resolvedCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 font-black text-[10px] flex items-center gap-1">
                <BellRing className="w-3 h-3 text-emerald-400" />
                {resolvedCount} Admin Replies Available
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={fetchMyTickets}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loadingTickets ? "animate-spin" : ""}`} />
            <span>Refresh My Status</span>
          </button>
        </div>

        {myTickets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myTickets.map((t) => (
              <div
                key={t.id}
                className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3 text-left relative hover:border-cyan-500/40 transition-all shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-500/30">
                      {t.id}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-950 text-slate-400">
                      {t.unit} • {t.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Status badge */}
                    <span
                      className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${
                        t.status === "Pending"
                          ? "bg-amber-500/15 border-amber-400/50 text-amber-300 animate-pulse"
                          : t.status === "In Progress"
                          ? "bg-blue-500/15 border-blue-400/50 text-blue-300"
                          : "bg-emerald-500/15 border-emerald-400/50 text-emerald-300"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          t.status === "Pending"
                            ? "bg-amber-400"
                            : t.status === "In Progress"
                            ? "bg-blue-400"
                            : "bg-emerald-400"
                        }`}
                      />
                      {t.status}
                    </span>

                    {/* Delete Option for User */}
                    <button
                      type="button"
                      onClick={() => handleDeleteTicket(t.id)}
                      className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                      title="Delete this query from my list"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-black text-white">{t.title}</h4>
                  <p className="text-xs text-slate-300 line-clamp-2 mt-0.5 font-medium">
                    {t.description}
                  </p>
                </div>

                <div className="text-[11px] text-slate-400 border-t border-slate-800/80 pt-2 flex flex-wrap items-center justify-between gap-2">
                  <span>Room: <strong className="text-slate-200">{t.location}</strong></span>
                  <span className="text-[10px] text-emerald-400 font-bold">Assigned: {t.assignedMember}</span>
                  <span className="text-[10px] text-slate-500 font-mono">{t.createdAt}</span>
                </div>

                {/* Admin Reply / Resolution Notes Section */}
                {t.resolutionNotes ? (
                  <div className="p-3 bg-emerald-950/60 border-2 border-emerald-500/40 rounded-xl text-xs text-emerald-200 space-y-1 shadow-inner">
                    <div className="flex items-center gap-1.5 font-black text-emerald-300 uppercase text-[10px] tracking-wider">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>IT Admin Reply / Action Taken:</span>
                    </div>
                    <p className="leading-relaxed font-semibold">{t.resolutionNotes}</p>
                  </div>
                ) : (
                  <div className="text-[10px] text-slate-500 font-bold italic">
                    Awaiting IT Admin review and action...
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-slate-500 text-xs font-bold space-y-1">
            <p>You have no active queries.</p>
            <p className="text-[11px] text-slate-600">If you face any problem in your unit, submit the form above and our IT team will assist you!</p>
          </div>
        )}
      </div>
    </div>
  );
}
