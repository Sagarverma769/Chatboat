"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface UserHeaderProps {
  userName: string;
  userEmail: string;
}

export default function UserHeader({ userName, userEmail }: UserHeaderProps) {
  const router = useRouter();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    router.push('/login');
  };

  const displayName = userName || userEmail.split('@')[0] || 'User';
  const avatarLetter = displayName.charAt(0).toUpperCase();

  return (
    <header className="relative z-20 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-slate-950 border border-cyan-400/60 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.3)]">
            <svg className="w-5 h-5 text-cyan-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <span className="text-xl font-black tracking-tight text-white">
            Ind Sphinx <span className="text-cyan-400">User Portal</span>
          </span>
        </div>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center font-bold text-white shadow-[0_0_15px_rgba(6,182,212,0.4)] border border-cyan-300/40 hover:scale-105 active:scale-95 transition-all"
          >
            {avatarLetter}
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-3 w-64 bg-slate-900/95 border border-cyan-500/30 rounded-2xl p-4 shadow-[0_10px_30px_rgba(0,0,0,0.8)] backdrop-blur-2xl z-50">
              <div className="pb-3 border-b border-slate-800 mb-3">
                <div className="text-xs text-slate-400 font-semibold uppercase">ACCOUNT PROFILE</div>
                <div className="text-sm font-bold text-white mt-1 capitalize truncate">{displayName}</div>
                <div className="text-xs text-cyan-400 mt-0.5 truncate">{userEmail}</div>
              </div>
              <button
                onClick={handleSignOut}
                className="w-full py-2 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-bold rounded-xl transition-all"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}