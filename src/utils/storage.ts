import { ProductBatch, MovementLog, SystemUser } from '../types';
import { INITIAL_USERS, getInitialBatches, getInitialLogs } from '../data/initialData';

const STORAGE_KEYS = {
  USERS: 'validadata_users_v1',
  BATCHES: 'validadata_batches_v1',
  LOGS: 'validadata_logs_v1',
  CURRENT_USER_ID: 'validadata_current_user_id_v1',
};

export function loadUsers(): SystemUser[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    if (!raw) {
      saveUsers(INITIAL_USERS);
      return INITIAL_USERS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading users:', e);
    return INITIAL_USERS;
  }
}

export function saveUsers(users: SystemUser[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  } catch (e) {
    console.error('Error saving users:', e);
  }
}

export function loadBatches(): ProductBatch[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BATCHES);
    if (!raw) {
      const initial = getInitialBatches();
      saveBatches(initial);
      return initial;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading batches:', e);
    return getInitialBatches();
  }
}

export function saveBatches(batches: ProductBatch[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.BATCHES, JSON.stringify(batches));
  } catch (e) {
    console.error('Error saving batches:', e);
  }
}

export function loadLogs(): MovementLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LOGS);
    if (!raw) {
      const initial = getInitialLogs();
      saveLogs(initial);
      return initial;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading logs:', e);
    return getInitialLogs();
  }
}

export function saveLogs(logs: MovementLog[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
  } catch (e) {
    console.error('Error saving logs:', e);
  }
}

export function loadCurrentUserId(): string {
  try {
    const id = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
    if (id) return id;
    // Default to supervisor or operator
    return INITIAL_USERS[0].id;
  } catch (e) {
    return INITIAL_USERS[0].id;
  }
}

export function saveCurrentUserId(id: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, id);
  } catch (e) {
    console.error('Error saving current user ID:', e);
  }
}

export function clearAllProductsData(): void {
  saveBatches([]);
  saveLogs([]);
}

export function resetToDefaults(): { users: SystemUser[]; batches: ProductBatch[]; logs: MovementLog[] } {
  const users = INITIAL_USERS;
  const batches = getInitialBatches();
  const logs = getInitialLogs();
  saveUsers(users);
  saveBatches(batches);
  saveLogs(logs);
  saveCurrentUserId(users[0].id);
  return { users, batches, logs };
}
