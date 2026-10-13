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
      <div className="min-h-screen bg-sky-50 text-slate-900 flex items-center justify-center font-sans">
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
    <div className="min-h-screen bg-sky-50 text-slate-900 font-sans relative overflow-hidden flex flex-col justify-between">
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
      <main className="relative z-10 mx-auto w-full max-w-[1480px] px-4 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto w-full">
          <UserSupportDesk userName={displayName} userEmail={userEmail} />
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