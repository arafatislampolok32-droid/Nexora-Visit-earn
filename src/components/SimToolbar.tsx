/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Shield, Sparkles, User, UserPlus, Users, Link } from 'lucide-react';
import { TelegramUser } from '../types';

interface SimToolbarProps {
  currentSimUser: TelegramUser | null;
  onSelectUser: (user: TelegramUser) => void;
  onTriggerReferral: (referrerId: string) => void;
  isAdmin: boolean;
  onToggleAdmin: () => void;
  isFirebaseActive: boolean;
}

export default function SimToolbar({
  currentSimUser,
  onSelectUser,
  onTriggerReferral,
  isAdmin,
  onToggleAdmin,
  isFirebaseActive
}: SimToolbarProps) {
  const [customId, setCustomId] = useState('');
  const [customName, setCustomName] = useState('');
  const [customUsername, setCustomUsername] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  // Pre-configured test accounts
  const simAccounts: TelegramUser[] = [
    {
      id: '112233445',
      first_name: 'Arafat',
      last_name: 'Polok',
      username: 'arafat_polok',
    },
    {
      id: '556677889',
      first_name: 'Sajid',
      last_name: 'Hasan',
      username: 'sajid_h',
    },
    {
      id: '999999999',
      first_name: 'Nexora',
      last_name: 'Admin',
      username: 'nex_admin',
    }
  ];

  const handleCreateCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customId || !customName) return;
    onSelectUser({
      id: customId.trim(),
      first_name: customName.trim(),
      username: customUsername.trim() || undefined,
    });
    setCustomId('');
    setCustomName('');
    setCustomUsername('');
  };

  return (
    <div className="bg-slate-900 border-b border-slate-800 text-xs text-slate-300 relative z-50">
      <div className="max-w-7xl mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-medium text-slate-200">Telegram Sandbox Simulator</span>
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
            isFirebaseActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
          }`}>
            {isFirebaseActive ? 'Firebase Active' : 'Local Storage Mode'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-slate-400">
            Active: <strong className="text-white font-mono">{currentSimUser ? `@${currentSimUser.username || currentSimUser.first_name} (${currentSimUser.id})` : 'None'}</strong>
          </span>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-[11px] font-semibold transition"
          >
            {isExpanded ? 'Hide Controls' : 'Show Simulator Panel'}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-slate-800 bg-slate-950/85 backdrop-blur-md px-4 py-4 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Quick Select Profile */}
          <div className="space-y-2">
            <h4 className="text-slate-200 font-bold flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-blue-400" /> Use Simulated Accounts
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Select an account to hot-swap profiles in the workspace instantly.
            </p>
            <div className="grid grid-cols-1 gap-1.5 pt-1">
              {simAccounts.map((acc) => (
                <button
                  key={acc.id}
                  onClick={() => {
                    onSelectUser(acc);
                    if (acc.id === '999999999' && !isAdmin) {
                      onToggleAdmin();
                    } else if (acc.id !== '999999999' && isAdmin) {
                      onToggleAdmin();
                    }
                  }}
                  className={`flex items-center justify-between p-2 rounded border transition text-left ${
                    currentSimUser?.id === acc.id
                      ? 'bg-blue-500/10 border-blue-500 text-blue-300 font-medium'
                      : 'bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <User className="h-3 w-3" />
                    {acc.first_name} {acc.last_name || ''}
                    {acc.id === '999999999' && (
                      <span className="bg-rose-500/20 text-rose-400 text-[9px] px-1 rounded uppercase">Admin</span>
                    )}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">ID: {acc.id}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Create custom Telegram User / Referral links */}
          <div className="space-y-3">
            <h4 className="text-slate-200 font-bold flex items-center gap-1.5">
              <UserPlus className="h-3.5 w-3.5 text-purple-400" /> Custom Sign-up (Referrals)
            </h4>
            <form onSubmit={handleCreateCustom} className="space-y-1.5">
              <input
                type="text"
                required
                placeholder="Telegram ID (e.g. 12345)"
                value={customId}
                onChange={(e) => setCustomId(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-purple-500"
              />
              <input
                type="text"
                required
                placeholder="First Name (e.g. Rahul)"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-purple-500"
              />
              <input
                type="text"
                placeholder="Username (optional: rahul9)"
                value={customUsername}
                onChange={(e) => setCustomUsername(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-purple-500"
              />
              <button
                type="submit"
                className="w-full py-1 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded transition text-xs"
              >
                Log In & Register User
              </button>
            </form>
          </div>

          {/* Trigger Referral start link */}
          <div className="space-y-3">
            <h4 className="text-slate-200 font-bold flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" /> Special Sandbox Tools
            </h4>
            <div className="p-2.5 bg-slate-900 rounded border border-slate-800 space-y-2">
              <div className="flex items-center justify-between gap-1">
                <span className="text-slate-400 text-[11px]">System Role Toggle</span>
                <button
                  onClick={onToggleAdmin}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    isAdmin 
                      ? 'bg-rose-500 text-white' 
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {isAdmin ? '🔴 Admin Mode ON' : '⚫ Toggle Admin View'}
                </button>
              </div>
              <div className="border-t border-slate-800 pt-2 space-y-1">
                <span className="text-slate-400 text-[11px] block">Simulate Referral Parameter:</span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => onTriggerReferral('112233445')}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded text-[10px] text-slate-300 flex items-center gap-1"
                  >
                    <Link className="h-2.5 w-2.5 text-blue-400" /> Param: start=112233445
                  </button>
                  <button
                    onClick={() => {
                      localStorage.removeItem('nexora_users');
                      localStorage.removeItem('nexora_visits');
                      localStorage.removeItem('nexora_withdrawals');
                      localStorage.removeItem('nexora_tasks');
                      alert('Local state has been entirely cleared! Reload to restore defaults.');
                      window.location.reload();
                    }}
                    className="p-1.5 bg-rose-950/40 hover:bg-rose-900 border border-rose-900/30 text-rose-200 rounded text-[10px]"
                  >
                    Reset Storage
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
