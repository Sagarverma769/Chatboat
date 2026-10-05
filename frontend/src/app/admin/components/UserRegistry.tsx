"use client";

import React from 'react';

interface User {
  name: string;
  email: string;
  role?: string;
}

export default function UserRegistry({ users }: { users: User[] }) {
  return (
    <div>
      <h2 className="text-lg font-bold text-white mb-4">Registered Accounts List</h2>
      {users.length === 0 ? (
        <div className="text-center py-12 text-slate-500 text-xs font-semibold">
          No users registered yet.
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((u, i) => (
            <div key={i} className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex justify-between items-center">
              <div>
                <p className="text-sm font-bold text-white">{u.name}</p>
                <p className="text-xs text-slate-400">{u.email}</p>
              </div>
              <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 uppercase">
                {u.role || 'User'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}