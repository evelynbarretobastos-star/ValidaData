export type UserRole = 'SUPERVISOR' | 'OPERATOR';

export interface SystemUser {
  id: string;
  code: string; // e.g. 'SUP-001', 'OP-002'
  name: string;
  role: UserRole;
  pin: string;
  active: boolean;
  avatarColor?: string;
}

export type ProductStatusState = 'CRITICAL' | 'STABLE' | 'NORMAL' | 'EXPIRED';

export type MovementType = 'RETIRADO' | 'VENDIDO' | 'PROMOCAO' | 'DESCARTADO';

export interface SupervisorDecision {
  type: 'DISCOUNT_PERCENT' | 'BUY_1_GET_1' | 'CLEARANCE_FIXED' | 'DISCARD_AUTHORIZED';
  discountPercent?: number; // e.g. 30 for 30%
  fixedPrice?: number; // e.g. R$ 3.99
  description: string;
  decidedByUserId: string;
  decidedByUserName: string;
  decidedAt: string;
}

export interface ProductBatch {
  id: string;
  barcode: string;
  name: string;
  category: string;
  batchNumber: string; // Lote
  manufacturingDate: string; // YYYY-MM-DD
  expiryDate: string; // YYYY-MM-DD
  quantity: number; // Current stock
  initialQuantity: number;
  unit: 'un' | 'kg' | 'cx' | 'pct';
  originalPrice: number; // R$
  location: string; // e.g. Corredor 3 - Prateleira B
  createdUserId: string;
  createdUserName: string;
  createdAt: string;
  supervisorDecision?: SupervisorDecision;
  notes?: string;
}

export interface MovementLog {
  id: string;
  batchId: string;
  barcode: string;
  productName: string;
  batchNumber: string;
  movementType: MovementType;
  quantity: number;
  unit: string;
  reason: string;
  unitPriceAtTime: number;
  totalValueAffected: number;
  performedByUserId: string;
  performedByUserName: string;
  performedByUserRole: UserRole;
  timestamp: string;
  notes?: string;
}

export interface PresetProduct {
  barcode: string;
  name: string;
  category: string;
  unit: 'un' | 'kg' | 'cx' | 'pct';
  originalPrice: number;
}
