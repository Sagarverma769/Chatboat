"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import BrandLogo from '@/components/BrandLogo';

function getRegistrationError(data: unknown): string {
  if (typeof data !== 'object' || data === null) {
    return 'Registration failed. Please check your details and try again.';
  }

  const responseData = data as { detail?: unknown; error?: unknown };
  if (typeof responseData.detail === 'string') return responseData.detail;
  if (Array.isArray(responseData.detail)) {
    const messages = responseData.detail.flatMap((item: unknown) => {
      if (typeof item !== 'object' || item === null) return [];

      const validationError = item as { loc?: unknown; msg?: unknown };
      if (typeof validationError.msg !== 'string') return [];

      const location = Array.isArray(validationError.loc)
        ? validationError.loc.filter((part): part is string => typeof part === 'string')
        : [];
      const field = location.at(-1);
      return [`${field ? `${field}: ` : ''}${validationError.msg}`];
    });
    if (messages.length > 0) return messages.join(' ');
  }
  if (typeof responseData.error === 'string') return responseData.error;

  return 'Registration failed. Please check your details and try again.';
}

export default function SignUpPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const isValidEmailFormat = (emailStr: string) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(emailStr);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!fullName.trim() || !email.trim() || !password || !confirmPassword) {
      setErrorMsg('Please fill in all fields.');
      return;
    }

    if (fullName.trim().length > 255) {
      setErrorMsg('Full name must be 255 characters or fewer.');
      return;
    }

    const cleanEmail = email.trim().toLowerCase();

    // Strict Email Format Validation
    if (!isValidEmailFormat(cleanEmail)) {
      setErrorMsg('Please enter a valid and active email address.');
      return;
    }

    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }

    if (password.length > 128) {
      setErrorMsg('Password must be 128 characters or fewer.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          password: password,
          full_name: fullName.trim(),
        }),
      });

      const data: unknown = await response.json().catch(() => null);

      if (response.ok) {
        setPendingVerification(true);
        setSuccessMsg('A verification code was sent to your email. Enter it below to create your account.');
        return;
      }

      setErrorMsg(getRegistrationError(data));
    } catch {
      setErrorMsg('Unable to reach the account server. Check the API connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!/^\d{6}$/.test(verificationCode)) {
      setErrorMsg('Enter the 6-digit verification code from your email.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/verify-registration-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: verificationCode,
        }),
      });
      const data: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        setErrorMsg(getRegistrationError(data));
        return;
      }

      if (
        typeof data !== 'object'
        || data === null
        || !('access_token' in data)
        || typeof data.access_token !== 'string'
        || !data.access_token
      ) {
        setErrorMsg('The security server returned an invalid registration response.');
        return;
      }

      const result = data as {
        access_token: string;
        user?: { email?: string; name?: string; role?: string };
      };
      localStorage.setItem('access_token', result.access_token);
      localStorage.setItem('userEmail', result.user?.email || email.trim().toLowerCase());
      localStorage.setItem('userRole', result.user?.role || 'user');
      localStorage.setItem('userName', result.user?.name || fullName.trim());
      setSuccessMsg('Email verified and account created. Redirecting...');
      setTimeout(() => {
        window.location.assign(new URL('/user', window.location.origin));
      }, 1000);
    } catch {
      setErrorMsg('Unable to reach the account server. Check the API connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="company-background-page login-page-theme min-h-screen bg-transparent text-black flex items-center justify-center p-4 font-sans relative overflow-y-auto select-none">
      <BrandLogo className="fixed right-3 top-3 z-50 sm:right-6 sm:top-5" />
      <div 
        className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-300"
        style={{
          background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(14, 165, 233, 0.15), rgba(99, 102, 241, 0.08), transparent 70%)`
        }}
      />

      <div className="relative z-10 my-8 w-full max-w-md bg-white border border-blue-200 rounded-3xl p-8 shadow-[0_12px_40px_rgba(15,23,42,0.12)]">
        <div className="w-12 h-12 bg-white border border-blue-200 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        </div>

        <h1 className="text-3xl font-extrabold text-center text-slate-900 tracking-tight">Create Account</h1>
        <p className="text-slate-600 text-sm text-center mt-2 font-medium">Join our secure platform today.</p>

        {errorMsg && (
          <div className="login-notification mt-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 text-xs text-center font-semibold">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="login-notification mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-300 text-xs text-center font-semibold">
            {successMsg}
          </div>
        )}

        <form onSubmit={pendingVerification ? handleVerifyRegistration : handleSignUp} autoComplete="off" className="space-y-4 mt-6">
          <div className={pendingVerification ? 'hidden' : ''}>
            <label className="block text-xs font-semibold tracking-wider text-slate-700 uppercase mb-2">FULL NAME</label>
            <div className="relative">
              <input
                type="text"
                required
                name="full_name_field"
                autoComplete="off"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={pendingVerification}
                className="w-full bg-white border border-blue-200 rounded-xl px-4 py-3.5 pl-11 text-sm text-slate-900 focus:outline-none focus:border-blue-600 transition-all"
              />
              <svg className="w-5 h-5 text-slate-500 absolute left-3.5 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold tracking-wider text-slate-700 uppercase mb-2">EMAIL ADDRESS</label>
            <div className="relative">
              <input
                type="email"
                required
                name="user_signup_email"
                autoComplete="off"
                aria-autocomplete="none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                readOnly={pendingVerification}
                className="w-full bg-white border border-blue-200 rounded-xl px-4 py-3.5 pl-11 text-sm text-slate-900 focus:outline-none focus:border-blue-600 transition-all"
              />
              <svg className="w-5 h-5 text-slate-500 absolute left-3.5 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 002-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
          </div>

          <div className={pendingVerification ? 'hidden' : ''}>
            <label className="block text-xs font-semibold tracking-wider text-slate-700 uppercase mb-2">PASSWORD</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                name="user_signup_password"
                autoComplete="new-password"
                disabled={pendingVerification}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white border border-blue-200 rounded-xl px-4 py-3.5 pl-11 pr-11 text-sm text-slate-900 focus:outline-none focus:border-blue-600 transition-all"
              />
              <svg className="w-5 h-5 text-slate-500 absolute left-3.5 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-900 transition-colors"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                )}
              </button>
            </div>
          </div>

          <div className={pendingVerification ? 'hidden' : ''}>
            <label className="block text-xs font-semibold tracking-wider text-slate-700 uppercase mb-2">CONFIRM PASSWORD</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                name="user_signup_confirm_password"
                autoComplete="new-password"
                disabled={pendingVerification}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-white border border-blue-200 rounded-xl px-4 py-3.5 pl-11 text-sm text-slate-900 focus:outline-none focus:border-blue-600 transition-all"
              />
              <svg className="w-5 h-5 text-slate-500 absolute left-3.5 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
          </div>

          {pendingVerification && (
            <div>
              <label htmlFor="registration-otp" className="block text-xs font-semibold tracking-wider text-slate-700 uppercase mb-2">
                EMAIL VERIFICATION CODE
              </label>
              <input
                id="registration-otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                required
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full bg-white border border-blue-200 rounded-xl px-4 py-3.5 text-center text-lg tracking-[0.5em] text-slate-900 focus:outline-none focus:border-blue-600 transition-all"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 rounded-xl font-bold text-base text-white shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] active:scale-[0.99] transition-all disabled:opacity-50 mt-4"
          >
            {isLoading ? 'Please wait...' : pendingVerification ? 'Verify Email & Create Account' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-600 font-medium">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-700 font-bold hover:underline">
            Log In
          </Link>
        </div>
      </div>
    </div>
  );
}