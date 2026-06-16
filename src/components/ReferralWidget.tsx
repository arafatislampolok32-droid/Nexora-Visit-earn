/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Share2, Users, Copy, Check, Gift, Landmark, Calendar } from 'lucide-react';
import { UserProfile } from '../types';

interface ReferralWidgetProps {
  userProfile: UserProfile | null;
  referredUsers: UserProfile[];
}

export default function ReferralWidget({
  userProfile,
  referredUsers
}: ReferralWidgetProps) {
  const [copied, setCopied] = useState(false);

  // Bot username placeholder for simulated referral links
  const botUsername = 'NexoraVisitEarnBot';
  const referralLink = userProfile 
    ? `https://t.me/${botUsername}?start=${userProfile.telegramId}` 
    : 'Please login to view referral link';

  const handleCopy = () => {
    if (!userProfile) return;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Referral Program Info & Copier */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 lg:col-span-1 space-y-4 relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl"></div>

        <div className="space-y-1 relative">
          <span className="text-[10px] bg-purple-500/10 text-purple-400 font-bold px-2 py-0.5 rounded font-mono uppercase">Passive Income</span>
          <h3 className="font-bold text-slate-100 flex items-center gap-1.5 text-base mt-1">
            <Gift className="h-5 w-5 text-purple-400" /> Share & Earn 10%
          </h3>
          <p className="text-xs text-slate-400">
            Invite your friends and colleagues to earn together. Receive a 10% lifetime commission on all of their earnings.
          </p>
        </div>

        {/* Highlight Commission Structure */}
        <div className="p-3 bg-purple-950/20 border border-purple-900/30 rounded-xl space-y-2">
          <span className="text-[11px] text-purple-300 font-medium block">Lifetime Referral Example:</span>
          <div className="flex justify-between text-xs text-slate-400">
            <span>Your friend earns:</span>
            <strong className="text-white">100.00 BDT</strong>
          </div>
          <div className="flex justify-between text-xs text-purple-300 border-t border-purple-950 pt-1.5">
            <span>Your reward (10%):</span>
            <strong className="text-emerald-400 font-bold">+10.00 BDT</strong>
          </div>
        </div>

        {/* Copy Box */}
        <div className="space-y-1.5 pt-1">
          <label className="text-[11px] text-slate-400 block font-medium">Your Invite Link:</label>
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl p-1.5 pl-3">
            <input
              type="text"
              readOnly
              value={referralLink}
              className="flex-1 bg-transparent text-slate-200 text-xs font-mono select-all focus:outline-none focus:ring-0 overflow-x-auto truncate"
            />
            <button
              onClick={handleCopy}
              disabled={!userProfile}
              className={`p-2 rounded-lg cursor-pointer transition ${
                copied 
                  ? 'bg-emerald-500/15 text-emerald-400' 
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-850 hover:text-white'
              }`}
              title="Copy referral link"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Downlines / Referrals Tracker */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 lg:col-span-2 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-100 flex items-center gap-1.5 text-sm">
              <Users className="h-4 w-4 text-blue-400" /> Your Referred Members
            </h3>
            <p className="text-xs text-slate-400">Monitor active invites and commission credits.</p>
          </div>
          <span className="bg-slate-800 text-slate-200 text-xs px-2.5 py-1 rounded-full font-mono font-bold">
            {referredUsers.length} referrals
          </span>
        </div>

        {referredUsers.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-slate-800 rounded-xl text-slate-500 text-xs space-y-1">
            <Users className="h-6 w-6 mx-auto opacity-30" />
            <p>No referrals joined yet. Share your invite link to get started!</p>
          </div>
        ) : (
          <div className="border border-slate-800/60 rounded-xl max-h-48 overflow-y-auto divide-y divide-slate-800/50">
            {referredUsers.map((ref) => (
              <div key={ref.telegramId} className="p-3 flex items-center justify-between text-xs hover:bg-slate-900/30">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-200">{ref.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono">ID: {ref.telegramId}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-slate-400">
                    <Calendar className="h-3 w-3 shrink-0" />
                    <span>Joined {new Date(ref.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="text-right space-y-0.5">
                  <div className="text-[10px] text-slate-400">Contributions earned:</div>
                  <div className="font-bold font-mono text-emerald-400 flex items-center gap-1 justify-end">
                    +{(ref.totalEarned * 0.10).toFixed(2)} BDT
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
