/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState } from 'react';
import { Bell, ShieldAlert, Sparkles, X, ChevronRight } from 'lucide-react';

export interface AlertNotification {
  id: string;
  text: string;
  timestamp: string;
  type: 'referral' | 'task' | 'payout' | 'system';
}

interface NotificationToastProps {
  logs: AlertNotification[];
  onClearLogs: () => void;
}

export default function NotificationToast({
  logs,
  onClearLogs
}: NotificationToastProps) {
  const [isOpen, setIsOpen] = useState(true);

  if (logs.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40 max-w-sm w-full font-sans transition">
      <div className="bg-slate-900/95 border border-slate-800 text-xs shadow-2xl rounded-2xl overflow-hidden backdrop-blur-md">
        
        {/* Header */}
        <div className="bg-slate-950 px-3.5 py-2 flex items-center justify-between border-b border-slate-850">
          <div className="flex items-center gap-1.5 font-bold">
            <Bell className="h-4 w-4 text-amber-400 shrink-0 animate-bounce" />
            <span className="text-slate-100 font-bold">Telegram Bot Push notifications</span>
            <span className="bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded font-mono text-[9px]">
              {logs.length} Live
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onClearLogs}
              className="text-[10px] text-slate-500 hover:text-rose-400 transition pr-1 font-mono font-medium h-fit"
            >
              Clear Log
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-1 text-slate-500 hover:text-white transition"
              title="Toggle notifications logs view"
            >
              <X className="h-3.5 w-3.5 shrink-0" />
            </button>
          </div>
        </div>

        {isOpen && (
          <div className="max-h-56 overflow-y-auto divide-y divide-slate-850/60 p-1 bg-slate-900/90 pr-2">
            {logs.map((log) => (
              <div key={log.id} className="p-2.5 flex gap-2.5 items-start hover:bg-slate-850/30 transition animate-slide-up">
                <span className="text-lg">
                  {log.type === 'referral' ? '🤝' : log.type === 'task' ? '📣' : log.type === 'payout' ? '💵' : '⚙️'}
                </span>
                
                <div className="space-y-0.5 flex-1">
                  <div className="flex justify-between items-center gap-1">
                    <span className="font-semibold text-slate-300 capitalize text-[10px] font-mono tracking-wide">
                      {log.type} Bot Alert
                    </span>
                    <span className="text-[9px] text-slate-500 font-mono">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-slate-350 leading-relaxed text-[11px] select-text">
                    {log.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
