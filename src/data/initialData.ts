import { SystemUser, ProductBatch, MovementLog, PresetProduct } from '../types';

export const INITIAL_USERS: SystemUser[] = [
  {
    id: 'usr-1',
    code: 'SUP-001',
    name: 'Supervisor',
    role: 'SUPERVISOR',
    pin: '1234',
    active: true,
    avatarColor: 'bg-emerald-700',
  },
];

export const PRESET_CATALOG: PresetProduct[] = [];

export const CATEGORIES = [
  'Laticínios',
  'Frios & Embutidos',
  'Padaria & Confeitaria',
  'Açougue & Aves',
  'Hortifruti',
  'Bebidas & Sucos',
  'Mercearia Seca',
  'Congelados',
  'Higiene & Limpeza',
];

// Helper to construct ISO dates offset from today
function getDateOffset(daysOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function getInitialBatches(): ProductBatch[] {
  return [];
}

export function getInitialLogs(): MovementLog[] {
  return [];
}
