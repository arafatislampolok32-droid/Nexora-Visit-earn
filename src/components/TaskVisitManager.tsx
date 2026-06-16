/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  ExternalLink, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  ShieldAlert, 
  Zap, 
  ExternalLinkIcon,
  Play,
  RotateCcw
} from 'lucide-react';
import { Task, Visit, UserProfile } from '../types';

interface TaskVisitManagerProps {
  tasks: Task[];
  userProfile: UserProfile | null;
  userVisits: Visit[];
  onCompleteTask: (task: Task) => Promise<void>;
  dailyTaskLimit?: number;
}

export default function TaskVisitManager({
  tasks,
  userProfile,
  userVisits,
  onCompleteTask,
  dailyTaskLimit
}: TaskVisitManagerProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [countdown, setCountdown] = useState<number>(15);
  const [isCounting, setIsCounting] = useState<boolean>(false);
  const [hasOpenedLink, setHasOpenedLink] = useState<boolean>(false);
  const [claimReady, setClaimReady] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [alertMsg, setAlertMsg] = useState<{ type: 'error' | 'success', text: string } | null>(null);

  // Anti-Abuse variables
  const lastClickRef = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const limitValue = dailyTaskLimit ?? 10;
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  const completedTodayCount = userVisits.filter(v => new Date(v.timestamp).getTime() > oneDayAgo).length;
  const isLimitReached = completedTodayCount >= limitValue;

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Cooldown Utilities
  const getCooldownRemaining = (task: Task): number => {
    // Find last visit for this task by this user
    const lastVisit = userVisits
      .filter(v => v.taskId === task.id)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

    if (!lastVisit) return 0;

    const diffInMs = Date.now() - new Date(lastVisit.timestamp).getTime();
    const diffInMins = diffInMs / (1000 * 60);

    const cooldownPeriodMins = task.cooldown; // task cooldown stored in minutes
    if (diffInMins < cooldownPeriodMins) {
      return Math.ceil(cooldownPeriodMins - diffInMins);
    }
    return 0;
  };

  const getCooldownRemainingString = (remainingMins: number): string => {
    if (remainingMins <= 0) return '';
    if (remainingMins >= 60) {
      const hours = Math.floor(remainingMins / 60);
      const mins = remainingMins % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${remainingMins}m`;
  };

  const handleStartTask = (task: Task) => {
    // 1. Rapid click detection (anti-spam)
    const now = Date.now();
    if (now - lastClickRef.current < 2000) {
      setAlertMsg({ type: 'error', text: 'Anti-Abuse protection: Rapid clicking detected!' });
      return;
    }
    lastClickRef.current = now;

    // Daily Limit enforcement Check
    if (isLimitReached) {
      setAlertMsg({ 
        type: 'error', 
        text: `Daily task limit reached! You have completed ${completedTodayCount}/${limitValue} tasks in the last 24 hours.` 
      });
      return;
    }

    // 2. Cooldown check
    const remaining = getCooldownRemaining(task);
    if (remaining > 0) {
      setAlertMsg({ type: 'error', text: `Task under 24-hour security cooldown. Please wait ${getCooldownRemainingString(remaining)} more.` });
      return;
    }

    // 3. Start task visitor screen
    setActiveTask(task);
    setCountdown(15);
    setIsCounting(false);
    setHasOpenedLink(false);
    setClaimReady(false);
    setIsVerifying(false);
    setAlertMsg(null);
  };

  const handleOpenLink = () => {
    if (!activeTask) return;
    setHasOpenedLink(true);
    setIsCounting(true);

    // Open target website in new window/tab safely with referrer policies
    window.open(activeTask.url, '_blank', 'noopener,noreferrer');

    // Run 15 seconds timer
    if (timerRef.current) clearInterval(timerRef.current);
    setCountdown(15);
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setClaimReady(true);
          setIsCounting(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleClaimReward = async () => {
    if (!activeTask || !claimReady || isVerifying) return;
    setIsVerifying(true);

    try {
      // Simulate verification delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      await onCompleteTask(activeTask);
      
      setAlertMsg({ type: 'success', text: `Successfully verified! +${activeTask.reward.toFixed(2)} BDT added.` });
      setTimeout(() => {
        setActiveTask(null);
        setAlertMsg(null);
      }, 2500);
    } catch (e: any) {
      setAlertMsg({ type: 'error', text: e.message || 'Verification failed.' });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCancelTask = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setActiveTask(null);
    setIsCounting(false);
    setHasOpenedLink(false);
  };

  const activeTaskList = tasks.filter(t => t.status === 'active');

  return (
    <div className="space-y-4">
      {/* Daily Limits Tracking Progress */}
      <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5 font-mono uppercase">
            <Clock className="h-4 w-4 text-emerald-400 shrink-0" /> Anti-Abuse: Daily Task Limit
          </h4>
          <p className="text-[11px] text-slate-400">
            For security, users are limited to completing <strong>{limitValue}</strong> sponsor visits per 24-hour window.
          </p>
        </div>

        <div className="flex-1 max-w-xs space-y-1.5">
          <div className="flex justify-between items-center text-[10px] font-mono">
            <span className="text-slate-400">Visits Completed (24h)</span>
            <span className={`${isLimitReached ? 'text-rose-400 font-bold' : 'text-emerald-400'}`}>
              {completedTodayCount} / {limitValue}
            </span>
          </div>
          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-850">
            <div 
              style={{ width: `${Math.min((completedTodayCount / limitValue) * 100, 100)}%` }} 
              className={`h-full transition-all duration-500 rounded-full ${
                isLimitReached 
                  ? 'bg-gradient-to-r from-rose-500 to-red-600' 
                  : 'bg-gradient-to-r from-emerald-500 to-teal-400'
              }`}
            ></div>
          </div>
        </div>
      </div>

      {/* Notifications & Warning Alerts */}
      {alertMsg && (
        <div className={`p-3 rounded-lg border ${
          alertMsg.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
            : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
        } text-sm flex items-start gap-2.5 shadow animate-fade-in`}>
          {alertMsg.type === 'success' ? (
            <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0" />
          )}
          <span>{alertMsg.text}</span>
        </div>
      )}

      {/* Main tasks list container */}
      <div className="glass-panel p-4 rounded-2xl relative overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-slate-100 flex items-center gap-1.5 text-base">
              <Zap className="h-5 w-5 text-amber-400" /> Premium Visit Tasks
            </h3>
            <p className="text-xs text-slate-400">Complete visits to monetize and claim 0.10 BDT rewards.</p>
          </div>
          <span className="bg-slate-800 text-slate-300 text-[11px] px-2.5 py-1 rounded-full font-mono">
            {activeTaskList.length} Available
          </span>
        </div>

        {activeTaskList.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm">
            No active sponsorship links available at this time.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {activeTaskList.map((task) => {
              const cooldownRemaining = getCooldownRemaining(task);
              const isCooldown = cooldownRemaining > 0;

              return (
                <div 
                  key={task.id} 
                  className={`border rounded-xl p-3.5 transition h-full flex flex-col justify-between ${
                    isCooldown 
                      ? 'bg-slate-900/40 border-slate-900 text-slate-500' 
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50 text-slate-200'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded font-bold font-mono bg-blue-500/10 text-blue-400">
                        Sponsor Traffic
                      </span>
                      <span className="font-bold text-slate-100 font-mono text-sm">
                        {task.reward.toFixed(2)} BDT
                      </span>
                    </div>
                    <h4 className="font-semibold text-slate-200 text-sm line-clamp-1">{task.title}</h4>
                    <p className="text-[11px] text-slate-400 font-mono">15s countdown • cooldown: {task.cooldown >= 60 ? `${Math.floor(task.cooldown / 60)}h` : `${task.cooldown}m`}</p>
                  </div>

                  <div className="mt-4 pt-2 border-t border-slate-800/40 flex items-center justify-between">
                    {isCooldown ? (
                      <span className="text-xs text-amber-500/70 flex items-center gap-1 font-medium font-mono">
                        <Clock className="h-3 w-3" /> Ready in {getCooldownRemainingString(cooldownRemaining)}
                      </span>
                    ) : (
                      <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
                        <CheckCircle className="h-3 w-3 text-emerald-500" /> Active Earn Link
                      </span>
                    )}

                    <button
                      onClick={() => handleStartTask(task)}
                      disabled={isCooldown || isLimitReached || (userProfile?.isBanned ?? false)}
                      className={`text-xs px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 transition ${
                        isCooldown || isLimitReached || (userProfile?.isBanned ?? false)
                          ? 'bg-slate-850 text-slate-600 border border-slate-800 cursor-not-allowed'
                          : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-500 hover:to-indigo-500 active:scale-95'
                      }`}
                    >
                      <Play className="h-3 w-3 fill-current" /> {isLimitReached ? 'Limit Reached' : 'Visit task'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 15 SECONDS COUNTDOWN TASK OVERLAY MODAL */}
      {activeTask && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 relative overflow-hidden shadow-2xl">
            {/* Ambient Background decoration */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-600/10 rounded-full blur-3xl"></div>

            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center border border-blue-500/20">
                <Clock className={`h-6 w-6 text-blue-400 ${isCounting ? 'animate-spin' : ''}`} />
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-blue-400 tracking-wider uppercase font-mono">Verification Stage</span>
                <h3 className="text-lg font-bold text-slate-100">{activeTask.title}</h3>
                <p className="text-xs text-slate-400 px-4">
                  Visit the sponsor link page and complete a standard traffic viewing step. Keep the new tab open.
                </p>
              </div>

              {/* Progress Circle Visual */}
              <div className="relative py-4 flex justify-center">
                <div className="w-24 h-24 rounded-full border-4 border-slate-800 flex items-center justify-center relative">
                  {isCounting && (
                    <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-500 border-r-blue-500 animate-spin"></div>
                  )}
                  <span className="text-3xl font-black text-white font-mono">{countdown}s</span>
                </div>
              </div>

              {/* Action Guides */}
              <div className="p-3 bg-slate-950/60 rounded-xl space-y-2 border border-slate-800 text-left">
                <div className="flex items-start gap-2 text-xs text-slate-300">
                  <span className="bg-blue-500/20 text-blue-400 font-mono w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0 font-bold">1</span>
                  <span>Click <strong>Open Sponsor Link</strong> below.</span>
                </div>
                <div className="flex items-start gap-2 text-xs text-slate-300">
                  <span className="bg-blue-500/20 text-blue-400 font-mono w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0 font-bold">2</span>
                  <span>Wait for the <strong>15-second countdown</strong> inside this dialog to complete.</span>
                </div>
                <div className="flex items-start gap-2 text-xs text-slate-300">
                  <span className="bg-blue-500/20 text-blue-400 font-mono w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0 font-bold">3</span>
                  <span>Click <strong>Verify & Claim Reward</strong> after the countdown timer triggers.</span>
                </div>
              </div>

              {/* Dynamic Action Buttons */}
              <div className="space-y-2.5 pt-2">
                {!hasOpenedLink ? (
                  <button
                    onClick={handleOpenLink}
                    className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition hover:brightness-110 active:scale-95 shadow-md shadow-blue-500/10"
                  >
                    <ExternalLinkIcon className="h-4 w-4" /> Open Sponsor Link
                  </button>
                ) : (
                  <button
                    onClick={handleClaimReward}
                    disabled={!claimReady || isVerifying}
                    className={`w-full py-3 font-bold rounded-xl flex items-center justify-center gap-2 transition ${
                      claimReady 
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:brightness-110 active:scale-95 shadow-lg shadow-emerald-500/10' 
                        : 'bg-slate-800 text-slate-500 border border-slate-750 cursor-not-allowed'
                    }`}
                  >
                    {isVerifying ? (
                      <span className="flex items-center gap-2">
                        <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        Verifying visit integrity...
                      </span>
                    ) : claimReady ? (
                      'Verify & Claim Reward'
                    ) : (
                      `Viewing Sponsorship (${countdown}s left)`
                    )}
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleCancelTask}
                  className="w-full py-2 bg-slate-900 border border-slate-800 hover:bg-slate-850 hover:border-slate-700 text-slate-400 hover:text-slate-200 rounded-xl transition text-xs font-semibold"
                >
                  Cancel Task
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
