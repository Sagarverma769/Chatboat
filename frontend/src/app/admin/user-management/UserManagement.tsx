"use client";

import React, { useState, useEffect } from "react";
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
  joined: string;
  isAdmin: boolean;
  isProtected?: boolean;
}

const PAGE_SIZE = 6;

export default function UserManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "user">("all");
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [users, setUsers] = useState<User[]>([]);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
      const currentEmail = (
        typeof window !== "undefined" 
          ? (localStorage.getItem("userEmail") || localStorage.getItem("email") || "") 
          : ""
      ).toLowerCase();

      // Attempt fetch from backend
      const response = await fetch("http://127.0.0.1:8000/api/v1/users/", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }).catch(() => null);

      if (response && response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setUsers(
            data.map((u: any) => ({
              id: String(u.id),
              name: u.full_name || u.email.split("@")[0],
              email: u.email,
              joined: u.created_at ? new Date(u.created_at).toLocaleDateString() : "Active",
              isAdmin: Boolean(u.is_superuser),
              isProtected: u.email.toLowerCase() === currentEmail || u.email.toLowerCase() === "sagar@gmail.com",
            }))
          );
          return;
        }
      }

      // Next API route fallback
      const fallbackRes = await fetch("/api/users").catch(() => null);
      if (fallbackRes && fallbackRes.ok) {
        const fbData = await fallbackRes.json();
        if (Array.isArray(fbData)) {
          setUsers(
            fbData.map((u: any) => ({
              id: String(u.id || Math.random()),
              name: u.full_name || u.name || u.email.split("@")[0],
              email: u.email,
              joined: u.created_at ? new Date(u.created_at).toLocaleDateString() : u.joined || "Active",
              isAdmin: Boolean(u.is_superuser ?? u.isAdmin),
              isProtected: u.email.toLowerCase() === currentEmail,
            }))
          );
          return;
        }
      }

      // Default mock fallback if no database connection yet
      setUsers([
        {
          id: "1",
          name: "Sagar Verma",
          email: "sagar@gmail.com",
          joined: "9/26/2026",
          isAdmin: true,
          isProtected: true,
        },
        {
          id: "2",
          name: "IT Admin User",
          email: "user@gmail.com",
          joined: "9/29/2026",
          isAdmin: true,
          isProtected: currentEmail === "user@gmail.com",
        },
        {
          id: "3",
          name: "Operator User 1",
          email: "user1@gmail.com",
          joined: "9/29/2026",
          isAdmin: false,
          isProtected: false,
        },
      ]);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const triggerToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  // Toggle Admin Access with Visual Confirmation
  const handleToggleAdmin = async (id: string, currentStatus: boolean, userEmail: string) => {
    setUpdatingId(id);
    const newStatus = !currentStatus;
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
      await fetch(`http://127.0.0.1:8000/api/v1/users/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ is_superuser: newStatus }),
      }).catch(() => null);

      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, isAdmin: newStatus } : u))
      );

      triggerToast(
        newStatus 
          ? `Granted Admin Access to ${userEmail}` 
          : `Revoked Admin Access for ${userEmail}`
      );
    } catch {
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, isAdmin: newStatus } : u))
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
      const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
      await fetch(`http://127.0.0.1:8000/api/v1/users/${userToDelete.id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }).catch(() => null);

      setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
      triggerToast(`Account ${targetEmail} removed from system.`);
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
    <div className="bg-slate-900/90 border-2 border-cyan-500/50 rounded-3xl p-6 backdrop-blur-2xl text-left space-y-6 shadow-[0_0_40px_rgba(6,182,212,0.15)] relative">
      
      {/* Toast Alert */}
      {successToast && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-950/95 border-2 border-emerald-400/80 text-emerald-200 px-5 py-3 rounded-2xl shadow-[0_0_25px_rgba(16,185,129,0.4)] flex items-center gap-3 text-xs font-black backdrop-blur-xl animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>{successToast}</span>
        </div>
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
            onClick={fetchUsers}
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
            onClick={() => { setRoleFilter("all"); setCurrentPage(0); }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              roleFilter === "all"
                ? "bg-cyan-500/20 border border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.3)]"
                : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            All Accounts ({users.length})
          </button>

          <button
            type="button"
            onClick={() => { setRoleFilter("admin"); setCurrentPage(0); }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              roleFilter === "admin"
                ? "bg-emerald-500/20 border border-emerald-400 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            Admins Only ({totalAdmins})
          </button>

          <button
            type="button"
            onClick={() => { setRoleFilter("user"); setCurrentPage(0); }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              roleFilter === "user"
                ? "bg-blue-500/20 border border-blue-400 text-blue-300 shadow-[0_0_12px_rgba(59,130,246,0.3)]"
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
                <th className="py-3.5 px-5">Joined Date</th>
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

                    {/* Joined Date */}
                    <td className="py-4 px-5 text-slate-400">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="font-bold text-slate-300">{user.joined}</span>
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
                          className={`group relative inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border-2 font-black text-xs transition-all active:scale-95 cursor-pointer shadow-md ${
                            user.isAdmin
                              ? "bg-emerald-500/15 border-emerald-400/80 text-emerald-300 hover:bg-rose-500/20 hover:border-rose-400 hover:text-rose-300 shadow-[0_0_15px_rgba(16,185,129,0.25)]"
                              : "bg-slate-900 border-slate-700/80 text-slate-400 hover:bg-cyan-500/15 hover:border-cyan-400 hover:text-cyan-300"
                          }`}
                          title={user.isAdmin ? "Click to revoke Admin access" : "Click to grant Admin access"}
                        >
                          {updatingId === user.id ? (
                            <span className="animate-pulse text-cyan-300">Updating...</span>
                          ) : user.isAdmin ? (
                            <>
                              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse group-hover:bg-rose-400" />
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 group-hover:text-rose-400" />
                              <span className="group-hover:hidden">Admin Access</span>
                              <span className="hidden group-hover:inline text-rose-300">Revoke Admin?</span>
                            </>
                          ) : (
                            <>
                              <span className="w-2 h-2 rounded-full bg-slate-600 group-hover:bg-cyan-400" />
                              <UserCheck className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400" />
                              <span className="group-hover:hidden">Standard User</span>
                              <span className="hidden group-hover:inline text-cyan-300">Make Admin</span>
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
                          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:bg-rose-500/20 hover:border-rose-500/50 hover:text-rose-400 transition-all cursor-pointer active:scale-95 shadow-sm"
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
                    No accounts match the current search or filter criteria.
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
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="relative w-full max-w-md bg-slate-950 border-2 border-rose-500/60 rounded-3xl p-6 space-y-5 shadow-[0_0_50px_rgba(244,63,94,0.3)]">
            <button
              onClick={() => setUserToDelete(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border-2 border-rose-400/60 flex items-center justify-center text-rose-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Delete User Account</h3>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">
                  Revoke clearance and permanently remove account
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-xs space-y-1">
              <p className="text-slate-300">Are you sure you want to permanently delete this user?</p>
              <p className="text-rose-400 font-black text-sm">{userToDelete.name} ({userToDelete.email})</p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2.5 text-xs font-bold bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                className="px-5 py-2.5 text-xs font-black bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white rounded-xl shadow-[0_0_20px_rgba(244,63,94,0.4)] flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Trash2 className="w-4 h-4" />
                <span>Confirm Removal</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}