import { ProductStatusState, ProductBatch } from '../types';

export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatDateBR(dateString: string): string {
  if (!dateString) return '-';
  const [year, month, day] = dateString.split('-');
  if (!year || !month || !day) return dateString;
  return `${day}/${month}/${year}`;
}

export function calculateDaysToExpiry(expiryDateStr: string): number {
  if (!expiryDateStr) return 999;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [year, month, day] = expiryDateStr.split('-').map(Number);
  const expiry = new Date(year, month - 1, day);
  expiry.setHours(0, 0, 0, 0);

  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

export function getBatchStatusState(expiryDateStr: string): ProductStatusState {
  const days = calculateDaysToExpiry(expiryDateStr);
  if (days < 0) return 'EXPIRED';
  if (days <= 7) return 'CRITICAL';
  if (days <= 15) return 'STABLE';
  return 'NORMAL';
}

export function getStatusBadgeConfig(status: ProductStatusState) {
  switch (status) {
    case 'EXPIRED':
      return {
        label: 'VENCIDO',
        bg: 'bg-red-900/90 text-white border-red-950',
        badgeClass: 'bg-red-700 text-white font-bold',
        rowClass: 'bg-red-50/70 dark:bg-red-950/20 border-l-4 border-l-red-700',
        icon: '🚨',
      };
    case 'CRITICAL':
      return {
        label: 'CRÍTICO (≤ 7 dias)',
        bg: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/40 dark:text-red-200',
        badgeClass: 'bg-red-600 text-white font-semibold',
        rowClass: 'bg-red-50/50 dark:bg-red-950/10 border-l-4 border-l-red-500',
        icon: '⚡',
      };
    case 'STABLE':
      return {
        label: 'ESTÁVEL (8 a 15 dias)',
        bg: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/40 dark:text-amber-200',
        badgeClass: 'bg-amber-500 text-white font-semibold',
        rowClass: 'bg-amber-50/40 dark:bg-amber-950/10 border-l-4 border-l-amber-500',
        icon: '⚠️',
      };
    case 'NORMAL':
      return {
        label: 'NORMAL (> 15 dias)',
        bg: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-200',
        badgeClass: 'bg-emerald-600 text-white font-medium',
        rowClass: 'border-l-4 border-l-emerald-500',
        icon: '✅',
      };
  }
}

export function calculateEffectivePrice(batch: ProductBatch): number {
  if (!batch.supervisorDecision) return batch.originalPrice;

  const { type, discountPercent, fixedPrice } = batch.supervisorDecision;
  if (type === 'DISCOUNT_PERCENT' && discountPercent) {
    return Math.max(0, batch.originalPrice * (1 - discountPercent / 100));
  }
  if (type === 'CLEARANCE_FIXED' && fixedPrice !== undefined) {
    return fixedPrice;
  }
  if (type === 'BUY_1_GET_1') {
    // 50% effective discount
    return batch.originalPrice * 0.5;
  }
  return batch.originalPrice;
}

export function generateRandomBarcode(): string {
  // Brazilian EAN-13 prefix 789
  let result = '789';
  for (let i = 0; i < 9; i++) {
    result += Math.floor(Math.random() * 10).toString();
  }
  // checksum
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const num = parseInt(result[i], 10);
    sum += i % 2 === 0 ? num : num * 3;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return result + checkDigit.toString();
}

export function generateRandomBatch(): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const l1 = letters[Math.floor(Math.random() * letters.length)];
  const l2 = letters[Math.floor(Math.random() * letters.length)];
  const num = Math.floor(1000 + Math.random() * 9000);
  return `LOT-${l1}${l2}-${num}`;
}
