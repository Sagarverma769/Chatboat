'use client';

import React, { useState, useEffect } from 'react';
import BrandLogo from '@/components/BrandLogo';

export default function DashboardPage() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen bg-[#020617] text-white p-8 font-sans select-none relative overflow-hidden">
      {/* Dynamic Glow Pointer */}
      <div 
        className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-300"
        style={{
          background: `radial-gradient(650px circle at ${mousePos.x}px ${mousePos.y}px, rgba(14, 165, 233, 0.22), rgba(99, 102, 241, 0.12), transparent 70%)`
        }}
      />
      {/* Ambient Backdrop */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-cyan-500/40 via-blue-600/30 to-transparent rounded-full blur-[110px] pointer-events-none" />
      <div className="absolute inset-0 opacity-[0.07] pointer-events-none z-0" style={{ backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.6) 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

      <div className="relative z-10 max-w-6xl mx-auto space-y-8">
        <div className="flex flex-wrap justify-between items-center gap-4 border-b border-slate-800 pb-5">
          <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-400">
            ENTERPRISE DASHBOARD
          </h1>
          <div className="flex flex-wrap items-center gap-3">
            <BrandLogo />
            <span className="text-xs bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 px-3 py-1 rounded-full font-bold shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              SYSTEM ACTIVE
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {["System Status", "Security Perimeter", "Active Sessions"].map((item, idx) => (
            <div key={idx} className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 rounded-[1.8rem] blur opacity-30 group-hover:opacity-70 transition duration-300" />
              <div className="relative bg-slate-900/85 backdrop-blur-2xl border border-cyan-500/30 rounded-[1.5rem] p-6 shadow-xl">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{item}</h3>
                <p className="text-2xl font-black text-white mt-2">Optimal</p>
                <p className="text-xs text-cyan-400 mt-2 font-medium">● 0 Security Alerts</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
