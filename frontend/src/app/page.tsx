"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import BrandLogo from '@/components/BrandLogo';

export default function LandingPage() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen bg-sky-50 text-slate-900 font-sans relative overflow-hidden select-none">
      {/* Interactive Glowing Pointer Following Mouse */}
      <div 
        className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-300"
        style={{
          background: `radial-gradient(750px circle at ${mousePos.x}px ${mousePos.y}px, rgba(14, 165, 233, 0.2), rgba(99, 102, 241, 0.1), transparent 70%)`
        }}
      />

      {/* Background Ambient Lights & Grid */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[900px] h-[550px] bg-gradient-to-b from-cyan-500/30 via-blue-600/20 to-transparent rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute top-1/3 -left-20 w-[550px] h-[550px] bg-cyan-400/20 rounded-full blur-[140px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-10 -right-20 w-[600px] h-[600px] bg-indigo-500/20 rounded-full blur-[150px] pointer-events-none animate-pulse" />
      <div className="absolute inset-0 opacity-[0.06] pointer-events-none z-0" style={{ backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.6) 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

      {/* Header / Navigation */}
      <header className="relative z-20 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-20 py-3 flex flex-wrap items-center justify-between gap-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-slate-950 border border-cyan-400/60 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.3)]">
              <svg className="w-5 h-5 text-cyan-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <span className="text-xl font-black tracking-tight text-white">
              Ind Sphinx <span className="text-cyan-400">Security Portal</span>
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-4">
            <BrandLogo />
            <Link 
              href="/login" 
              className="px-5 py-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-700/80 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
            >
              Sign In
            </Link>
            <Link 
              href="/signup" 
              className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.7)] active:scale-95"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 bg-cyan-500/10 border border-cyan-500/30 rounded-full mb-8">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span className="text-xs font-bold text-cyan-300 tracking-wide uppercase">COMPANY ACCESS CONTROL SYSTEM</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight">
          Ind Sphinx Security & <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">Identity Gateway</span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-700 max-w-2xl mx-auto font-medium leading-relaxed">
          Centralized security system for Ind Sphinx personnel with encrypted role authorization, portal isolation, and account credential management.
        </p>

        {/* CTA Action Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link 
            href="/signup" 
            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold rounded-2xl shadow-[0_0_35px_rgba(6,182,212,0.5)] hover:shadow-[0_0_45px_rgba(6,182,212,0.8)] transition-all text-sm active:scale-95"
          >
            Create Free Account
          </Link>
          <Link 
            href="/login" 
            className="w-full sm:w-auto px-8 py-4 bg-slate-950 hover:bg-slate-900 border border-slate-700/80 text-slate-200 hover:text-white font-bold rounded-2xl transition-all text-sm shadow-lg active:scale-95"
          >
            Sign In to Dashboard
          </Link>
        </div>

        {/* Features Preview Grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="p-8 bg-slate-900/70 border border-slate-800/90 rounded-3xl backdrop-blur-2xl shadow-xl hover:border-cyan-500/40 transition-all group">
            <div className="w-12 h-12 bg-slate-950 border border-cyan-500/30 rounded-2xl flex items-center justify-center mb-6 text-cyan-400 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Role Separation</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">Strict privilege isolation separating Admin command centers from standard User portals.</p>
          </div>

          <div className="p-8 bg-slate-900/70 border border-slate-800/90 rounded-3xl backdrop-blur-2xl shadow-xl hover:border-cyan-500/40 transition-all group">
            <div className="w-12 h-12 bg-slate-950 border border-cyan-500/30 rounded-2xl flex items-center justify-center mb-6 text-cyan-400 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Password Recovery</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">Secure verification workflow for resetting account security credentials.</p>
          </div>

          <div className="p-8 bg-slate-900/70 border border-slate-800/90 rounded-3xl backdrop-blur-2xl shadow-xl hover:border-cyan-500/40 transition-all group">
            <div className="w-12 h-12 bg-slate-950 border border-cyan-500/30 rounded-2xl flex items-center justify-center mb-6 text-cyan-400 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Modern UI Design</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">Dark-themed responsive interface with interactive glowing effects and active pointer feedback.</p>
          </div>
        </div>
      </main>
    </div>
  );
}