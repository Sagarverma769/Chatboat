"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { 
  Users, 
  Search, 
  RotateCw, 
  ShieldCheck, 
  ShieldAlert, 
  UserCheck, 
  Calendar, 
  Mail, 
  ChevronLeft, 
  ChevronRight,
  Sparkles,
  Trash2,
  AlertTriangle,
  X,
  Lock,
  UserPlus,
  CheckCircle2
} from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  registeredAt: string | null;
  isAdmin: boolean;
  isProtected?: boolean;
}

const PAGE_SIZE = 6;

function formatRegistrationTimestamp(value: string | null): string {
  if (!value) return "Unknown";

  const timestamp = new Date(value);
  if (Number.isNaN(timestamp.getTime())) return "Unknown";

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(timestamp);
}

export default function UserManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "user">("all");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [users, setUsers] = useState<User[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "danger" } | null>(null);

  const fetchUsers = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const currentEmail = (
        typeof window !== "undefined"
          ? (localStorage.getItem("userEmail") || localStorage.getItem("email") || "")
          : ""
      ).toLowerCase();
      const response = await fetch("/api/users", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Failed to load registered users.");
      const nextUsers = (Array.isArray(data) ? data : []).map((user: User) => ({
        ...user,
        isProtected: Boolean(user.isProtected) || user.email.toLowerCase() === currentEmail,
      }));
      setUsers((prev) => {
        if (
          prev.length === nextUsers.length &&
          prev.every(
            (u, i) =>
              u.id === nextUsers[i]?.id &&
              u.isAdmin === nextUsers[i]?.isAdmin &&
              u.email === nextUsers[i]?.email
          )
        ) {
          return prev;
        }
        return nextUsers;
      });
      setLoadError(null);
    } catch (error) {
      console.error("Error fetching backend users:", error);
      setLoadError(error instanceof Error ? error.message : "Account service is unavailable.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initialLoad = window.setTimeout(() => void fetchUsers(true), 0);
    return () => {
      window.clearTimeout(initialLoad);
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timeoutId = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  const triggerToast = (message: string, type: "success" | "danger" = "success") => {
    setToast({ message, type });
  };

  // Toggle Admin Access with Visual Confirmation
  const handleToggleAdmin = async (id: string, currentStatus: boolean, userEmail: string) => {
    setUpdatingId(id);
    const newStatus = !currentStatus;
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch("/api/users", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ id, isAdmin: newStatus }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Unable to update account permissions.");
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, isAdmin: newStatus } : u))
      );

      triggerToast(
        newStatus
          ? `Granted Admin Access to ${userEmail}`
          : `Revoked Admin Access for ${userEmail}`,
        newStatus ? "success" : "danger"
      );
    } catch (error) {
      triggerToast(
        error instanceof Error ? error.message : "Unable to update account permissions.",
        "danger"
      );
    } finally {
      setUpdatingId(null);
    }
  };

  // Delete User
  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    const targetEmail = userToDelete.email;
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`/api/users?id=${encodeURIComponent(userToDelete.id)}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = response.status === 204 ? null : await response.json();
      if (!response.ok) throw new Error(data?.detail || "Unable to delete this account.");
      setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
      triggerToast(`Account ${targetEmail} removed from system.`, "danger");
    } catch (error) {
      triggerToast(
        error instanceof Error ? error.message : "Unable to delete this account.",
        "danger"
      );
    } finally {
      setUserToDelete(null);
    }
  };

  // Filters
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;
    if (roleFilter === "admin") return u.isAdmin;
    if (roleFilter === "user") return !u.isAdmin;
    return true;
  });

  const paginatedUsers = filteredUsers.slice(
    currentPage * PAGE_SIZE,
    (currentPage + 1) * PAGE_SIZE
  );

  const totalAdmins = users.filter((u) => u.isAdmin).length;
  const totalStandard = users.filter((u) => !u.isAdmin).length;

  return (
    <div className="admin-uniform-text bg-slate-900/90 border-2 border-cyan-500/50 rounded-3xl p-6 backdrop-blur-2xl text-left space-y-6 shadow-[0_0_40px_rgba(6,182,212,0.15)] relative">
      
      {toast &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 1000,
              pointerEvents: "none",
            }}
          >
            <div
              role={toast.type === "danger" ? "alert" : "status"}
              aria-live={toast.type === "danger" ? "assertive" : "polite"}
              className={`pointer-events-auto absolute right-4 top-4 flex w-[min(26rem,calc(100vw-2rem))] items-start gap-3 rounded-2xl border-2 px-5 py-4 text-sm font-bold backdrop-blur-xl ${
                toast.type === "danger"
                  ? "border-rose-500 bg-gradient-to-r from-rose-50 to-red-100 text-rose-950 shadow-[0_0_28px_rgba(244,63,94,0.48)]"
                  : "border-emerald-500 bg-gradient-to-r from-emerald-50 to-green-100 text-emerald-950 shadow-[0_0_28px_rgba(16,185,129,0.48)]"
              }`}
            >
              {toast.type === "danger" ? (
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
              ) : (
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
              )}
              <span className="min-w-0 flex-1 break-words">{toast.message}</span>
              <button
                type="button"
                onClick={() => setToast(null)}
                aria-label="Dismiss notification"
                className="rounded-lg p-1 text-current/70 transition-colors hover:bg-black/5 hover:text-current"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>,
          document.body
        )}

      {/* Header Bar with Neon Glow */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-cyan-500/20 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border-2 border-cyan-400/60 flex items-center justify-center text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
            <Users className="w-6 h-6 text-cyan-300" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-2">
              <span>REGISTERED USERS & ACCESS CONTROL</span>
              <span className="text-xs px-2 py-0.5 rounded-md bg-cyan-500/20 border border-cyan-400 text-cyan-300 font-mono">
                RBAC LIVE
              </span>
            </h2>
            <p className="text-xs text-slate-400 font-extrabold mt-0.5">
              Manage accounts, assign Admin clearance, and configure user permissions
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-cyan-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search user or email..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(0);
              }}
              className="pl-9 pr-4 py-2.5 text-xs bg-slate-950 border border-cyan-500/40 focus:border-cyan-400 text-cyan-200 placeholder-slate-500 rounded-xl outline-none transition-all w-48 sm:w-64 font-bold shadow-inner"
            />
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={() => void fetchUsers(true)}
            className="px-4 py-2.5 rounded-xl bg-slate-950 border border-cyan-500/40 text-cyan-300 font-extrabold text-xs flex items-center gap-2 hover:bg-cyan-500/10 transition-all cursor-pointer shadow-sm active:scale-95"
          >
            <RotateCw className={`w-4 h-4 text-cyan-400 ${loading ? "animate-spin" : ""}`} />
            <span>{loading ? "Refreshing..." : "Refresh"}</span>
          </button>
        </div>
      </div>

      {/* Shaded Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-950/80 border border-cyan-500/30 rounded-2xl p-4 flex items-center gap-3.5 shadow-[0_0_20px_rgba(6,182,212,0.1)]">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-extrabold uppercase text-slate-400">Total Registered</p>
            <p className="text-lg font-black text-white font-mono">{users.length} Users</p>
          </div>
        </div>

        <div className="bg-slate-950/80 border border-emerald-500/30 rounded-2xl p-4 flex items-center gap-3.5 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-extrabold uppercase text-slate-400">Admin Personnel</p>
            <p className="text-lg font-black text-emerald-300 font-mono">{totalAdmins} Granted</p>
          </div>
        </div>

        <div className="bg-slate-950/80 border border-blue-500/30 rounded-2xl p-4 flex items-center gap-3.5 shadow-[0_0_20px_rgba(59,130,246,0.1)]">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-300">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-extrabold uppercase text-slate-400">Standard Users</p>
            <p className="text-lg font-black text-blue-300 font-mono">{totalStandard} Accounts</p>
          </div>
        </div>
      </div>

      {/* Role Filter Pills */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-pressed={roleFilter === "all"}
            onClick={() => { setRoleFilter("all"); setCurrentPage(0); }}
            className={`selected-option px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              roleFilter === "all"
                ? "bg-cyan-500/20 border border-cyan-400 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.3)]"
                : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            All Accounts ({users.length})
          </button>

          <button
            type="button"
            aria-pressed={roleFilter === "admin"}
            onClick={() => { setRoleFilter("admin"); setCurrentPage(0); }}
            className={`selected-option px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              roleFilter === "admin"
                ? "bg-emerald-500/20 border border-emerald-400 text-slate-950 shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            Admins Only ({totalAdmins})
          </button>

          <button
            type="button"
            aria-pressed={roleFilter === "user"}
            onClick={() => { setRoleFilter("user"); setCurrentPage(0); }}
            className={`selected-option px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              roleFilter === "user"
                ? "bg-blue-500/20 border border-blue-400 text-slate-950 shadow-[0_0_12px_rgba(59,130,246,0.3)]"
                : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            Standard Only ({totalStandard})
          </button>
        </div>

        <span className="text-[11px] font-bold text-slate-400">
          Showing <span className="text-cyan-300 font-extrabold">{filteredUsers.length}</span> user accounts
        </span>
      </div>

      {/* Main Table with Shaded Neon Borders */}
      <div className="bg-slate-950 border-2 border-cyan-500/30 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans text-xs">
            <thead>
              <tr className="bg-slate-900/90 border-b border-cyan-500/20 text-slate-400 uppercase text-[10px] font-black tracking-wider">
                <th className="py-3.5 px-5">Employee / User</th>
                <th className="py-3.5 px-5">Registered Email</th>
                <th className="py-3.5 px-5">Registration Date &amp; Time</th>
                <th className="py-3.5 px-5 text-center">Admin Privilege Control</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-cyan-400 font-black animate-pulse text-sm">
                    Retrieving registered accounts from system database...
                  </td>
                </tr>
              ) : paginatedUsers.length > 0 ? (
                paginatedUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-slate-900/70 transition-colors group"
                  >
                    {/* User Name & Avatar */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-900 border-2 border-cyan-400/50 flex items-center justify-center font-black text-cyan-300 text-sm shadow-[0_0_10px_rgba(6,182,212,0.2)] shrink-0">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-extrabold text-white text-sm group-hover:text-cyan-300 transition-colors">
                            {user.name}
                          </div>
                          <div className="text-[10px] text-slate-500 font-bold flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${user.isAdmin ? "bg-emerald-400" : "bg-cyan-400"}`} />
                            <span>{user.isAdmin ? "Security Admin" : "Standard Employee"}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="py-4 px-5 text-slate-300 font-mono text-xs">
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-cyan-400/70 shrink-0" />
                        <span className="font-semibold text-slate-200">{user.email}</span>
                      </div>
                    </td>

                    {/* Registration Date & Time */}
                    <td className="py-4 px-5 text-slate-400">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <time
                          className="font-bold text-slate-300"
                          dateTime={user.registeredAt ?? undefined}
                        >
                          {formatRegistrationTimestamp(user.registeredAt)}
                        </time>
                      </div>
                    </td>

                    {/* Creative Admin Access Toggle */}
                    <td className="py-4 px-5 text-center">
                      {user.isProtected ? (
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-cyan-500/15 border border-cyan-400/60 text-cyan-300 font-black text-xs shadow-[0_0_15px_rgba(6,182,212,0.25)]">
                          <ShieldCheck className="w-4 h-4 text-cyan-400" />
                          <span>You (Protected Superadmin)</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleToggleAdmin(user.id, user.isAdmin, user.email)}
                          disabled={updatingId === user.id}
                          className={`group/admin-toggle inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border-2 font-black text-xs transition-all active:scale-95 cursor-pointer shadow-md ${
                            user.isAdmin
                              ? "bg-emerald-500/15 border-emerald-400/80 text-slate-950 hover:bg-rose-500/20 hover:border-rose-400 hover:text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.25)]"
                              : "bg-slate-900 border-slate-700/80 text-slate-950 hover:bg-cyan-500/15 hover:border-cyan-400 hover:text-slate-950"
                          }`}
                          aria-label={user.isAdmin ? "Revoke admin access" : "Grant admin access"}
                          aria-pressed={user.isAdmin}
                          title={user.isAdmin ? "Click to revoke Admin access" : "Click to grant Admin access"}
                        >
                          {updatingId === user.id ? (
                            <span className="animate-pulse text-cyan-300">Updating...</span>
                          ) : (
                            <>
                              {user.isAdmin ? (
                                <>
                                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                                </>
                              ) : (
                                <>
                                  <span className="w-2 h-2 rounded-full bg-slate-600" />
                                  <UserCheck className="w-3.5 h-3.5 text-slate-700" />
                                </>
                              )}
                              <span className="group-hover/admin-toggle:hidden group-focus-visible/admin-toggle:hidden">
                                {user.isAdmin ? "Admin Access" : "Standard User"}
                              </span>
                              <span className="hidden group-hover/admin-toggle:inline group-focus-visible/admin-toggle:inline">
                                {user.isAdmin ? "Revoke Admin Access" : "Access to Admin"}
                              </span>
                            </>
                          )}
                        </button>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-5 text-right">
                      {user.isProtected ? (
                        <span className="text-[10px] text-slate-600 font-extrabold uppercase tracking-wider">
                          Locked
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setUserToDelete(user)}
                          className="destructive-action p-2 rounded-xl border transition-all cursor-pointer active:scale-95 shadow-sm"
                          aria-label={`Delete user ${user.name}`}
                          title="Delete User Account"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-500 font-extrabold">
                    {loadError ? `Registered accounts could not be loaded: ${loadError}` : "No accounts match the current search or filter criteria."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Shaded Footer Pagination */}
        <div className="bg-slate-900/90 px-6 py-4 border-t border-cyan-500/20 flex items-center justify-between text-xs text-slate-400 font-bold">
          <div>
            Page <strong className="text-cyan-300">{currentPage + 1}</strong> of{" "}
            <strong className="text-white">
              {Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE))}
            </strong>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
              disabled={currentPage === 0 || loading}
              className="px-3.5 py-1.5 rounded-xl border border-slate-700 bg-slate-950 hover:border-cyan-400 text-slate-300 disabled:opacity-40 flex items-center gap-1.5 font-black text-xs transition-all cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentPage((prev) => prev + 1)}
              disabled={(currentPage + 1) * PAGE_SIZE >= filteredUsers.length || loading}
              className="px-3.5 py-1.5 rounded-xl border border-slate-700 bg-slate-950 hover:border-cyan-400 text-slate-300 disabled:opacity-40 flex items-center gap-1.5 font-black text-xs transition-all cursor-pointer disabled:cursor-not-allowed"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Creative Delete Confirmation Modal */}
      {userToDelete &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
            <div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="admin-delete-user-title"
              aria-describedby="admin-delete-user-description"
              className="w-full max-w-md rounded-2xl border-2 border-rose-300 bg-white p-6 shadow-[0_12px_40px_rgba(239,68,68,0.2)]"
            >
              <div className="mb-3 flex items-center gap-3 text-rose-700">
                <AlertTriangle className="h-6 w-6 shrink-0" />
                <h3 id="admin-delete-user-title" className="text-base font-black">
                  Delete User Account?
                </h3>
              </div>
              <p id="admin-delete-user-description" className="mb-5 text-sm leading-relaxed text-slate-700">
                Are you sure you want to permanently delete this user?
              </p>
              <p className="mb-5 break-words text-sm font-black text-rose-700">
                {userToDelete.name} ({userToDelete.email})
              </p>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setUserToDelete(null)}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteUser}
                  className="flex items-center gap-2 rounded-xl border border-rose-300 bg-rose-50 px-4 py-2 text-xs font-black text-rose-700 transition-colors hover:border-rose-400 hover:bg-rose-100"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Confirm Delete</span>
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}