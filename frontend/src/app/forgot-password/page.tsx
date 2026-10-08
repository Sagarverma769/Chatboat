"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import BrandLogo from '@/components/BrandLogo';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setErrorMsg('Please enter your email address.');
      return;
    }

    setLoading(true);

    setLoading(true);
    try {
      const response = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      });
      const data = await response.json();
      if (!response.ok) {
        setErrorMsg(data.detail || 'Password reset is unavailable. Contact your administrator.');
        return;
      }
      setSuccessMsg(data.message || 'Password reset instructions were requested.');
    } catch {
      setErrorMsg('Unable to reach the account service. Try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white flex items-center justify-center p-4 font-sans select-none relative overflow-hidden">
      <BrandLogo className="fixed right-3 top-3 z-50 sm:right-6 sm:top-5" />
      {/* Dynamic Mouse Glow */}
      <div 
        className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-300"
        style={{
          background: `radial-gradient(650px circle at ${mousePos.x}px ${mousePos.y}px, rgba(14, 165, 233, 0.22), rgba(99, 102, 241, 0.12), transparent 70%)`
        }}
      />

      {/* Ambient Background Lights */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-cyan-500/40 via-blue-600/30 to-transparent rounded-full blur-[110px] pointer-events-none" />
      <div className="absolute top-1/4 -left-20 w-[500px] h-[500px] bg-cyan-400/25 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-10 -right-20 w-[550px] h-[550px] bg-indigo-500/30 rounded-full blur-[130px] pointer-events-none animate-pulse" />
      <div className="absolute inset-0 opacity-[0.07] pointer-events-none z-0" style={{ backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.6) 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

      <div className="relative z-10 w-full max-w-md my-8">
        <div className="absolute -inset-1.5 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 rounded-[2.3rem] blur-2xl opacity-60 transition duration-1000" />
        <div className="relative w-full bg-slate-900/85 backdrop-blur-3xl border border-cyan-500/30 rounded-[2rem] p-8 sm:p-10 shadow-[0_0_50px_rgba(0,0,0,0.9)] overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4/5 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_rgba(34,211,238,1)]" />

          {/* Key Icon Header */}
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-slate-950 border border-cyan-400/50 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.3)]">
              <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
          </div>

          <div className="text-center mb-6 relative">
            <h1 className="text-2xl font-black tracking-tight text-white">Reset Password</h1>
            <p className="text-xs text-slate-400 mt-1.5 font-medium">Enter your registered email to reset password.</p>
          </div>

          {/* Error Message Alert */}
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold text-center">
              {errorMsg}
            </div>
          )}

          {/* Success Message Alert */}
          {successMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold text-center">
              {successMsg}
            </div>
          )}

          <form onSubmit={handleResetPassword} className="space-y-4">
            {/* EMAIL ADDRESS */}
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">EMAIL ADDRESS</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <input 
                  type="email" 
                  required 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  className="w-full pl-11 pr-4 py-3 bg-slate-950/60 border border-slate-700/80 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/40 transition-all font-medium hover:border-cyan-500/50" 
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className="w-full py-3.5 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-[0_0_30px_rgba(6,182,212,0.5)] hover:shadow-[0_0_40px_rgba(6,182,212,0.8)] transition-all text-sm !mt-6 active:scale-[0.98]"
            >
              {loading ? 'Verifying...' : 'Verify Email'}
            </button>
          </form>

          <div className="text-center mt-6 pt-4 border-t border-slate-800 text-xs text-slate-400">
            Remembered your password? <Link href="/login" className="text-cyan-400 hover:text-cyan-300 font-bold transition-colors underline-offset-4 hover:underline">Sign In</Link>
          </div>
        </div>
      </div>
    </div>
  );
}