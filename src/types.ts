/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface TelegramUser {
  id: string;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
}

export interface UserProfile {
  telegramId: string;
  name: string;
  username: string;
  balance: number;
  referralBalance: number;
  totalEarned: number;
  referralCount: number;
  referredBy: string | null;
  createdAt: string;
  isBanned?: boolean;
}

export interface Task {
  id: string;
  title: string;
  url: string;
  reward: number; // in BDT
  cooldown: number; // in hours or minutes (let's store as minutes or hours, let's keep it as cooldown hours/minutes, we will use minutes to make it easier to test!)
  status: 'active' | 'inactive';
}

export interface Visit {
  id: string;
  userId: string; // telegramId
  taskId: string;
  reward: number;
  timestamp: string;
}

export interface Withdrawal {
  id: string;
  userId: string; // telegramId
  amount: number;
  fee: number; // 10% fee
  paymentMethod: 'bKash' | 'Nagad';
  paymentNumber: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface SystemConfig {
  dailyTaskLimit: number;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  };
}
