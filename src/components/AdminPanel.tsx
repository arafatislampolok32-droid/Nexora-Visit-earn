/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  BarChart, 
  Users, 
  CheckCircle, 
  XSquare, 
  Trash2, 
  Plus, 
  Edit, 
  Power, 
  Settings, 
  Search, 
  DollarSign, 
  Eye, 
  Ban, 
  RefreshCw,
  Clock,
  ExternalLink
} from 'lucide-react';
import { UserProfile, Task, Withdrawal, Visit, SystemConfig } from '../types';

interface AdminPanelProps {
  users: UserProfile[];
  tasks: Task[];
  withdrawals: Withdrawal[];
  allVisitsCount: number;
  onAddTask: (task: Omit<Task, 'id'>) => Promise<void>;
  onUpdateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  onDeleteTask: (id: string) => Promise<void>;
  onUpdateUser: (telegramId: string, updates: Partial<UserProfile>) => Promise<void>;
  onUpdateWithdrawal: (id: string, status: Withdrawal['status']) => Promise<void>;
  onAddSystemNotification: (text: string) => void;
  systemConfig: SystemConfig;
  onUpdateSystemConfig: (updates: Partial<SystemConfig>) => Promise<void>;
}

export default function AdminPanel({
  users,
  tasks,
  withdrawals,
  allVisitsCount,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onUpdateUser,
  onUpdateWithdrawal,
  onAddSystemNotification,
  systemConfig,
  onUpdateSystemConfig
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'tasks' | 'withdrawals' | 'config'>('stats');

  // Search filter states
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<UserProfile | null>(null);
  const [arbitraryBalance, setArbitraryBalance] = useState('');

  // Task creation form states
  const [taskTitle, setTaskTitle] = useState('');
  const [taskUrl, setTaskUrl] = useState('');
  const [taskReward, setTaskReward] = useState('0.10');
  const [taskCooldown, setTaskCooldown] = useState('24'); // default 24 hours
  const [isCreatingTask, setIsCreatingTask] = useState(false);

  // Stats Counters
  const totalBalanceAcrossUsers = users.reduce((acc, u) => acc + u.balance, 0);
  const totalCommissionEarned = users.reduce((acc, u) => acc + u.referralBalance, 0);
  const totalEarnedAcrossUsers = users.reduce((acc, u) => acc + u.totalEarned, 0);
  const pendingCount = withdrawals.filter(w => w.status === 'pending').length;
  const approvedCount = withdrawals.filter(w => w.status === 'approved').length;

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle || !taskUrl) return;

    try {
      await onAddTask({
        title: taskTitle.trim(),
        url: taskUrl.trim(),
        reward: parseFloat(taskReward) || 0.10,
        cooldown: (parseInt(taskCooldown) || 24) * 60, // Convert hours to minutes (e.g. 24 hours = 1440 mins)
        status: 'active'
      });
      setTaskTitle('');
      setTaskUrl('');
      setIsCreatingTask(false);
      onAddSystemNotification(`New Task Available: "${taskTitle}" added by Administrator!`);
    } catch (err: any) {
      alert(err.message || 'Error occurred creating task');
    }
  };

  const handleUpdateUserBalance = async (user: UserProfile) => {
    const parsed = parseFloat(arbitraryBalance);
    if (isNaN(parsed)) return;
    try {
      await onUpdateUser(user.telegramId, { balance: parsed });
      setSelectedUserForEdit(null);
      setArbitraryBalance('');
      onAddSystemNotification(`Balance adjusted for @${user.username || user.name} to ${parsed.toFixed(2)} BDT.`);
    } catch (err) {
      alert('Failed to update user balance.');
    }
  };

  // Filter lists
  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    (u.username && u.username.toLowerCase().includes(userSearchQuery.toLowerCase())) ||
    u.telegramId.includes(userSearchQuery)
  );

  return (
    <div className="glass-panel p-5 rounded-3xl border border-rose-500/10">
      {/* Tab bar header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-800 gap-3 mb-6">
        <div>
          <h2 className="text-base font-black text-rose-400 flex items-center gap-1.5 font-mono">
            <Settings className="h-5 w-5 text-rose-500 shrink-0" /> SECURITY ADMIN TERMINAL
          </h2>
          <p className="text-xs text-slate-400">Nexora system state override and transaction dispatch center</p>
        </div>

        <div className="flex flex-wrap gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-850">
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'stats' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Analytics
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition relative ${
              activeTab === 'users' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Earnings Board ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'tasks' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Task Links ({tasks.length})
          </button>
          <button
            onClick={() => setActiveTab('withdrawals')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
              activeTab === 'withdrawals' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Withdraw requests
            {pendingCount > 0 && (
              <span className="bg-amber-500 text-slate-950 px-1 py-0.5 rounded text-[9px] font-black">{pendingCount}</span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('config')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'config' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Settings className="h-3.5 w-3.5" /> Config Settings
          </button>
        </div>
      </div>

      {/* TABS CONTAINER */}

      {/* 1. STATS TAB */}
      {activeTab === 'stats' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-850">
              <span className="text-[10px] text-slate-500 block uppercase font-mono">Total Earners</span>
              <span className="text-2xl font-black text-rose-400 font-mono block mt-1">{users.length}</span>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-850">
              <span className="text-[10px] text-slate-500 block uppercase font-mono">Banned Users</span>
              <span className="text-2xl font-black text-slate-300 font-mono block mt-1">
                {users.filter(u => u.isBanned).length}
              </span>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-850">
              <span className="text-[10px] text-slate-500 block uppercase font-mono">Verified Tasks Visited</span>
              <span className="text-2xl font-black text-emerald-400 font-mono block mt-1">{allVisitsCount}</span>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-850">
              <span className="text-[10px] text-slate-500 block uppercase font-mono">System Liabilities</span>
              <span className="text-2xl font-black text-amber-500 font-mono block mt-1">
                {totalBalanceAcrossUsers.toFixed(1)} <span className="text-xs font-sans">BDT</span>
              </span>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-850Col span-2 md:col-span-1">
              <span className="text-[10px] text-slate-500 block uppercase font-mono">Pending Cash Payouts</span>
              <span className="text-2xl font-black text-amber-400 font-mono block mt-1">{pendingCount}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* System Revenue Estimation */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-850 space-y-3">
              <h3 className="font-bold text-slate-200 text-xs uppercase tracking-wide">Platform Trafffic Monetization Analysis</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                As visit rewards are calculated (0.10 BDT per task), the system acts as an arbitrage portal. Monetag and Adsterra average link rewards can deliver higher CPMs, keeping Nexora profitable.
              </p>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1.5 text-xs text-slate-300">
                <div className="flex justify-between">
                  <span>Gross user earnings payout:</span>
                  <strong className="text-rose-400 font-mono">৳ {totalEarnedAcrossUsers.toFixed(2)} BDT</strong>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-1.5">
                  <span>Passive override commission (10%):</span>
                  <strong className="text-purple-400 font-mono">৳ {totalCommissionEarned.toFixed(2)} BDT</strong>
                </div>
                <div className="flex justify-between pt-1.5 font-bold">
                  <span>Cumulative Sponsor Arbitrage Value (approx):</span>
                  <strong className="text-emerald-400 font-mono">৳ {(totalEarnedAcrossUsers * 2.2).toFixed(2)} BDT</strong>
                </div>
              </div>
            </div>

            {/* Quick Audit Tips */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-850 space-y-3 text-xs text-slate-400 leading-relaxed">
              <h3 className="font-bold text-slate-200 uppercase tracking-wide">Anti-Abuse Fraud Guidelines</h3>
              <ul className="list-disc pl-4 space-y-1.5">
                <li>Check for users with identical IPs/Devices clicking tasks rapidly.</li>
                <li>Verify withdrawal accounts regularly to ensure bKash/Nagad channels are correct.</li>
                <li>The client-side verifier implements strict 15-second blockades and debounce protections natively.</li>
                <li>Edit any profile balance directly within the "Earnings Board" tab.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* 2. USER DECK TAB */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-2 rounded-xl border border-slate-850 w-full max-w-sm">
            <Search className="h-4 w-4 text-slate-500 shrink-0" />
            <input
              type="text"
              placeholder="Search user ID, Name, Username..."
              value={userSearchQuery}
              onChange={(e) => setUserSearchQuery(e.target.value)}
              className="bg-transparent text-xs text-slate-200 outline-none border-none w-full"
            />
          </div>

          <div className="border border-slate-850 rounded-xl overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-400 border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-300 font-mono border-b border-slate-850">
                  <th className="p-3">Telegram Username</th>
                  <th className="p-3">User ID</th>
                  <th className="p-3 text-right">Main Balance</th>
                  <th className="p-3 text-right">Total Earnings</th>
                  <th className="p-3 text-right">Referrals count</th>
                  <th className="p-3 text-slate-400 font-normal">Registered</th>
                  <th className="p-3 text-right">Action Gate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850/50">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-6 text-slate-500 text-xs">
                      No matching user profiles found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr 
                      key={user.telegramId} 
                      className={`hover:bg-slate-900/30 ${
                        user.isBanned ? 'bg-rose-950/10 text-rose-300/80' : ''
                      }`}
                    >
                      <td className="p-3 font-semibold text-slate-200">
                        <div className="flex items-center gap-1.5">
                          <span>{user.name}</span>
                          {user.username && (
                            <span className="text-[10px] text-slate-500">@{user.username}</span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 font-mono text-slate-500">{user.telegramId}</td>
                      <td className="p-3 text-right font-mono text-amber-400 font-bold">
                        {user.balance.toFixed(2)} BDT
                      </td>
                      <td className="p-3 text-right font-mono text-emerald-400">
                        {user.totalEarned.toFixed(2)} BDT
                      </td>
                      <td className="p-3 text-right font-mono text-purple-400 font-bold">{user.referralCount}</td>
                      <td className="p-3">{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td className="p-3 text-right space-x-1.5">
                        <button
                          onClick={() => {
                            setSelectedUserForEdit(user);
                            setArbitraryBalance(user.balance.toString());
                          }}
                          className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-350 text-[10px] rounded"
                        >
                          Edit Bal
                        </button>

                        <button
                          onClick={() => onUpdateUser(user.telegramId, { isBanned: !user.isBanned })}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            user.isBanned 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {user.isBanned ? 'Unban' : 'Ban'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* EDIT BALANCE OVERLAY BOX */}
          {selectedUserForEdit && (
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl max-w-sm space-y-3 scale-up">
              <span className="text-xs text-slate-200 font-bold">
                Adjust Balance for <strong>{selectedUserForEdit.name}</strong>
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.01"
                  value={arbitraryBalance}
                  onChange={(e) => setArbitraryBalance(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white w-full"
                />
                <button
                  onClick={() => handleUpdateUserBalance(selectedUserForEdit)}
                  className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs px-3 py-1 rounded"
                >
                  Save
                </button>
                <button
                  onClick={() => setSelectedUserForEdit(null)}
                  className="text-slate-400 hover:text-white text-xs px-1.5"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. TASK BOARD TAB */}
      {activeTab === 'tasks' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300">Live Traffic Earning Links ({tasks.length})</span>
            <button
              onClick={() => setIsCreatingTask(!isCreatingTask)}
              className="px-3 py-1.5 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-bold rounded-lg text-xs flex items-center gap-1 transition"
            >
              <Plus className="h-3.5 w-3.5" /> {isCreatingTask ? 'Close Creator' : 'Configure New Task'}
            </button>
          </div>

          {isCreatingTask && (
            <form onSubmit={handleCreateTask} className="p-4 bg-slate-950 border border-slate-850 rounded-2xl max-w-lg space-y-3.5">
              <span className="text-xs font-bold text-slate-200 block">Sponsorship Task Schema</span>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400 block">Task Display Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Monetag Sponsorship Link 1"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400 block">Monetag/Adsterra Link URL</label>
                  <input
                    type="url"
                    required
                    placeholder="https://link-server-xyz.com"
                    value={taskUrl}
                    onChange={(e) => setTaskUrl(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400 block">Reward Amount (BDT)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.10"
                    value={taskReward}
                    onChange={(e) => setTaskReward(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-rose-500 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400 block">Cooldown Period (Hours / ঘন্টা)</label>
                  <input
                    type="number"
                    required
                    placeholder="24"
                    value={taskCooldown}
                    onChange={(e) => setTaskCooldown(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-rose-500 font-mono"
                  />
                  <span className="text-[9px] text-slate-500 block">Default is 24 hours (২৪ ঘন্টা পর আবার করা যাবে)</span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg transition text-xs"
              >
                Assemble sponsorship task
              </button>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {tasks.map((task) => (
              <div key={task.id} className="p-4 bg-slate-950 border border-slate-850/60 rounded-2xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                      task.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'
                    }`}>
                      {task.status}
                    </span>
                    <strong className="text-white font-mono text-sm">{task.reward.toFixed(2)} BDT</strong>
                  </div>
                  <h4 className="font-bold text-slate-200 text-sm mt-1">{task.title}</h4>
                  <p className="text-[10px] text-slate-500 font-mono truncate mt-0.5" title={task.url}>{task.url}</p>
                  <p className="text-[11px] text-slate-400 font-mono mt-1 flex items-center gap-1">
                    <Clock className="h-3 w-3 text-rose-500" /> Cooldown: {task.cooldown >= 60 ? `${Math.floor(task.cooldown / 60)} hours` : `${task.cooldown} mins`}
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-slate-900 pt-3 mt-4">
                  <button
                    onClick={() => onUpdateTask(task.id, { status: task.status === 'active' ? 'inactive' : 'active' })}
                    className={`px-2.5 py-1 rounded text-xs font-bold transition flex items-center gap-1 ${
                      task.status === 'active' 
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20' 
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                    }`}
                  >
                    <Power className="h-3 w-3" /> {task.status === 'active' ? 'Disable' : 'Enable'}
                  </button>

                  <button
                    onClick={() => {
                      if (confirm('Delete sponsorship task?')) onDeleteTask(task.id);
                    }}
                    className="p-1 px-2 border border-rose-900/40 text-rose-500 hover:text-white hover:bg-rose-950/40 rounded transition"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. WITHDRAWALS TAB */}
      {activeTab === 'withdrawals' && (
        <div className="space-y-4">
          <span className="text-xs font-bold text-slate-300 block">Pending Withdraw Reviews List</span>

          <div className="border border-slate-850 rounded-xl overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-400 border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-300 font-mono border-b border-slate-850">
                  <th className="p-3">User ID</th>
                  <th className="p-3">Cash Method</th>
                  <th className="p-3">Recipient Number</th>
                  <th className="p-3 text-right">Requested amount</th>
                  <th className="p-3 text-right">Friction Fee</th>
                  <th className="p-3 font-normal">Initiated</th>
                  <th className="p-3 font-normal">Status</th>
                  <th className="p-3 text-right">Review Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850/50">
                {withdrawals.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-6 text-slate-500 text-xs">
                      No customer withdraw audits recorded in system.
                    </td>
                  </tr>
                ) : (
                  withdrawals.map((withdraw) => (
                    <tr key={withdraw.id} className="hover:bg-slate-900/30">
                      <td className="p-3 font-mono text-slate-300">{withdraw.userId}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black text-white ${
                          withdraw.paymentMethod === 'bKash' ? 'bg-pink-600' : 'bg-orange-600'
                        }`}>{withdraw.paymentMethod}</span>
                      </td>
                      <td className="p-3 font-mono text-slate-200">{withdraw.paymentNumber}</td>
                      <td className="p-3 text-right font-mono text-amber-400 font-bold">
                        {withdraw.amount.toFixed(2)} BDT
                      </td>
                      <td className="p-3 text-right font-mono text-rose-400">
                        {withdraw.fee.toFixed(2)} BDT
                      </td>
                      <td className="p-3">{new Date(withdraw.createdAt).toLocaleString()}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                          withdraw.status === 'approved' 
                            ? 'bg-emerald-500/15 text-emerald-400' 
                            : withdraw.status === 'rejected'
                            ? 'bg-rose-500/15 text-rose-400' 
                            : 'bg-amber-500/15 text-amber-400'
                        }`}>
                          {withdraw.status}
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-1.5 flex justify-end">
                        {withdraw.status === 'pending' && (
                          <>
                            <button
                              onClick={() => {
                                onUpdateWithdrawal(withdraw.id, 'approved');
                                onAddSystemNotification(`Payout Approved: ${withdraw.amount.toFixed(2)} BDT dispatched to ${withdraw.paymentMethod} of ${withdraw.userId}.`);
                              }}
                              className="px-2 py-0.5 bg-emerald-600 text-slate-950 font-black text-[10px] rounded hover:bg-emerald-500 transition"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                onUpdateWithdrawal(withdraw.id, 'rejected');
                                onAddSystemNotification(`Payout Rejected: request from user ${withdraw.userId} returned.`);
                              }}
                              className="px-2 py-0.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] rounded transition"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {withdraw.status === 'approved' && (
                          <div className="text-[10px] text-emerald-400 font-bold font-mono">SUCCESS DISPATCHED</div>
                        )}
                        {withdraw.status === 'rejected' && (
                          <div className="text-[10px] text-rose-500 font-bold font-mono font-normal flex items-center gap-1 leading-none">
                            REJECT RETRACT
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. CONFIGURATION TAB */}
      {activeTab === 'config' && (
        <div className="space-y-4">
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-850 space-y-4">
            <div>
              <h3 className="font-bold text-slate-200 text-sm flex items-center gap-2">
                <Settings className="h-4 w-4 text-rose-500" /> Global Earning Constraints Config
              </h3>
              <p className="text-xs text-slate-400 font-sans mt-0.5">Configure system parameters to mitigate traffic fraud and control direct monetag link payouts.</p>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              const limitStr = (e.currentTarget.elements.namedItem('dailyLimit') as HTMLInputElement).value;
              const limitParsed = parseInt(limitStr);
              if (!isNaN(limitParsed) && limitParsed > 0) {
                try {
                  await onUpdateSystemConfig({ dailyTaskLimit: limitParsed });
                  alert(`Task completed window throttle threshold updated to ${limitParsed} successfully!`);
                } catch {
                  alert('Error updating system values.');
                }
              }
            }} className="space-y-4 max-w-sm pt-2">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-rose-450 uppercase tracking-widest font-mono">Maximum visits per 24-hour cycle</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    name="dailyLimit"
                    defaultValue={systemConfig.dailyTaskLimit}
                    min="1"
                    max="500"
                    placeholder="e.g. 10"
                    className="flex-1 bg-slate-900 border border-slate-800 text-slate-100 px-3 py-2 rounded-xl text-xs font-mono focus:outline-none focus:border-rose-500"
                    required
                  />
                  <button
                    type="submit"
                    className="bg-rose-650 hover:bg-rose-500 active:scale-95 text-white font-bold px-4 py-2 rounded-xl text-xs transition flex items-center gap-1.5"
                  >
                    Save Config
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 font-sans">
                  The client throttles further click rewards when completed visits in a sliding 24-hour window cross this value.
                </p>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
