/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  collection, 
  getDocs, 
  query, 
  where, 
  addDoc,
  writeBatch
} from 'firebase/firestore';
import { db, isFirebaseConfigured, auth } from '../firebase';
import { UserProfile, Task, Visit, Withdrawal, OperationType, FirestoreErrorInfo, SystemConfig } from '../types';

// Standard Error Handler per Firebase Integration Skill instructions
function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Default Seed Tasks if we need them
const DEFAULT_TASKS: Task[] = [
  {
    id: 'monetag-1',
    title: 'Monetag Premium Website Visit',
    url: 'https://www.google.com', // fallback URL
    reward: 0.10,
    cooldown: 10, // 10 minutes
    status: 'active'
  },
  {
    id: 'adsterra-1',
    title: 'Adsterra Direct Sponsorship Link',
    url: 'https://www.google.com', // fallback URL
    reward: 0.10,
    cooldown: 15, // 15 minutes
    status: 'active'
  },
  {
    id: 'monetag-high',
    title: 'High-Reward Partner Traffic',
    url: 'https://www.google.com',
    reward: 0.15,
    cooldown: 20, // 20 minutes
    status: 'active'
  }
];

// Offline LocalStorage Fallback helper keys
const STORAGE_KEYS = {
  USERS: 'nexora_users',
  TASKS: 'nexora_tasks',
  VISITS: 'nexora_visits',
  WITHDRAWALS: 'nexora_withdrawals',
};

// Ensure seed data in localStorage
function initLocalStorage() {
  if (!localStorage.getItem(STORAGE_KEYS.TASKS)) {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(DEFAULT_TASKS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.VISITS)) {
    localStorage.setItem(STORAGE_KEYS.VISITS, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.WITHDRAWALS)) {
    localStorage.setItem(STORAGE_KEYS.WITHDRAWALS, JSON.stringify([]));
  }
}

// Export database operations
export const DB = {
  // Test Firebase connection per Firebase integration guidelines
  async testFirestoreConnection(): Promise<boolean> {
    if (!isFirebaseConfigured) return false;
    try {
      const dbRef = doc(db, 'system', 'connection');
      const snap = await getDoc(dbRef);
      return true;
    } catch (e) {
      console.warn("Firestore connection check failed: using sandbox mode or checking rules.");
      return false;
    }
  },

  // ---------------- USER OPERATIONS ----------------
  async getUser(telegramId: string): Promise<UserProfile | null> {
    if (isFirebaseConfigured) {
      try {
        const userDocRef = doc(db, 'users', telegramId);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          return userDoc.data() as UserProfile;
        }
        return null;
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `users/${telegramId}`);
      }
    } else {
      initLocalStorage();
      const users: UserProfile[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
      return users.find(u => u.telegramId === telegramId) || null;
    }
  },

  async createUser(profile: UserProfile): Promise<void> {
    if (isFirebaseConfigured) {
      try {
        const userDocRef = doc(db, 'users', profile.telegramId);
        await setDoc(userDocRef, profile);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `users/${profile.telegramId}`);
      }
    } else {
      initLocalStorage();
      const users: UserProfile[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
      const index = users.findIndex(u => u.telegramId === profile.telegramId);
      if (index > -1) {
        users[index] = profile;
      } else {
        users.push(profile);
      }
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    }
  },

  async updateUser(telegramId: string, updates: Partial<UserProfile>): Promise<void> {
    if (isFirebaseConfigured) {
      try {
        const userDocRef = doc(db, 'users', telegramId);
        await updateDoc(userDocRef, updates);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${telegramId}`);
      }
    } else {
      initLocalStorage();
      const users: UserProfile[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
      const index = users.findIndex(u => u.telegramId === telegramId);
      if (index > -1) {
        users[index] = { ...users[index], ...updates };
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      }
    }
  },

  async getAllUsers(): Promise<UserProfile[]> {
    if (isFirebaseConfigured) {
      try {
        const querySnapshot = await getDocs(collection(db, 'users'));
        const users: UserProfile[] = [];
        querySnapshot.forEach(docSnap => {
          users.push(docSnap.data() as UserProfile);
        });
        return users;
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, 'users');
      }
    } else {
      initLocalStorage();
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    }
  },

  // ---------------- TASK OPERATIONS ----------------
  async getTasks(): Promise<Task[]> {
    if (isFirebaseConfigured) {
      try {
        const querySnapshot = await getDocs(collection(db, 'tasks'));
        const tasks: Task[] = [];
        querySnapshot.forEach(docSnap => {
          tasks.push({ id: docSnap.id, ...docSnap.data() } as Task);
        });
        if (tasks.length === 0) {
          // Auto-seed in Firestore if empty
          const batch = writeBatch(db);
          DEFAULT_TASKS.forEach(t => {
            const ref = doc(collection(db, 'tasks'));
            batch.set(ref, {
              title: t.title,
              url: t.url,
              reward: t.reward,
              cooldown: t.cooldown,
              status: t.status
            });
          });
          await batch.commit();
          return this.getTasks();
        }
        return tasks;
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, 'tasks');
      }
    } else {
      initLocalStorage();
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.TASKS) || '[]');
    }
  },

  async createTask(task: Omit<Task, 'id'> & { id?: string }): Promise<string> {
    if (isFirebaseConfigured) {
      try {
        const res = await addDoc(collection(db, 'tasks'), task);
        return res.id;
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, 'tasks');
      }
    } else {
      initLocalStorage();
      const tasks: Task[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.TASKS) || '[]');
      const id = task.id || `task_${Date.now()}`;
      const newTask = { ...task, id } as Task;
      tasks.push(newTask);
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
      return id;
    }
  },

  async updateTask(taskId: string, updates: Partial<Task>): Promise<void> {
    if (isFirebaseConfigured) {
      try {
        const taskDocRef = doc(db, 'tasks', taskId);
        await updateDoc(taskDocRef, updates);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `tasks/${taskId}`);
      }
    } else {
      initLocalStorage();
      const tasks: Task[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.TASKS) || '[]');
      const index = tasks.findIndex(t => t.id === taskId);
      if (index > -1) {
        tasks[index] = { ...tasks[index], ...updates };
        localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
      }
    }
  },

  async deleteTask(taskId: string): Promise<void> {
    if (isFirebaseConfigured) {
      try {
        const taskDocRef = doc(db, 'tasks', taskId);
        await deleteDoc(taskDocRef);
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `tasks/${taskId}`);
      }
    } else {
      initLocalStorage();
      const tasks: Task[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.TASKS) || '[]');
      const filtered = tasks.filter(t => t.id !== taskId);
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(filtered));
    }
  },

  // ---------------- VISIT OPERATIONS ----------------
  async getVisitsByUser(telegramId: string): Promise<Visit[]> {
    if (isFirebaseConfigured) {
      try {
        const q = query(collection(db, 'visits'), where('userId', '==', telegramId));
        const querySnapshot = await getDocs(q);
        const visits: Visit[] = [];
        querySnapshot.forEach(docSnap => {
          visits.push({ id: docSnap.id, ...docSnap.data() } as Visit);
        });
        return visits;
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, 'visits');
      }
    } else {
      initLocalStorage();
      const visits: Visit[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.VISITS) || '[]');
      return visits.filter(v => v.userId === telegramId);
    }
  },

  async createVisit(visit: Omit<Visit, 'id'>): Promise<string> {
    if (isFirebaseConfigured) {
      try {
        const res = await addDoc(collection(db, 'visits'), visit);
        return res.id;
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, 'visits');
      }
    } else {
      initLocalStorage();
      const visits: Visit[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.VISITS) || '[]');
      const id = `visit_${Date.now()}`;
      const newVisit = { ...visit, id };
      visits.push(newVisit);
      localStorage.setItem(STORAGE_KEYS.VISITS, JSON.stringify(visits));
      return id;
    }
  },

  async getAllVisitsCount(): Promise<number> {
    if (isFirebaseConfigured) {
      try {
        const snap = await getDocs(collection(db, 'visits'));
        return snap.size;
      } catch (err) {
        return 0;
      }
    } else {
      initLocalStorage();
      const visits: Visit[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.VISITS) || '[]');
      return visits.length;
    }
  },

  // ---------------- WITHDRAW OPERATIONS ----------------
  async getWithdrawals(telegramId?: string): Promise<Withdrawal[]> {
    if (isFirebaseConfigured) {
      try {
        const colRef = collection(db, 'withdrawals');
        let snap;
        if (telegramId) {
          snap = await getDocs(query(colRef, where('userId', '==', telegramId)));
        } else {
          snap = await getDocs(colRef);
        }
        const list: Withdrawal[] = [];
        snap.forEach(docSnap => {
          list.push({ id: docSnap.id, ...docSnap.data() } as Withdrawal);
        });
        // Sort newest first
        return list.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, 'withdrawals');
      }
    } else {
      initLocalStorage();
      const list: Withdrawal[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.WITHDRAWALS) || '[]');
      const filtered = telegramId ? list.filter(w => w.userId === telegramId) : list;
      return filtered.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  },

  async createWithdrawal(withdrawal: Omit<Withdrawal, 'id'>): Promise<string> {
    if (isFirebaseConfigured) {
      try {
        const res = await addDoc(collection(db, 'withdrawals'), withdrawal);
        return res.id;
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, 'withdrawals');
      }
    } else {
      initLocalStorage();
      const list: Withdrawal[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.WITHDRAWALS) || '[]');
      const id = `withdraw_${Date.now()}`;
      const newWithdrawal = { ...withdrawal, id };
      list.push(newWithdrawal);
      localStorage.setItem(STORAGE_KEYS.WITHDRAWALS, JSON.stringify(list));
      return id;
    }
  },

  async updateWithdrawalStatus(id: string, status: Withdrawal['status']): Promise<void> {
    if (isFirebaseConfigured) {
      try {
        const docRef = doc(db, 'withdrawals', id);
        await updateDoc(docRef, { status });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `withdrawals/${id}`);
      }
    } else {
      initLocalStorage();
      const list: Withdrawal[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.WITHDRAWALS) || '[]');
      const index = list.findIndex(w => w.id === id);
      if (index > -1) {
        list[index].status = status;
        localStorage.setItem(STORAGE_KEYS.WITHDRAWALS, JSON.stringify(list));
      }
    }
  },

  async getSystemConfig(): Promise<SystemConfig> {
    if (isFirebaseConfigured) {
      try {
        const configDocRef = doc(db, 'system', 'config');
        const docSnap = await getDoc(configDocRef);
        if (docSnap.exists()) {
          return docSnap.data() as SystemConfig;
        }
        // Seed configuration if missing in Firestore
        const defaultConfig: SystemConfig = { dailyTaskLimit: 10 };
        await setDoc(configDocRef, defaultConfig);
        return defaultConfig;
      } catch (err) {
        return { dailyTaskLimit: 10 }; // Fallback
      }
    } else {
      const stored = localStorage.getItem('nexora_config');
      if (stored) {
        try {
          return JSON.parse(stored) as SystemConfig;
        } catch (e) {
          // ignore parsing error
        }
      }
      const defaultConfig = { dailyTaskLimit: 10 };
      localStorage.setItem('nexora_config', JSON.stringify(defaultConfig));
      return defaultConfig;
    }
  },

  async updateSystemConfig(updates: Partial<SystemConfig>): Promise<void> {
    if (isFirebaseConfigured) {
      try {
        const configDocRef = doc(db, 'system', 'config');
        await setDoc(configDocRef, updates, { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, 'system/config');
      }
    } else {
      const current = await this.getSystemConfig();
      const updated = { ...current, ...updates };
      localStorage.setItem('nexora_config', JSON.stringify(updated));
    }
  }
};
