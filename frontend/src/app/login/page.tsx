"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import BrandLogo from '@/components/BrandLogo';

export default function LoginPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'user' | 'admin'>('user');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email.trim() || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    const cleanEmail = email.trim().toLowerCase();

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          password: password,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        // ENFORCED SECURITY: Redirect if email is not verified yet
        if (response.status === 403 || data?.is_verified === false || data?.requiresVerification) {
          setErrorMsg('Account not verified. Redirecting to verification page...');
          setTimeout(() => {
            router.push(`/verify?email=${encodeURIComponent(cleanEmail)}`);
          }, 1500);
          return;
        }

        const detail = data?.detail || 'Incorrect email or password. Please try again.';
        setErrorMsg(detail);
        setIsLoading(false);
        return;
      }

      if (typeof data?.access_token !== 'string' || !data.access_token) {
        setErrorMsg('The security server returned an invalid login response.');
        setIsLoading(false);
        return;
      }

      // Check if user object flags account as unverified
      const user = data.user || {};
      if (user.is_verified === false) {
        setErrorMsg('Your email is not verified. Redirecting to verification page...');
        setTimeout(() => {
          router.push(`/verify?email=${encodeURIComponent(cleanEmail)}`);
        }, 1500);
        return;
      }

      const userRole = user.role || 'user';
      const userName = user.name || cleanEmail.split('@')[0];
      const isAdminAccount = user.is_superuser === true;

      if (activeTab === 'admin') {
        if (!isAdminAccount) {
          setErrorMsg('Access Denied: This account does not have Admin privileges.');
          setIsLoading(false);
          return;
        }

        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('userEmail', cleanEmail);
        localStorage.setItem('userRole', 'admin');
        localStorage.setItem('userName', userName);

        setSuccessMsg('Admin Authentication Successful! Redirecting...');
        setTimeout(() => {
          router.push('/admin');
          setTimeout(() => { window.location.href = '/admin'; }, 300);
        }, 1000);
      } else {
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('userEmail', cleanEmail);
        localStorage.setItem('userRole', userRole);
        localStorage.setItem('userName', userName);

        setSuccessMsg('Login Successful! Redirecting to User Portal...');
        setTimeout(() => {
          router.push('/user');
          setTimeout(() => { window.location.href = '/user'; }, 300);
        }, 1000);
      }
    } catch (err) {
      setErrorMsg('Unable to reach the security server. Check the API connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white flex items-center justify-center p-4 font-sans relative overflow-hidden select-none">
      <BrandLogo className="fixed right-3 top-3 z-50 sm:right-6 sm:top-5" />
      <div 
        className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-300"
        style={{
          background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(14, 165, 233, 0.15), rgba(99, 102, 241, 0.08), transparent 70%)`
        }}
      />

      <div className="relative z-10 w-full max-w-md bg-slate-900/80 border border-slate-800/90 rounded-3xl p-8 backdrop-blur-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)]">
        <div className="w-12 h-12 bg-slate-950 border border-cyan-500/30 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
          <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>

        <h1 className="text-3xl font-extrabold text-center text-white tracking-tight">Log In</h1>
        <p className="text-slate-400 text-sm text-center mt-2 font-medium">Enter your credentials to access your portal.</p>

        <div className="grid grid-cols-2 gap-1 p-1 bg-slate-950/80 rounded-2xl border border-slate-800 my-6">
          <button
            type="button"
            onClick={() => { setActiveTab('user'); setErrorMsg(''); }}
            className={`py-2.5 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'user' 
                ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)]' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            User Portal
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('admin'); setErrorMsg(''); }}
            className={`py-2.5 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'admin' 
                ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)]' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Admin Panel
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 text-xs text-center font-semibold">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-300 text-xs text-center font-semibold">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleLogin} autoComplete="off" className="space-y-4">
          <div>
            <label className="block text-xs font-semibold tracking-wider text-slate-300 uppercase mb-2">EMAIL ADDRESS</label>
            <div className="relative">
              <input
                type="text"
                required
                name="app_user_login_identity"
                autoComplete="off"
                aria-autocomplete="none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-3.5 pl-11 text-sm text-white focus:outline-none focus:border-cyan-500 transition-all [&:-webkit-autofill]:[-webkit-text-fill-color:white] [&:-webkit-autofill]:[box-shadow:0_0_0_1000px_#020617_inset]"
              />
              <svg className="w-5 h-5 text-slate-500 absolute left-3.5 top-3.5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 002-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-semibold tracking-wider text-slate-300 uppercase">PASSWORD</label>
              <Link href="/forgot-password" className="text-xs font-bold text-cyan-400 hover:underline">
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                name="app_user_login_secret"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-3.5 pl-11 pr-11 text-sm text-white focus:outline-none focus:border-cyan-500 transition-all [&:-webkit-autofill]:[-webkit-text-fill-color:white] [&:-webkit-autofill]:[box-shadow:0_0_0_1000px_#020617_inset]"
              />
              <svg className="w-5 h-5 text-slate-500 absolute left-3.5 top-3.5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-slate-500 hover:text-white transition-colors"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 rounded-xl font-bold text-base text-white shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] active:scale-[0.99] transition-all disabled:opacity-50 mt-4"
          >
            {isLoading ? 'Authenticating...' : 'Log In'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-400 font-medium">
          Don't have an account?{' '}
          <Link href="/signup" className="text-cyan-400 font-bold hover:underline">
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}