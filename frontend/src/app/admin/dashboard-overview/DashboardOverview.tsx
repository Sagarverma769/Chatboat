"use client";

import React from "react";
import { Calendar, ShieldCheck, UserCheck, Mail } from "lucide-react";

interface DashboardOverviewProps {
  displayName: string;
  userEmail: string;
}

export default function DashboardOverview({ displayName, userEmail }: DashboardOverviewProps) {
  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      <div className="admin-uniform-text relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-cyan-950/40 border-2 border-cyan-500/40 p-6 sm:p-8 shadow-[0_0_30px_rgba(6,182,212,0.15)] text-left">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-black tracking-widest uppercase mb-3">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>ADMIN PORTAL ACTIVE</span>
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
              <span className="text-slate-600">•</span>
              <span className="text-slate-300 font-bold">
                Authorized Security Administration Workspace
              </span>
            </div>
          </div>

          <div className="px-4 py-2.5 rounded-2xl bg-slate-950/80 border border-cyan-400/40 flex items-center gap-3">
            <ShieldCheck size={18} className="text-cyan-300" />
            <div>
              <div className="text-[10px] font-black uppercase text-slate-400">
                SESSION STATUS
              </div>
              <div className="text-xs font-black text-cyan-300">
                Authenticated
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Account Details */}
      <div className="admin-uniform-text bg-slate-900/80 border-2 border-cyan-500/40 rounded-3xl p-6 backdrop-blur-2xl text-left">
        <div className="text-xs font-black text-cyan-300 uppercase tracking-widest mb-4 flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-cyan-400" />
          <span>ACCOUNT DETAILS</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4">
            <div className="text-[10px] font-black uppercase text-slate-400 mb-1">
              ADMIN IDENTITY
            </div>
            <div className="text-base font-extrabold text-white capitalize">
              {displayName}
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4">
            <div className="text-[10px] font-black uppercase text-slate-400 mb-1">
              REGISTERED EMAIL
            </div>
            <div className="text-base font-extrabold text-cyan-400 truncate">
              {userEmail || "user@gmail.com"}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}