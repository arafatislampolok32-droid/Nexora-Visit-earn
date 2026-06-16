/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  X, 
  Landmark, 
  CreditCard, 
  DollarSign, 
  CheckCircle, 
  Info, 
  AlertCircle 
} from 'lucide-react';
import { UserProfile, Withdrawal } from '../types';

interface WithdrawModalProps {
  userProfile: UserProfile | null;
  onClose: () => void;
  onSubmitWithdraw: (amount: number, fee: number, method: 'bKash' | 'Nagad', number: string) => Promise<void>;
  withdrawals: Withdrawal[];
}

export default function WithdrawModal({
  userProfile,
  onClose,
  onSubmitWithdraw,
  withdrawals
}: WithdrawModalProps) {
  const [amountInput, setAmountInput] = useState<string>('');
  const [method, setMethod] = useState<'bKash' | 'Nagad'>('bKash');
  const [paymentNumber, setPaymentNumber] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Constants
  const MIN_WITHDRAW = 50; // BDT
  const FEE_TRANS = 0.10; // 10%

  const amount = parseFloat(amountInput) || 0;
  const fee = amount * FEE_TRANS;
  const requiredBalance = amount + fee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!userProfile) {
      setErrorMsg('You must be logged in to request withdrawal.');
      return;
    }

    if (amount < MIN_WITHDRAW) {
      setErrorMsg(`Minimum withdrawal amount is ${MIN_WITHDRAW} BDT.`);
      return;
    }

    if (!paymentNumber.match(/^\+?(880)?01[3-9]\d{8}$/)) {
      setErrorMsg('Please enter a valid Bangladeshi mobile wallet number (e.g. 01712345678).');
      return;
    }

    if (userProfile.balance < requiredBalance) {
      setErrorMsg(`Insufficient balance. You need ${requiredBalance.toFixed(2)} BDT (including 10% fee) to withdraw ${amount.toFixed(2)} BDT.`);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmitWithdraw(amount, fee, method, paymentNumber);
      setSuccessMsg('Withdrawal request submitted successfully! Pending administrator review.');
      setAmountInput('');
      setPaymentNumber('');
      setTimeout(() => {
        onClose();
      }, 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit withdrawal request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 relative overflow-hidden shadow-2xl">
        {/* Glow effect */}
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl"></div>

        <div className="flex items-center justify-between mb-4 border-b border-slate-850 pb-3">
          <h3 className="font-bold text-slate-100 flex items-center gap-2 text-lg">
            <Landmark className="h-5 w-5 text-amber-500" /> Withdraw Wallet Earnings
          </h3>
          <button 
            onClick={onClose}
            className="p-1.5 bg-slate-800/60 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Balance Status Card */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-850 text-center">
            <span className="text-[10px] text-slate-400 font-mono tracking-wide block">AVAILABLE BALANCE</span>
            <strong className="text-xl text-amber-400 font-mono font-extrabold block mt-0.5">
              {userProfile?.balance.toFixed(2) || '0.00'} BDT
            </strong>
          </div>
          <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-850 text-center">
            <span className="text-[10px] text-slate-400 font-mono tracking-wide block">MINIMUM THRESHOLD</span>
            <strong className="text-xl text-slate-300 font-mono block mt-0.5">
              {MIN_WITHDRAW}.00 BDT
            </strong>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-xs flex items-start gap-2 animate-fade-in">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs flex items-start gap-2 animate-fade-in">
            <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Amount input */}
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-medium block">Withdrawal Amount (BDT)</label>
              <div className="relative">
                <input
                  type="number"
                  required
                  min={MIN_WITHDRAW}
                  placeholder="e.g. 50"
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-4 py-2.5 text-sm text-slate-200 font-mono focus:outline-none focus:border-amber-500 placeholder:text-slate-600"
                />
                <span className="absolute left-3 top-3 text-slate-500 font-mono text-xs">৳</span>
              </div>
            </div>

            {/* Target wallet method picker */}
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-medium block">Payment Gateway Method</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMethod('bKash')}
                  className={`py-2 px-3 rounded-xl border font-bold text-xs transition flex items-center justify-center gap-1.5 ${
                    method === 'bKash'
                      ? 'bg-gradient-to-r from-pink-600 to-rose-600 border-pink-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <CreditCard className="h-3 w-3 shrink-0" /> bKash
                </button>
                <button
                  type="button"
                  onClick={() => setMethod('Nagad')}
                  className={`py-2 px-3 rounded-xl border font-bold text-xs transition flex items-center justify-center gap-1.5 ${
                    method === 'Nagad'
                      ? 'bg-gradient-to-r from-orange-600 to-amber-600 border-orange-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <CreditCard className="h-3 w-3 shrink-0" /> Nagad
                </button>
              </div>
            </div>
          </div>

          {/* Payment phone number */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-medium block">Wallet Mobileno / Account Number</label>
            <input
              type="text"
              required
              placeholder="e.g. 017XXXXXXXX"
              value={paymentNumber}
              onChange={(e) => setPaymentNumber(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 font-mono focus:outline-none focus:border-amber-500 placeholder:text-slate-600"
            />
          </div>

          {/* Detailed Fee breakdown table */}
          {amount > 0 && (
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-850/60 text-xs space-y-2">
              <div className="flex justify-between text-slate-400">
                <span>Requested Amount (Sent to Wallet):</span>
                <span className="font-mono text-slate-200">{amount.toFixed(2)} BDT</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Withdraw Service Fee (10%):</span>
                <span className="font-mono text-rose-400">+{fee.toFixed(2)} BDT</span>
              </div>
              <div className="flex justify-between border-t border-slate-850 pt-2 font-bold text-slate-200">
                <span className="flex items-center gap-1 text-amber-300">
                  <Info className="h-3 w-3 shrink-0" /> Required Balance:
                </span>
                <span className="font-mono text-emerald-400">{requiredBalance.toFixed(2)} BDT</span>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || amountInput === '' || paymentNumber === ''}
            className={`w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:brightness-115 text-slate-950 font-black rounded-xl transition shadow-md shadow-amber-500/5 active:scale-95 ${
              isSubmitting ? 'opacity-85 cursor-wait' : ''
            }`}
          >
            {isSubmitting ? 'Registering transaction...' : 'Submit Withdraw Request'}
          </button>
        </form>

        {/* Past Withdraw History list */}
        <div className="mt-6 border-t border-slate-850 pt-4 space-y-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Last Withdrawals</span>
          {withdrawals.length === 0 ? (
            <div className="text-center py-4 bg-slate-950/20 border border-dashed border-slate-850 rounded-xl text-slate-500 text-[11px]">
              No withdrawal requests recorded yet.
            </div>
          ) : (
            <div className="max-h-28 overflow-y-auto space-y-1.5 pr-1">
              {withdrawals.map((w) => (
                <div key={w.id} className="p-2 bg-slate-950/40 border border-slate-850/60 rounded-lg flex items-center justify-between text-[11px]">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className={`px-1 rounded text-[9px] font-black uppercase text-white ${
                        w.paymentMethod === 'bKash' ? 'bg-pink-600' : 'bg-orange-600'
                      }`}>{w.paymentMethod}</span>
                      <span className="text-slate-300 font-mono">{w.paymentNumber}</span>
                    </div>
                    <span className="text-slate-500">{new Date(w.createdAt).toLocaleDateString()}</span>
                  </div>

                  <div className="text-right space-y-0.5">
                    <span className="font-bold text-white font-mono">{w.amount.toFixed(2)} BDT</span>
                    <div className="flex items-center justify-end">
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                        w.status === 'approved' 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : w.status === 'rejected'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {w.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
