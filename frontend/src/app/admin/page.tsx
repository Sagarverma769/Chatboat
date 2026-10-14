"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Zap,
  LayoutDashboard,
  Users,
  Inbox,
} from "lucide-react";
import BrandLogo from "@/components/BrandLogo";

// Correct Imports as per your folder structure
import DashboardOverview from "./dashboard-overview/DashboardOverview";
import UserManagement from "./user-management/UserManagement";
import AdminQueries from "./queries/AdminQueries";

export default function AdminPortalPage() {
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [pendingQueriesCount, setPendingQueriesCount] = useState(0);

  const [activeTab, setActiveTab] = useState<"dashboard" | "users" | "queries">("dashboard");

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    const verifyAdminSession = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        const response = await fetch("/api/users/me", {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        const user = await response.json();
        if (!response.ok || !user.is_superuser) {
          localStorage.removeItem("access_token");
          if (active) setIsAuthorized(false);
          router.replace(response.ok ? "/user" : "/login");
          return;
        }

        if (active) {
          const verifiedEmail = user.email || "";
          const verifiedName = user.full_name || verifiedEmail.split("@")[0];
          localStorage.setItem("userEmail", verifiedEmail);
          localStorage.setItem("userName", verifiedName);
          setUserEmail(verifiedEmail);
          setUserName(verifiedName);
          setIsAuthorized(true);
        }
      } catch {
        localStorage.removeItem("access_token");
        if (active) setIsAuthorized(false);
        router.replace("/login");
      }
    };

    void verifyAdminSession();

    const handleMouseMove = (e: MouseEvent) =>
      setMousePos({ x: e.clientX, y: e.clientY });
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      active = false;
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Load the pending count once; ticket refreshes are user-triggered.
  useEffect(() => {
    if (!isAuthorized) return;
    const fetchPendingCount = async () => {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) return;
        const res = await fetch("/api/tickets?admin=true", {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = await res.json();
        const tickets = Array.isArray(data.tickets) ? data.tickets : [];
        const pending = tickets.filter((t: { status: string }) => t.status === "Pending").length;
        setPendingQueriesCount((prev) => (prev !== pending ? pending : prev));
      } catch {
        // Keep the portal available if the ticket count cannot be loaded.
      }
    };
    void fetchPendingCount();
  }, [isAuthorized]);

  const handleSignOut = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userName");
    localStorage.removeItem("userRole");
    router.push("/login");
  };

  if (isAuthorized !== true) {
    return (
      <div className="company-background-page min-h-screen bg-sky-50 text-slate-900 flex items-center justify-center font-sans">
        <div className="text-cyan-400 text-sm font-bold animate-pulse flex items-center gap-2">
          <Zap className="w-5 h-5 text-cyan-300 animate-bounce" />
          Loading Admin Workspace...
        </div>
      </div>
    );
  }

  const displayName = userName || userEmail.split("@")[0] || "User";
  const avatarLetter = displayName.charAt(0).toUpperCase();

  return (
    <div className="company-background-page admin-portal-theme min-h-screen bg-sky-50 text-slate-900 font-sans relative overflow-hidden flex flex-col justify-between">
      {/* Background Glow */}
      <div
        className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-500"
        style={{
          background: `radial-gradient(900px circle at ${mousePos.x}px ${mousePos.y}px, rgba(6, 182, 212, 0.18), rgba(59, 130, 246, 0.08), transparent 80%)`,
        }}
      />

      {/* Header */}
      <header className="relative z-20 border-b border-cyan-500/30 bg-slate-900/50 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-slate-950 border-2 border-cyan-400/80 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.4)]">
              <ShieldCheck className="w-5 h-5 text-cyan-300" />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-black tracking-widest text-cyan-300 uppercase">
                IND SPHINX
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/40 text-sm font-black tracking-widest text-white uppercase shadow-[0_0_12px_rgba(255,255,255,0.3)]">
                ADMIN PORTAL
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <BrandLogo />

            {/* Profile Dropdown */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="w-10 h-10 bg-gradient-to-r from-cyan-400 to-blue-600 rounded-2xl flex items-center justify-center font-black text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.5)] border-2 border-cyan-200 hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                {avatarLetter}
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-3 w-64 bg-slate-900/95 border-2 border-cyan-500/40 rounded-2xl p-4 shadow-[0_10px_35px_rgba(0,0,0,0.9)] backdrop-blur-2xl z-50">
                  <div className="pb-3 border-b border-slate-800 mb-3">
                    <div className="text-[10px] text-slate-400 font-black uppercase tracking-wider">
                      ADMIN USER
                    </div>
                    <div className="text-sm font-extrabold text-white mt-1 capitalize truncate">
                      {displayName}
                    </div>
                    <div className="text-xs text-cyan-400 font-bold mt-0.5 truncate">
                      {userEmail || "admin@indsphinx.com"}
                    </div>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="w-full py-2 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-black rounded-xl transition-all active:scale-95 cursor-pointer"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-8 flex-1 w-full grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        
        {/* Sidebar */}
        <aside className="lg:col-span-1 bg-slate-900/80 border-2 border-cyan-500/40 rounded-3xl p-5 backdrop-blur-2xl shadow-[0_0_25px_rgba(6,182,212,0.15)]">
          <div className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-4 px-2">
            ADMIN CONTROL CENTER
          </div>

          <nav className="space-y-2">
            <button
              type="button"
              aria-pressed={activeTab === "dashboard"}
              onClick={() => setActiveTab("dashboard")}
              className={`selected-option w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-black transition-all cursor-pointer ${
                activeTab === "dashboard"
                  ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                  : "bg-slate-950/60 border border-slate-800 text-slate-300 hover:border-cyan-500/40"
              }`}
            >
              <LayoutDashboard size={18} />
              <span>Dashboard Overview</span>
            </button>

            <button
              type="button"
              aria-pressed={activeTab === "users"}
              onClick={() => setActiveTab("users")}
              className={`selected-option w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-black transition-all cursor-pointer ${
                activeTab === "users"
                  ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                  : "bg-slate-950/60 border border-slate-800 text-slate-300 hover:border-cyan-500/40"
              }`}
            >
              <Users size={18} />
              <span>Registered Users</span>
            </button>

            <button
              type="button"
              aria-pressed={activeTab === "queries"}
              onClick={() => { setActiveTab("queries"); setPendingQueriesCount(0); }}
              className={`selected-option w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-black transition-all cursor-pointer ${
                activeTab === "queries"
                  ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                  : "bg-slate-950/60 border border-slate-800 text-slate-300 hover:border-cyan-500/40"
              }`}
            >
              <div className="flex items-center gap-3">
                <Inbox size={18} />
                <span>IT Helpdesk & Queries</span>
              </div>
              {pendingQueriesCount > 0 ? (
                <span className="text-[9px] px-2 py-0.5 rounded bg-rose-500/30 border border-rose-400 text-rose-200 font-mono font-black animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]">
                  {pendingQueriesCount} NEW
                </span>
              ) : (
                <span className="text-[9px] px-2 py-0.5 rounded bg-cyan-950 border border-cyan-400/50 text-cyan-300 font-mono">
                  LIVE
                </span>
              )}
            </button>
          </nav>
        </aside>

        {/* Render the active admin section. */}
        <section className="lg:col-span-3 space-y-6">
          <div className={activeTab === "dashboard" ? "block space-y-6" : "hidden"}>
            <DashboardOverview displayName={displayName} userEmail={userEmail} />
          </div>

          <div className={activeTab === "users" ? "block space-y-6" : "hidden"}>
            <UserManagement />
          </div>

          <div className={activeTab === "queries" ? "block space-y-6" : "hidden"}>
            <AdminQueries />
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-20 border-t border-slate-800/80 bg-slate-950/60 py-4 text-center">
        <p className="text-[11px] text-slate-400 font-bold">
          © {new Date().getFullYear()} Ind Sphinx Precision Ltd. All security protocols enforced.
        </p>
      </footer>
    </div>
  );
}