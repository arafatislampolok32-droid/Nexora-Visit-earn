/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Landmark, 
  Users, 
  Clock, 
  TrendingUp, 
  ShieldAlert, 
  LogOut, 
  Gift, 
  ChevronRight, 
  Zap, 
  HelpCircle,
  Bell,
  Coins,
  DollarSign
} from 'lucide-react';
import { DB } from './services/db';
import { isFirebaseConfigured } from './firebase';
import { TelegramUser, UserProfile, Task, Visit, Withdrawal, SystemConfig } from './types';
import SimToolbar from './components/SimToolbar';
import TaskVisitManager from './components/TaskVisitManager';
import ReferralWidget from './components/ReferralWidget';
import WithdrawModal from './components/WithdrawModal';
import AdminPanel from './components/AdminPanel';
import NotificationToast, { AlertNotification } from './components/NotificationToast';

export default function App() {
  // Authentication & Simulation state
  const [currentUser, setCurrentUser] = useState<TelegramUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isTelegramView, setIsTelegramView] = useState<boolean>(false);
  const [pendingReferrer, setPendingReferrer] = useState<string | null>(null);

  // App core database items in-memory state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [userVisits, setUserVisits] = useState<Visit[]>([]);
  const [allWithdrawals, setAllWithdrawals] = useState<Withdrawal[]>([]);
  const [referredUsers, setReferredUsers] = useState<UserProfile[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [allVisitsCount, setAllVisitsCount] = useState<number>(0);
  const [systemConfig, setSystemConfig] = useState<SystemConfig>({ dailyTaskLimit: 10 });

  // UI state
  const [activeTab, setActiveTab] = useState<'earn' | 'share' | 'history' | 'admin'>('earn');
  const [showWithdraw, setShowWithdraw] = useState<boolean>(false);
  
  // Rolling simulated alerts (Telegram Bot Alerts)
  const [logs, setLogs] = useState<AlertNotification[]>([]);

  const addLog = (text: string, type: AlertNotification['type'] = 'system') => {
    const newLog: AlertNotification = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      text,
      timestamp: new Date().toISOString(),
      type
    };
    setLogs((prev) => [newLog, ...prev]);
  };

  // --- INITIAL MOUNT & TELEGRAM DETECTION ---
  useEffect(() => {
    // 1. Detect if running inside standard Telegram Mini App environment
    const tg = (window as any).Telegram?.WebApp;
    if (tg && tg.initData && tg.initData !== '') {
      tg.ready();
      tg.expand();
      setIsTelegramView(true);

      const tgUser = tg.initDataUnsafe?.user;
      const startParam = tg.initDataUnsafe?.start_param;

      if (tgUser) {
        const mappedUser: TelegramUser = {
          id: String(tgUser.id),
          first_name: tgUser.first_name,
          last_name: tgUser.last_name,
          username: tgUser.username,
          photo_url: tgUser.photo_url,
        };
        handleAuthenticate(mappedUser, startParam || null);
      }
    } else {
      // Browser test simulator first boot: Default to User A
      const mockDefault: TelegramUser = {
        id: '112233445',
        first_name: 'Arafat',
        last_name: 'Polok',
        username: 'arafat_polok',
      };
      
      // Look for a start query parameter in URL (e.g. ?start=123) for referral testing
      const params = new URLSearchParams(window.location.search);
      const urlReferrer = params.get('start') || params.get('startapp');
      
      handleAuthenticate(mockDefault, urlReferrer);
    }

    // Load initial tasks
    loadTasks();
    loadSystemConfig();
  }, []);

  // Sync tasks, visits, withdrawals whenever current user profile changes
  useEffect(() => {
    if (userProfile) {
      loadProfileDependentData();
    }
  }, [userProfile?.telegramId]);

  const loadSystemConfig = async () => {
    try {
      const config = await DB.getSystemConfig();
      setSystemConfig(config);
    } catch (e) {
      console.error('Error loading config', e);
    }
  };

  const handleUpdateSystemConfig = async (updates: Partial<SystemConfig>) => {
    try {
      await DB.updateSystemConfig(updates);
      setSystemConfig((prev) => ({ ...prev, ...updates }));
      addLog(`⚙️ System config updated: Daily task limit is now ${updates.dailyTaskLimit}!`, 'system');
    } catch (e) {
      console.error('Failed to update system config', e);
    }
  };

  const loadTasks = async () => {
    try {
      const fetched = await DB.getTasks();
      setTasks(fetched);
    } catch (e) {
      console.error('Error fetching tasks', e);
    }
  };

  const loadProfileDependentData = async () => {
    if (!userProfile) return;
    try {
      const visits = await DB.getVisitsByUser(userProfile.telegramId);
      setUserVisits(visits);

      // Extract referred users
      const allProfiles = await DB.getAllUsers();
      setAllUsers(allProfiles);
      
      const downlines = allProfiles.filter(u => u.referredBy === userProfile.telegramId);
      setReferredUsers(downlines);

      // Load visits count and withdrawals
      const visitsTotal = await DB.getAllVisitsCount();
      setAllVisitsCount(visitsTotal);

      // Get user specific withdrawals or all withdrawals if admin
      if (isAdmin) {
        const withdrawList = await DB.getWithdrawals();
        setAllWithdrawals(withdrawList);
      } else {
        const withdrawList = await DB.getWithdrawals(userProfile.telegramId);
        setAllWithdrawals(withdrawList);
      }
    } catch (e) {
      console.error('Error loading dependent data', e);
    }
  };

  // --- CORE TELEGRAM LOGIN & SIGNUP PROCESS ---
  const handleAuthenticate = async (tgUser: TelegramUser, refIdParam: string | null) => {
    setCurrentUser(tgUser);

    try {
      // 1. Fetch search profile from repository
      let profile = await DB.getUser(tgUser.id);

      if (!profile) {
        // Welcome bonus of 5 BDT
        const isSelfReferral = refIdParam === tgUser.id;
        const referrer = (refIdParam && !isSelfReferral) ? refIdParam : null;

        profile = {
          telegramId: tgUser.id,
          name: `${tgUser.first_name} ${tgUser.last_name || ''}`.trim(),
          username: tgUser.username || tgUser.first_name.toLowerCase(),
          balance: 5.00, // 5 BDT Welcome incentive to test immediately!
          referralBalance: 0,
          totalEarned: 5.00,
          referralCount: 0,
          referredBy: referrer,
          createdAt: new Date().toISOString(),
          isBanned: false
        };

        await DB.createUser(profile);
        addLog(`🎉 Welcome to Nexora! Logged in as @${profile.username}. +5.00 BDT Welcome Bonus credited!`, 'system');

        // Notify and credit referrer
        if (referrer) {
          const referrerProfile = await DB.getUser(referrer);
          if (referrerProfile) {
            await DB.updateUser(referrer, {
              referralCount: referrerProfile.referralCount + 1,
            });
            addLog(`📲 New Downline: User @${profile.username} joined via your referral link! You will receive a 10% commission on their earnings!`, 'referral');
          }
        }
      } else {
        addLog(`🔑 Account logged in: @${profile.username}. Active local balance: ${profile.balance.toFixed(2)} BDT.`, 'system');
      }

      setUserProfile(profile);

      // Automatically lock admin view if admin ID
      if (tgUser.id === '999999999') {
        setIsAdmin(true);
      }
    } catch (err: any) {
      console.error('Authentication process failed', err);
    }
  };

  // Switch/Simulate referral deep link clicks
  const handleTriggerReferral = (referrerId: string) => {
    setPendingReferrer(referrerId);
    addLog(`🔗 Sandbox: Deep-link Referral start program loaded with parameter ?start=${referrerId}. Next custom login will list start=${referrerId} as referrer!`, 'system');
  };

  // --- TASK VISIT COMPLETION LOGIC (WITH 10% PASSIVE COMMISSION) ---
  const handleCompleteTask = async (task: Task) => {
    if (!userProfile) return;

    if (userProfile.isBanned) {
      throw new Error('Your account is banned. Tasks cannot be completed.');
    }

    // Daily task limit validation
    const limit = systemConfig.dailyTaskLimit;
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const completedToday = userVisits.filter(v => new Date(v.timestamp).getTime() > oneDayAgo).length;

    if (completedToday >= limit) {
      throw new Error(`Daily limit reached! You have completed ${completedToday}/${limit} tasks in the last 24 hours.`);
    }

    try {
      // 1. Log visit task
      const timestamp = new Date().toISOString();
      await DB.createVisit({
        userId: userProfile.telegramId,
        taskId: task.id,
        reward: task.reward,
        timestamp
      });

      // 2. Add rewards to earner
      const nextBalance = userProfile.balance + task.reward;
      const nextTotalEarned = userProfile.totalEarned + task.reward;
      await DB.updateUser(userProfile.telegramId, {
        balance: nextBalance,
        totalEarned: nextTotalEarned
      });

      // Update in-memory userProfile State
      const updatedProfile = { ...userProfile, balance: nextBalance, totalEarned: nextTotalEarned };
      setUserProfile(updatedProfile);

      // 3. Process 10% Passive Referral Commission
      if (userProfile.referredBy) {
        const commissionAmount = task.reward * 0.10;
        const referrerProfile = await DB.getUser(userProfile.referredBy);
        
        if (referrerProfile && !referrerProfile.isBanned) {
          const refNextBalance = referrerProfile.balance + commissionAmount;
          const refNextReferralBalance = referrerProfile.referralBalance + commissionAmount;
          const refNextTotalEarned = referrerProfile.totalEarned + commissionAmount;

          await DB.updateUser(userProfile.referredBy, {
            balance: refNextBalance,
            referralBalance: refNextReferralBalance,
            totalEarned: refNextTotalEarned
          });

          // Sim push notification to referrer
          addLog(`🤝 Referral Earning: Your friend @${userProfile.username || userProfile.name} visited a website. You earned 10% commission: +${commissionAmount.toFixed(2)} BDT!`, 'referral');
        }
      }

      // Add push notification to user
      addLog(`💵 Task Complete: You successfully visited "${task.title}". +${task.reward.toFixed(2)} BDT credited!`, 'task');

      // Refresh data
      loadProfileDependentData();
    } catch (e: any) {
      throw new Error(e.message || 'Reward processing failed.');
    }
  };

  // --- SUBMIT CASH WITHDRAW REQ ---
  const handleSubmitWithdraw = async (amount: number, fee: number, method: 'bKash' | 'Nagad', paymentNumber: string) => {
    if (!userProfile) return;

    const totalDeducted = amount + fee;

    try {
      // Create request
      await DB.createWithdrawal({
        userId: userProfile.telegramId,
        amount,
        fee,
        paymentMethod: method,
        paymentNumber,
        status: 'pending',
        createdAt: new Date().toISOString()
      });

      // Update user balance
      const nextBalance = userProfile.balance - totalDeducted;
      await DB.updateUser(userProfile.telegramId, { balance: nextBalance });

      setUserProfile({ ...userProfile, balance: nextBalance });

      addLog(`💵 Withdraw Request: Sent a request for ${amount.toFixed(2)} BDT to your ${method} wallet. Service fee: ${fee.toFixed(2)} BDT. Processing...`, 'payout');

      loadProfileDependentData();
    } catch (err: any) {
      throw new Error(err.message || 'Withdraw submission failed.');
    }
  };

  // --- ADMIN AUDITING DISPATCH GATEWAY ---
  const handleAdminUpdateWithdrawal = async (id: string, status: 'approved' | 'rejected') => {
    try {
      // Retrieve withdrawal request info
      const list = await DB.getWithdrawals();
      const req = list.find(w => w.id === id);

      if (!req) return;

      await DB.updateWithdrawalStatus(id, status);

      // Refund if rejected
      if (status === 'rejected') {
        const targetUserProfile = await DB.getUser(req.userId);
        if (targetUserProfile) {
          const refundAmount = req.amount + req.fee;
          await DB.updateUser(req.userId, {
            balance: targetUserProfile.balance + refundAmount
          });
          addLog(`❌ Payout Rejected: Your withdrawal of ${req.amount.toFixed(2)} BDT has been rejected. Refund of ${refundAmount.toFixed(2)} BDT credited back to balance.`, 'payout');
        }
      } else {
        addLog(`✅ Payout Approved: ${req.amount.toFixed(2)} BDT sent successfully to recipient ${req.paymentMethod} wallet: ${req.paymentNumber}!`, 'payout');
      }

      // Refresh databases
      loadProfileDependentData();
    } catch (e: any) {
      alert('Error executing administrative transaction: ' + e.message);
    }
  };

  // Edit user profile updates (Admin usage)
  const handleAdminUpdateUserProfile = async (telegramId: string, updates: Partial<UserProfile>) => {
    try {
      await DB.updateUser(telegramId, updates);
      if (currentUser?.id === telegramId) {
        setUserProfile((prev) => prev ? { ...prev, ...updates } : null);
      }
      loadProfileDependentData();
    } catch (e) {
      console.error(e);
    }
  };

  // Task overrides
  const handleAdminAddTask = async (taskData: Omit<Task, 'id'>) => {
    await DB.createTask(taskData);
    await loadTasks();
    addLog(`📣 New Sponsorship Available: "${taskData.title}" for BDT ${taskData.reward}! Visit now to earn.`, 'task');
  };

  const handleAdminUpdateTask = async (id: string, updates: Partial<Task>) => {
    await DB.updateTask(id, updates);
    await loadTasks();
  };

  const handleAdminDeleteTask = async (id: string) => {
    await DB.deleteTask(id);
    await loadTasks();
  };

  // Check if account is blocked
  const isBanned = userProfile?.isBanned ?? false;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between pb-8">
      
      {/* 1. SANDBOX HEADER TOOLBAR TRIGGER */}
      {!isTelegramView && (
        <SimToolbar
          currentSimUser={currentUser}
          onSelectUser={(u) => handleAuthenticate(u, null)}
          onTriggerReferral={handleTriggerReferral}
          isAdmin={isAdmin}
          onToggleAdmin={() => setIsAdmin(!isAdmin)}
          isFirebaseActive={isFirebaseConfigured}
        />
      )}

      {/* Main Container Core */}
      <main className="max-w-4xl w-full mx-auto px-4 py-6 flex-1 space-y-6">
        
        {/* Ban Warning Overlay */}
        {isBanned && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 flex items-start gap-3 shadow animate-pulse">
            <ShieldAlert className="h-6 w-6 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-rose-300">Account Banned Notice</h4>
              <p className="text-xs text-rose-400">
                This account has been flagged and suspended for violating terms (e.g. anti-abuse trigger or dual-accounts signup detection). Task completions and withdrawal orders have been frozen.
              </p>
            </div>
          </div>
        )}

        {/* Brand Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-900">
          <div className="space-y-0.5">
            <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-1.5 font-mono">
              <Coins className="h-5.5 w-5.5 text-blue-400 shrink-0" />
              NEXORA <span className="text-blue-500 text-xs font-semibold tracking-wider font-sans bg-blue-500/10 px-1.5 py-0.5 rounded">VISIT EARN</span>
            </h1>
            <p className="text-[11px] text-slate-500 font-medium">Telegram Mini App sponsorship-traffic hub</p>
          </div>

          {/* User Widget card head */}
          {userProfile && (
            <div className="flex items-center gap-2.5 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
              <div className="text-left leading-none">
                <span className="text-xs font-bold text-slate-200 block truncate max-w-28">{userProfile.name}</span>
                <span className="text-[10px] text-slate-500 font-mono">ID: {userProfile.telegramId}</span>
              </div>
            </div>
          )}
        </div>

        {/* Dashboard Grid Balance widgets */}
        {userProfile && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            {/* Primary Balance Board */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 md:col-span-2 flex flex-col justify-between relative overflow-hidden">
              {/* Background gradient bulb */}
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl"></div>

              <div className="space-y-1 relative">
                <span className="text-[10px] text-slate-400 uppercase tracking-wide font-mono flex items-center gap-1">
                  <Coins className="h-3.5 w-3.5 text-amber-500" /> Account Wallet Balance
                </span>
                <strong className="text-3xl font-black text-amber-400 font-mono block tracking-tight">
                  ৳ {userProfile.balance.toFixed(2)} <span className="text-xs text-slate-400 font-normal">BDT</span>
                </strong>
              </div>

              <div className="mt-5 flex items-center gap-2 pt-2 border-t border-slate-850/40">
                <button
                  onClick={() => setShowWithdraw(true)}
                  disabled={isBanned}
                  className={`text-xs px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl transition shadow-md shadow-amber-500/5 active:scale-95 ${
                    isBanned ? 'opacity-40 cursor-not-allowed' : ''
                  }`}
                >
                  Withdraw Cash
                </button>
                <div className="text-[10px] text-slate-400 leading-none">
                  Min: 50.00 BDT <br />
                  <span className="text-slate-500 font-mono">10% service fee</span>
                </div>
              </div>
            </div>

            {/* Total Earning */}
            <div className="glass-panel p-4.5 rounded-2xl border border-slate-800/80 flex flex-col justify-between">
              <span className="text-[10px] text-slate-500 uppercase font-mono tracking-wider flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-emerald-400" /> Cumulative Earned
              </span>
              <div className="mt-2.5">
                <strong className="text-xl font-bold font-mono text-emerald-400">
                  {userProfile.totalEarned.toFixed(2)} BDT
                </strong>
                <p className="text-[10px] text-slate-400 mt-1">Visits rewards + Invite cuts</p>
              </div>
            </div>

            {/* Referrals Stats card */}
            <div className="glass-panel p-4.5 rounded-2xl border border-slate-800/80 flex flex-col justify-between">
              <span className="text-[10px] text-slate-500 uppercase font-mono tracking-wider flex items-center gap-1">
                <Users className="h-3 w-3 text-purple-400" /> Referral Earnings
              </span>
              <div className="mt-2.5">
                <strong className="text-xl font-bold font-mono text-purple-400">
                  {userProfile.referralBalance.toFixed(2)} BDT
                </strong>
                <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400 pr-1">
                  <span>Count: <strong>{userProfile.referralCount}</strong></span>
                  <span className="text-[9px] px-1 bg-purple-500/10 text-purple-400 rounded">10% commission</span>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Tab view selectors */}
        <div className="flex border-b border-slate-900 pb-px gap-6">
          <button
            onClick={() => setActiveTab('earn')}
            className={`pb-3 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer relative ${
              activeTab === 'earn' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="h-4 w-4 shrink-0" /> Earn visits
          </button>
          <button
            onClick={() => setActiveTab('share')}
            className={`pb-3 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer relative ${
              activeTab === 'share' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Gift className="h-4 w-4 shrink-0" /> Referral Invite Link
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-3 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer relative ${
              activeTab === 'history' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="h-3.5 w-3.5 shrink-0" /> Withdrawals history
          </button>

          {/* Secure Admin Gate tab link (requires admin mode toggled) */}
          {isAdmin && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`pb-3 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer relative ${
                activeTab === 'admin' ? 'text-rose-400 border-b-2 border-rose-400' : 'text-slate-500 hover:text-rose-450'
              }`}
            >
              <HelpCircle className="h-3.5 w-3.5 text-rose-500 shrink-0 animate-pulse" /> ADMIN PANEL
            </button>
          )}
        </div>

        {/* 2. VIEWS SWITCH CONTROLLERS */}
        
        {/* VIEW A: EARN SPONSOR VISITS */}
        {activeTab === 'earn' && (
          <TaskVisitManager
            tasks={tasks}
            userProfile={userProfile}
            userVisits={userVisits}
            onCompleteTask={handleCompleteTask}
            dailyTaskLimit={systemConfig.dailyTaskLimit}
          />
        )}

        {/* VIEW B: INVITE DOWNLINES PROGRAM */}
        {activeTab === 'share' && (
          <ReferralWidget
            userProfile={userProfile}
            referredUsers={referredUsers}
          />
        )}

        {/* VIEW C: WITHDRAW HISTORY INDEX */}
        {activeTab === 'history' && (
          <div className="glass-panel p-5 rounded-2xl space-y-4">
            <h3 className="font-bold text-slate-200 text-sm flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-blue-400" /> Outgoing Withdraw Payout Logs
            </h3>
            
            {allWithdrawals.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-slate-800 rounded-xl text-slate-500 text-xs">
                No cashout history records found for your user segment.
              </div>
            ) : (
              <div className="divide-y divide-slate-850 border border-slate-850 rounded-xl overflow-hidden text-xs">
                {allWithdrawals.map((withdraw) => (
                  <div key={withdraw.id} className="p-3.5 flex items-center justify-between hover:bg-slate-900/10">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase text-white ${
                          withdraw.paymentMethod === 'bKash' ? 'bg-pink-600' : 'bg-orange-600'
                        }`}>
                          {withdraw.paymentMethod}
                        </span>
                        <strong className="font-mono text-slate-200">{withdraw.paymentNumber}</strong>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Requested: {new Date(withdraw.createdAt).toLocaleString()}
                      </div>
                    </div>

                    <div className="text-right space-y-1">
                      <strong className="text-white font-mono text-sm block">৳ {withdraw.amount.toFixed(2)} BDT</strong>
                      <div className="flex items-center gap-1.5 justify-end">
                        <span className="text-[10px] text-slate-500 font-mono">Fee: {withdraw.fee.toFixed(2)} BDT</span>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                          withdraw.status === 'approved' 
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' 
                            : withdraw.status === 'rejected'
                            ? 'bg-rose-500/15 text-rose-400 border border-rose-500/20' 
                            : 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                        }`}>
                          {withdraw.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW D: SECURE ADMINISTRATIVE PANEL */}
        {activeTab === 'admin' && isAdmin && (
          <AdminPanel
            users={allUsers}
            tasks={tasks}
            withdrawals={allWithdrawals}
            allVisitsCount={allVisitsCount}
            onAddTask={handleAdminAddTask}
            onUpdateTask={handleAdminUpdateTask}
            onDeleteTask={handleAdminDeleteTask}
            onUpdateUser={handleAdminUpdateUserProfile}
            onUpdateWithdrawal={handleAdminUpdateWithdrawal}
            onAddSystemNotification={(text) => addLog(text, 'system')}
            systemConfig={systemConfig}
            onUpdateSystemConfig={handleUpdateSystemConfig}
          />
        )}

      </main>

      {/* 3. WITHDRAWAL FORM DIALOG OVERLAY */}
      {showWithdraw && (
        <WithdrawModal
          userProfile={userProfile}
          onClose={() => setShowWithdraw(false)}
          onSubmitWithdraw={handleSubmitWithdraw}
          withdrawals={allWithdrawals.filter(w => w.userId === userProfile?.telegramId)}
        />
      )}

      {/* 4. ROLLING PUSH TICKER STATUS BAR */}
      <NotificationToast 
        logs={logs}
        onClearLogs={() => setLogs([])}
      />

    </div>
  );
}
