"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, ShieldAlert, Lock, Shield, Zap, Calendar } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";
import FloatingChat from "@/components/FloatingChat";
import UserSupportDesk from "./components/UserSupportDesk";

export default function UserPortalPage() {
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    const verifyUserSession = async () => {
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
        if (!response.ok) {
          localStorage.removeItem("access_token");
          if (active) setIsAuthorized(false);
          router.replace("/login");
          return;
        }

        if (active) {
          const verifiedEmail = user.email || "";
          const verifiedName = user.full_name || verifiedEmail.split("@")[0];
          localStorage.setItem("userEmail", verifiedEmail);
          localStorage.setItem("userName", verifiedName);
          setUserEmail(verifiedEmail);
          setUserName(verifiedName);
          setIsEmailVerified(Boolean(user.is_verified));
          setIsAuthorized(true);
        }
      } catch {
        localStorage.removeItem("access_token");
        if (active) setIsAuthorized(false);
        router.replace("/login");
      }
    };

    void verifyUserSession();

    const handleMouseMove = (e: MouseEvent) => setMousePos({ x: e.clientX, y: e.clientY });
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

  const handleSignOut = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userName");
    localStorage.removeItem("userRole");
    router.push("/login");
  };

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  if (isAuthorized !== true) {
    return (
      <div className="min-h-screen bg-[#020617] text-white flex items-center justify-center font-sans">
        <div className="text-cyan-400 text-sm font-bold animate-pulse flex items-center gap-2">
          <Zap className="w-5 h-5 text-cyan-300 animate-bounce" />
          Loading User Portal...
        </div>
      </div>
    );
  }

  const displayName = userName || userEmail.split("@")[0] || "User";
  const avatarLetter = displayName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans relative overflow-hidden flex flex-col justify-between">
      {/* Dynamic Ambient Background Glow */}
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
            
            {/* IND SPHINX (CYAN) + USER PORTAL (WHITE BADGE) */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-black tracking-widest text-cyan-300 uppercase">
                IND SPHINX
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/40 text-sm font-black tracking-widest text-white uppercase shadow-[0_0_12px_rgba(255,255,255,0.3)]">
                USER PORTAL
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <BrandLogo />

            {/* Profile Menu Dropdown */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="w-10 h-10 bg-gradient-to-r from-cyan-400 to-blue-600 rounded-2xl flex items-center justify-center font-black text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.5)] border-2 border-cyan-200 hover:scale-105 active:scale-95 transition-all"
              >
                {avatarLetter}
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-3 w-64 bg-slate-900/95 border-2 border-cyan-500/40 rounded-2xl p-4 shadow-[0_10px_35px_rgba(0,0,0,0.9)] backdrop-blur-2xl z-50">
                  <div className="pb-3 border-b border-slate-800 mb-3">
                    <div className="text-[10px] text-slate-400 font-black uppercase tracking-wider">
                      LOGGED IN USER
                    </div>
                    <div className="text-sm font-extrabold text-white mt-1 capitalize truncate">
                      {displayName}
                    </div>
                    <div className="text-xs text-cyan-400 font-bold mt-0.5 truncate">
                      {userEmail || "user@indsphinx.com"}
                    </div>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="w-full py-2 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-black rounded-xl transition-all active:scale-95"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Workspace */}
      <main className="relative z-10 max-w-6xl mx-auto px-6 py-12 flex-1 flex flex-col justify-center">
        
        {/* Welcome Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-cyan-950/40 border-2 border-cyan-500/40 p-6 sm:p-8 shadow-[0_0_30px_rgba(6,182,212,0.15)] mb-10 text-left">
          <div className="absolute -right-10 -top-10 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-black tracking-widest uppercase mb-3 shadow-[0_0_12px_rgba(16,185,129,0.2)]">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>USER PORTAL ACTIVE</span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                Welcome Back,{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 capitalize">
                  {displayName}
                </span>
              </h1>

              <div className="flex items-center gap-2 text-xs font-extrabold text-cyan-300/90 mt-2">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                <span>{currentDate}</span>
              </div>
            </div>

            <div className="self-start md:self-center">
              <div className="px-4 py-2.5 rounded-2xl bg-slate-950/80 border border-cyan-400/40 shadow-[0_0_15px_rgba(6,182,212,0.2)] flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-300">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    SESSION STATUS
                  </div>
                  <div className="text-xs font-black text-cyan-300 tracking-wide">
                    Authenticated
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* IT Helpdesk Query Submission & Live Tracker */}
        <div className="mb-10">
          <UserSupportDesk userName={displayName} userEmail={userEmail} />
        </div>

        {/* 3 Creative Security Cards */}
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          
          {/* Card 1 */}
          <div className="relative p-6 bg-slate-900/80 border-2 border-cyan-500/60 hover:border-cyan-300 rounded-3xl backdrop-blur-2xl transition-all duration-300 shadow-[0_0_25px_rgba(6,182,212,0.15)] hover:shadow-[0_0_35px_rgba(6,182,212,0.35)] hover:-translate-y-1.5 group">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border-2 border-cyan-400/60 flex items-center justify-center text-cyan-300 mb-4 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <Shield size={24} className="stroke-[2.5]" />
            </div>
            <h3 className="text-xs font-black text-cyan-300 uppercase tracking-widest mb-2 flex items-center justify-between">
              <span>Human & Security</span>
              <span className="text-[10px] text-cyan-400/60 font-mono">01</span>
            </h3>
            <p className="text-sm text-white leading-relaxed font-black tracking-wide bg-gradient-to-br from-white to-slate-200 bg-clip-text">
              "Without security, human potential is vulnerable to chaos. Protection is what allows innovation to thrive."
            </p>
          </div>

          {/* Card 2 */}
          <div className="relative p-6 bg-slate-900/80 border-2 border-cyan-500/60 hover:border-cyan-300 rounded-3xl backdrop-blur-2xl transition-all duration-300 shadow-[0_0_25px_rgba(6,182,212,0.15)] hover:shadow-[0_0_35px_rgba(6,182,212,0.35)] hover:-translate-y-1.5 group">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border-2 border-cyan-400/60 flex items-center justify-center text-cyan-300 mb-4 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <Lock size={24} className="stroke-[2.5]" />
            </div>
            <h3 className="text-xs font-black text-cyan-300 uppercase tracking-widest mb-2 flex items-center justify-between">
              <span>The Core Foundation</span>
              <span className="text-[10px] text-cyan-400/60 font-mono">02</span>
            </h3>
            <p className="text-sm text-white leading-relaxed font-black tracking-wide bg-gradient-to-br from-white to-slate-200 bg-clip-text">
              "Security is not merely a feature or a rule—it is the unbreakable foundation of enterprise trust."
            </p>
          </div>

          {/* Card 3 */}
          <div className="relative p-6 bg-slate-900/80 border-2 border-cyan-500/60 hover:border-cyan-300 rounded-3xl backdrop-blur-2xl transition-all duration-300 shadow-[0_0_25px_rgba(6,182,212,0.15)] hover:shadow-[0_0_35px_rgba(6,182,212,0.35)] hover:-translate-y-1.5 group">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border-2 border-cyan-400/60 flex items-center justify-center text-cyan-300 mb-4 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <ShieldAlert size={24} className="stroke-[2.5]" />
            </div>
            <h3 className="text-xs font-black text-cyan-300 uppercase tracking-widest mb-2 flex items-center justify-between">
              <span>Digital Shield</span>
              <span className="text-[10px] text-cyan-400/60 font-mono">03</span>
            </h3>
            <p className="text-sm text-white leading-relaxed font-black tracking-wide bg-gradient-to-br from-white to-slate-200 bg-clip-text">
              "Vigilance today safeguards our intelligence, privacy, and future tomorrow."
            </p>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-20 border-t border-slate-800/80 bg-slate-950/60 py-4 text-center">
        <p className="text-[11px] text-slate-400 font-bold">
          © {new Date().getFullYear()} Ind Sphinx Precision Ltd. All security protocols enforced.
        </p>
      </footer>

      {/* Floating AI Support */}
      <FloatingChat role="user" title="Ind Sphinx IT Assistant" />
    </div>
  );
}