"use client";

import React, { useState, useEffect } from "react";
import {
  Inbox,
  RotateCw,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Server,
  User,
  MapPin,
  Tag,
  Monitor,
  Check,
  Send,
  Sparkles,
  ChevronRight,
  Shield,
  MessageSquare,
  Wrench
} from "lucide-react";

export interface ITTicket {
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
  updatedAt: string;
}

export default function AdminQueries() {
  const [tickets, setTickets] = useState<ITTicket[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUnit, setSelectedUnit] = useState<string>("All");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [selectedTicket, setSelectedTicket] = useState<ITTicket | null>(null);
  const [resolutionInput, setResolutionInput] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tickets");
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets || []);
      }
    } catch (err) {
      console.error("Error fetching tickets:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleUpdateStatus = async (
    id: string,
    newStatus: ITTicket["status"],
    assignedMember?: string,
    notes?: string
  ) => {
    setUpdatingId(id);
    try {
      const res = await fetch("/api/tickets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          status: newStatus,
          assignedMember: assignedMember || undefined,
          resolutionNotes: notes || undefined,
        }),
      });

      if (res.ok) {
        setTickets((prev) =>
          prev.map((t) =>
            t.id === id
              ? {
                  ...t,
                  status: newStatus,
                  assignedMember: assignedMember || t.assignedMember,
                  resolutionNotes: notes !== undefined ? notes : t.resolutionNotes,
                }
              : t
          )
        );
        if (selectedTicket?.id === id) {
          setSelectedTicket((prev) =>
            prev
              ? {
                  ...prev,
                  status: newStatus,
                  assignedMember: assignedMember || prev.assignedMember,
                  resolutionNotes: notes !== undefined ? notes : prev.resolutionNotes,
                }
              : null
          );
        }
        triggerToast(`Ticket ${id} marked as ${newStatus}!`);
      }
    } catch (err) {
      console.error("Error updating ticket:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredTickets = tickets.filter((t) => {
    const matchesUnit = selectedUnit === "All" || t.unit.toLowerCase() === selectedUnit.toLowerCase();
    const matchesStatus = selectedStatus === "All" || t.status.toLowerCase() === selectedStatus.toLowerCase();
    const matchesSearch =
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesUnit && matchesStatus && matchesSearch;
  });

  const pendingCount = tickets.filter((t) => t.status === "Pending").length;
  const inProgressCount = tickets.filter((t) => t.status === "In Progress" || t.status === "Remote Connected").length;
  const resolvedCount = tickets.filter((t) => t.status === "Resolved").length;

  return (
    <div className="bg-slate-900/90 border-2 border-cyan-500/50 rounded-3xl p-6 backdrop-blur-2xl text-left space-y-6 shadow-[0_0_40px_rgba(6,182,212,0.15)] relative">
      
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-950/95 border-2 border-emerald-400 text-emerald-200 px-5 py-3 rounded-2xl shadow-[0_0_25px_rgba(16,185,129,0.4)] flex items-center gap-3 text-xs font-black backdrop-blur-xl animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-cyan-500/20 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border-2 border-cyan-400/60 flex items-center justify-center text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
            <Inbox className="w-6 h-6 text-cyan-300" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-2">
              <span>IT HELPDESK & USER QUERIES</span>
              <span className="text-xs px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-400 text-amber-300 font-mono">
                {pendingCount} PENDING
              </span>
            </h2>
            <p className="text-xs text-slate-400 font-extrabold mt-0.5">
              Live queries submitted from User Portal across Unit A, Unit B & Unit H
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-cyan-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search query, name, room..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2.5 text-xs bg-slate-950 border border-cyan-500/40 focus:border-cyan-400 text-cyan-200 placeholder-slate-500 rounded-xl outline-none transition-all w-48 sm:w-64 font-bold shadow-inner"
            />
          </div>

          <button
            type="button"
            onClick={fetchTickets}
            className="px-4 py-2.5 rounded-xl bg-slate-950 border border-cyan-500/40 text-cyan-300 font-extrabold text-xs flex items-center gap-2 hover:bg-cyan-500/10 transition-all cursor-pointer shadow-sm active:scale-95"
          >
            <RotateCw className={`w-4 h-4 text-cyan-400 ${loading ? "animate-spin" : ""}`} />
            <span>{loading ? "Refreshing..." : "Refresh"}</span>
          </button>
        </div>
      </div>

      {/* Shaded Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-slate-950/80 border border-cyan-500/30 rounded-2xl p-4 flex items-center gap-3.5 shadow-[0_0_20px_rgba(6,182,212,0.1)]">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
            <Inbox className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-extrabold uppercase text-slate-400">Total Queries</p>
            <p className="text-lg font-black text-white font-mono">{tickets.length} Raised</p>
          </div>
        </div>

        <div className="bg-slate-950/80 border border-amber-500/30 rounded-2xl p-4 flex items-center gap-3.5 shadow-[0_0_20px_rgba(245,158,11,0.1)]">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-extrabold uppercase text-slate-400">Pending Action</p>
            <p className="text-lg font-black text-amber-300 font-mono">{pendingCount} Action Needed</p>
          </div>
        </div>

        <div className="bg-slate-950/80 border border-blue-500/30 rounded-2xl p-4 flex items-center gap-3.5 shadow-[0_0_20px_rgba(59,130,246,0.1)]">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-300">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-extrabold uppercase text-slate-400">In Progress</p>
            <p className="text-lg font-black text-blue-300 font-mono">{inProgressCount} Assigned</p>
          </div>
        </div>

        <div className="bg-slate-950/80 border border-emerald-500/30 rounded-2xl p-4 flex items-center gap-3.5 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-extrabold uppercase text-slate-400">Resolved</p>
            <p className="text-lg font-black text-emerald-300 font-mono">{resolvedCount} Fixed</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs: Units & Status */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        {/* Unit Filters */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase text-slate-400 mr-1 flex items-center gap-1">
            <MapPin className="w-3 h-3 text-cyan-400" /> Unit:
          </span>
          {["All", "Unit A", "Unit B", "Unit H"].map((unit) => (
            <button
              key={unit}
              type="button"
              onClick={() => setSelectedUnit(unit)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                selectedUnit === unit
                  ? "bg-cyan-500/20 border border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.3)]"
                  : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              {unit}
            </button>
          ))}
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase text-slate-400 mr-1">Status:</span>
          {["All", "Pending", "In Progress", "Resolved"].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setSelectedStatus(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                selectedStatus === status
                  ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black shadow-md"
                  : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Tickets List & Detail View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Tickets Queue */}
        <div className="lg:col-span-2 space-y-3 max-h-[600px] overflow-y-auto pr-1">
          {filteredTickets.length > 0 ? (
            filteredTickets.map((ticket) => (
              <div
                key={ticket.id}
                onClick={() => {
                  setSelectedTicket(ticket);
                  setResolutionInput(ticket.resolutionNotes || "");
                }}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer text-left relative ${
                  selectedTicket?.id === ticket.id
                    ? "bg-slate-850 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.25)]"
                    : "bg-slate-950/80 border-slate-800/90 hover:border-cyan-500/40 hover:bg-slate-900/60"
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-black text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
                      {ticket.id}
                    </span>
                    <span className="text-[11px] font-black uppercase px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">
                      {ticket.unit}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-900 text-slate-400">
                      {ticket.category}
                    </span>
                  </div>

                  {/* Status Badge */}
                  <span
                    className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border flex items-center gap-1 ${
                      ticket.status === "Pending"
                        ? "bg-amber-500/15 border-amber-400/50 text-amber-300 animate-pulse"
                        : ticket.status === "In Progress"
                        ? "bg-blue-500/15 border-blue-400/50 text-blue-300"
                        : "bg-emerald-500/15 border-emerald-400/50 text-emerald-300"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        ticket.status === "Pending"
                          ? "bg-amber-400"
                          : ticket.status === "In Progress"
                          ? "bg-blue-400"
                          : "bg-emerald-400"
                      }`}
                    />
                    {ticket.status}
                  </span>
                </div>

                <h4 className="text-sm font-black text-white mb-1 tracking-wide">{ticket.title}</h4>
                <p className="text-xs text-slate-300 line-clamp-2 mb-3 font-medium">{ticket.description}</p>

                <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-2.5 gap-2">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-slate-300 font-bold">
                      <User className="w-3.5 h-3.5 text-cyan-400" />
                      {ticket.userName}
                    </span>
                    <span className="flex items-center gap-1 text-slate-400">
                      <MapPin className="w-3.5 h-3.5 text-rose-400" />
                      {ticket.location}
                    </span>
                  </div>

                  <span className="text-[10px] text-slate-500 font-mono font-bold">
                    {ticket.createdAt}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center border-2 border-dashed border-slate-800 rounded-3xl bg-slate-950/40 text-slate-500 font-bold text-xs space-y-2">
              <Inbox className="w-8 h-8 text-slate-600 mx-auto" />
              <p>No queries found for the selected filters.</p>
            </div>
          )}
        </div>

        {/* Right Column: IT Action & Resolution Panel */}
        <div className="bg-slate-950 border-2 border-cyan-500/40 rounded-2xl p-5 space-y-5 h-fit shadow-xl">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Wrench className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-black uppercase text-white tracking-wider">
              {selectedTicket ? `Action: ${selectedTicket.id}` : "Query Resolution Panel"}
            </h3>
          </div>

          {selectedTicket ? (
            <div className="space-y-4 text-left">
              {/* Ticket Summary */}
              <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-cyan-300">{selectedTicket.unit}</span>
                  <span className="text-[10px] font-mono text-slate-400">{selectedTicket.createdAt}</span>
                </div>
                <h4 className="text-sm font-black text-white">{selectedTicket.title}</h4>
                <p className="text-xs text-slate-300 font-medium leading-relaxed bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  {selectedTicket.description}
                </p>

                <div className="text-[11px] text-slate-400 space-y-1 pt-1">
                  <div><strong>Employee:</strong> {selectedTicket.userName} ({selectedTicket.userEmail})</div>
                  <div><strong>Exact Room:</strong> <span className="text-rose-300 font-bold">{selectedTicket.location}</span></div>
                  {selectedTicket.deviceIp && (
                    <div className="flex items-center gap-2 text-cyan-300 font-mono">
                      <Monitor className="w-3 h-3" />
                      <span>Device IP: {selectedTicket.deviceIp}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Assign IT Specialist */}
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-1.5">
                  Assign IT Personnel:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {["Sagar", "Virender", "Ashwani"].map((member) => (
                    <button
                      key={member}
                      type="button"
                      onClick={() => handleUpdateStatus(selectedTicket.id, selectedTicket.status, member)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer border ${
                        selectedTicket.assignedMember === member
                          ? "bg-cyan-500/20 border-cyan-400 text-cyan-300"
                          : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      {member}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status Action Buttons */}
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-1.5">
                  Update Query Status:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(selectedTicket.id, "Pending")}
                    disabled={updatingId === selectedTicket.id}
                    className={`px-2 py-2 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                      selectedTicket.status === "Pending"
                        ? "bg-amber-500/20 border-amber-400 text-amber-300"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    Pending
                  </button>

                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(selectedTicket.id, "In Progress")}
                    disabled={updatingId === selectedTicket.id}
                    className={`px-2 py-2 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                      selectedTicket.status === "In Progress"
                        ? "bg-blue-500/20 border-blue-400 text-blue-300"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    In Progress
                  </button>

                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(selectedTicket.id, "Resolved", undefined, resolutionInput)}
                    disabled={updatingId === selectedTicket.id}
                    className={`px-2 py-2 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                      selectedTicket.status === "Resolved"
                        ? "bg-emerald-500/20 border-emerald-400 text-emerald-300"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:text-emerald-300"
                    }`}
                  >
                    ✓ Resolved
                  </button>
                </div>
              </div>

              {/* Resolution Note */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 block">
                  IT Resolution Notes / Instructions:
                </label>
                <textarea
                  rows={3}
                  value={resolutionInput}
                  onChange={(e) => setResolutionInput(e.target.value)}
                  placeholder="e.g. Replaced network cable in Room 102; system restarted and confirmed working."
                  className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-400 rounded-xl p-3 text-xs text-slate-200 outline-none resize-none font-medium"
                />
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(selectedTicket.id, selectedTicket.status, undefined, resolutionInput)}
                  className="w-full py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black text-xs hover:from-cyan-400 hover:to-blue-500 active:scale-95 transition-all cursor-pointer shadow-md"
                >
                  Save IT Resolution Notes
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 text-xs font-bold space-y-2">
              <MessageSquare className="w-8 h-8 text-slate-700 mx-auto" />
              <p>Select any user query on the left to review details, assign IT specialist, or mark as resolved.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
