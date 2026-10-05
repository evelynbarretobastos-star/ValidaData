import React, { useState } from 'react';
import { ProductBatch, ProductStatusState, SystemUser } from '../types';
import { 
  formatBRL, 
  formatDateBR, 
  calculateDaysToExpiry, 
  getBatchStatusState, 
  getStatusBadgeConfig,
  calculateEffectivePrice
} from '../utils/formatters';
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Filter, 
  Tag, 
  ArrowLeftRight, 
  ShieldAlert, 
  ShieldCheck,
  Printer, 
  Package, 
  Calendar, 
  Barcode, 
  MapPin, 
  TrendingDown, 
  Plus,
  Scan,
  Trash2,
  Archive,
  RotateCcw
} from 'lucide-react';

interface DashboardTabProps {
  batches: ProductBatch[];
  currentUser: SystemUser;
  onOpenMovementModal: (batch: ProductBatch) => void;
  onOpenSupervisorModal: (batch: ProductBatch) => void;
  onOpenPrintLabelModal: (batch: ProductBatch) => void;
  onNavigateToRegister: () => void;
  onOpenScannerModal?: () => void;
  onDeleteBatch?: (batchId: string) => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  batches,
  currentUser,
  onOpenMovementModal,
  onOpenSupervisorModal,
  onOpenPrintLabelModal,
  onNavigateToRegister,
  onOpenScannerModal,
  onDeleteBatch,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL'); // ALL, CRITICAL, STABLE, NORMAL, EXPIRED, PROMOTION
  const [batchToDelete, setBatchToDelete] = useState<ProductBatch | null>(null);

  // Active batches (with stock > 0)
  const activeBatches = batches.filter(b => b.quantity > 0);

  // Discharged / zero-quantity batches (moved to the bottom!)
  const dischargedBatches = batches.filter(b => b.quantity === 0);

  // Compute metrics for active stock only
  const criticalItems = activeBatches.filter(b => getBatchStatusState(b.expiryDate) === 'CRITICAL');
  const expiredItems = activeBatches.filter(b => getBatchStatusState(b.expiryDate) === 'EXPIRED');
  const stableItems = activeBatches.filter(b => getBatchStatusState(b.expiryDate) === 'STABLE');
  const normalItems = activeBatches.filter(b => getBatchStatusState(b.expiryDate) === 'NORMAL');

  // Sum of active items expiring in 1 week (<= 7 days) + expired
  const totalOneWeekExpiryCount = criticalItems.length + expiredItems.length;

  // Calculate financial value at risk (for items expiring in <= 15 days)
  const totalRiskValue = [...criticalItems, ...expiredItems, ...stableItems].reduce(
    (sum, item) => sum + (item.quantity * item.originalPrice),
    0
  );

  // Filtered active batch list
  const filteredActiveBatches = activeBatches.filter(batch => {
    const status = getBatchStatusState(batch.expiryDate);

    // Status filter
    if (statusFilter === 'CRITICAL' && status !== 'CRITICAL') return false;
    if (statusFilter === 'STABLE' && status !== 'STABLE') return false;
    if (statusFilter === 'NORMAL' && status !== 'NORMAL') return false;
    if (statusFilter === 'EXPIRED' && status !== 'EXPIRED') return false;
    if (statusFilter === 'ONE_WEEK' && status !== 'CRITICAL' && status !== 'EXPIRED') return false;
    if (statusFilter === 'PROMOTION' && !batch.supervisorDecision) return false;

    // Search term
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      const matchName = batch.name.toLowerCase().includes(term);
      const matchBarcode = (batch.barcode || '').toLowerCase().includes(term);
      const matchBatch = batch.batchNumber.toLowerCase().includes(term);
      const matchLoc = (batch.location || '').toLowerCase().includes(term);
      return matchName || matchBarcode || matchBatch || matchLoc;
    }

    return true;
  });

  // Filtered discharged batches
  const filteredDischargedBatches = dischargedBatches.filter(batch => {
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      const matchName = batch.name.toLowerCase().includes(term);
      const matchBarcode = (batch.barcode || '').toLowerCase().includes(term);
      const matchBatch = batch.batchNumber.toLowerCase().includes(term);
      return matchName || matchBarcode || matchBatch;
    }
    return true;
  });

  const handleConfirmDelete = () => {
    if (batchToDelete && onDeleteBatch) {
      onDeleteBatch(batchToDelete.id);
      setBatchToDelete(null);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto font-sans">
      
      {/* Bento Grid Top Section */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        
        {/* Bento Box 1: Alert Table (Critical Expiries in Active Stock - 8 Cols) */}
        <div className="md:col-span-8 bg-white dark:bg-slate-900 rounded-xl border-2 border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 rounded-t-xl">
            <h2 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 text-sm">
              <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
              Alertas de Vencimento Crítico no Balcão (Próximos 7 dias)
            </h2>
            <span className="text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 px-2 py-1 rounded-md font-mono">
              {totalOneWeekExpiryCount} Lote(s) Crítico(s)
            </span>
          </div>

          <div className="flex-1 overflow-x-auto">
            {criticalItems.length === 0 && expiredItems.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                ✅ Nenhum produto ativo vencendo nos próximos 7 dias. Estoque saudável!
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="px-4 py-3">Produto</th>
                    <th className="px-4 py-3 text-center">Lote</th>
                    <th className="px-4 py-3 text-center">Validade</th>
                    <th className="px-4 py-3 text-center">Qtd</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3 text-center">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                  {[...expiredItems, ...criticalItems].slice(0, 5).map((item) => {
                    const days = calculateDaysToExpiry(item.expiryDate);
                    return (
                      <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                          {item.name}
                        </td>
                        <td className="px-4 py-3 text-center font-mono text-xs text-slate-500">
                          #{item.batchNumber}
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-red-600 font-mono">
                          {formatDateBR(item.expiryDate)} ({days < 0 ? 'Vencido' : `${days}d`})
                        </td>
                        <td className="px-4 py-3 text-center font-mono font-bold">
                          {item.quantity} {item.unit}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200 rounded-full text-[10px] font-bold">
                            {days < 0 ? 'VENCIDO' : 'CRÍTICO'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => onOpenMovementModal(item)}
                            className="text-green-700 dark:text-green-400 font-bold hover:underline cursor-pointer"
                          >
                            Dar Baixa
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Bento Box 2: Supervisor Control Card */}
        <div className="md:col-span-4 bg-green-800 text-white rounded-xl p-5 flex flex-col justify-between shadow-sm border border-green-700">
          <div>
            <div className="flex justify-between items-center mb-3 pb-3 border-b border-green-700">
              <h2 className="font-bold flex items-center gap-2 text-sm text-white">
                <ShieldCheck className="w-5 h-5 text-emerald-300" />
                <span>Painel de Controle</span>
              </h2>
              <span className="text-[10px] bg-green-900/90 text-green-200 border border-green-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                {currentUser.role}
              </span>
            </div>

            <p className="text-xs text-green-100 mb-4">
              Gerenciamento dinâmico de produtos com risco de vencimento. Crie promoções, descontos ou baixe itens.
            </p>

            <div className="space-y-2 bg-green-900/60 p-3 rounded-lg border border-green-700/60 mb-4">
              <div className="flex justify-between text-xs">
                <span className="text-green-200">Lotes Ativos em Loja:</span>
                <span className="font-mono font-bold text-white">{activeBatches.length}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-green-200">Lotes Baixados/Retirados:</span>
                <span className="font-mono font-bold text-amber-200">{dischargedBatches.length}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-green-200">Valor em Risco (&le;15d):</span>
                <span className="font-mono font-bold text-emerald-200">{formatBRL(totalRiskValue)}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <button
              onClick={onNavigateToRegister}
              className="w-full bg-white text-green-900 hover:bg-green-50 font-bold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar Novo Lote</span>
            </button>
          </div>
        </div>

      </div>

      {/* Metric Bento Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        
        {/* Metric 1: Expired Items */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border-2 border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase">Vencidos Ativos</span>
            <div className="text-2xl font-black text-red-600 mt-1 font-mono">
              {expiredItems.length}
            </div>
            <span className="text-[10px] text-slate-400">Exigem retirada imediata</span>
          </div>
          <div className="p-3 bg-red-100 dark:bg-red-950/60 text-red-700 rounded-xl">
            <XCircle className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 2: Critical (1-7 Days) */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border-2 border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase">Críticos (1 a 7d)</span>
            <div className="text-2xl font-black text-orange-600 mt-1 font-mono">
              {criticalItems.length}
            </div>
            <span className="text-[10px] text-slate-400">Liquidação recomendada</span>
          </div>
          <div className="p-3 bg-orange-100 dark:bg-orange-950/60 text-orange-700 rounded-xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 3: Stable (8-15 Days) */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border-2 border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase">Atenção (8 a 15d)</span>
            <div className="text-2xl font-black text-amber-600 mt-1 font-mono">
              {stableItems.length}
            </div>
            <span className="text-[10px] text-slate-400">Monitorar giro no PDV</span>
          </div>
          <div className="p-3 bg-amber-100 dark:bg-amber-950/60 text-amber-700 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 4: Normal (> 15 Days) */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border-2 border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase">Validade Normal</span>
            <div className="text-2xl font-black text-emerald-600 mt-1 font-mono">
              {normalItems.length}
            </div>
            <span className="text-[10px] text-slate-400">Estoque regular</span>
          </div>
          <div className="p-3 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border-2 border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por produto, lote, EAN..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:ring-2 ring-green-500 outline-none"
          />
        </div>

        {/* Status Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap w-full md:w-auto">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
              statusFilter === 'ALL'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            Todos Ativos ({activeBatches.length})
          </button>

          <button
            onClick={() => setStatusFilter('ONE_WEEK')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
              statusFilter === 'ONE_WEEK'
                ? 'bg-red-600 text-white ring-2 ring-red-300'
                : 'bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-950/60 dark:text-red-300'
            }`}
          >
            <span>🚨 7 Dias ({totalOneWeekExpiryCount})</span>
          </button>

          <button
            onClick={() => setStatusFilter('STABLE')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
              statusFilter === 'STABLE'
                ? 'bg-amber-500 text-white ring-2 ring-amber-300'
                : 'bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-950/60 dark:text-amber-300'
            }`}
          >
            <span>⚠️ Estáveis ({stableItems.length})</span>
          </button>

          <button
            onClick={() => setStatusFilter('NORMAL')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
              statusFilter === 'NORMAL'
                ? 'bg-green-700 text-white ring-2 ring-green-300'
                : 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-950/60 dark:text-green-300'
            }`}
          >
            ✅ Normais ({normalItems.length})
          </button>
        </div>
      </div>

      {/* SECTION 1: MAIN ACTIVE BATCH INVENTORY TABLE */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border-2 border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-green-700" />
            <h2 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
              Listagem Completa de Lotes no Estoque (Ativos em Loja)
            </h2>
            <span className="bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-300 text-xs px-2 py-0.5 rounded-full font-mono font-bold">
              {filteredActiveBatches.length} ativos
            </span>
          </div>

          <div className="text-xs text-slate-500 font-mono">
            Ordenado por prazo de validade
          </div>
        </div>

        {filteredActiveBatches.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <AlertTriangle className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
              Nenhum produto ativo encontrado com os filtros selecionados
            </h3>
            <button
              onClick={() => { setSearchTerm(''); setStatusFilter('ALL'); }}
              className="text-xs text-green-700 font-bold hover:underline cursor-pointer"
            >
              Limpar Filtros
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider border-b border-slate-200 text-[10px]">
                  <th className="p-3">Estado / Alerta</th>
                  <th className="p-3">Produto &amp; Código EAN</th>
                  <th className="p-3">Lote &amp; Local</th>
                  <th className="p-3">Validade</th>
                  <th className="p-3 text-center">Qtd Atual</th>
                  <th className="p-3 text-right">Preço Un.</th>
                  <th className="p-3 text-right">Decisão Supervisor</th>
                  <th className="p-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredActiveBatches
                  .sort((a, b) => calculateDaysToExpiry(a.expiryDate) - calculateDaysToExpiry(b.expiryDate))
                  .map((batch) => {
                    const days = calculateDaysToExpiry(batch.expiryDate);
                    const statusState = getBatchStatusState(batch.expiryDate);
                    const config = getStatusBadgeConfig(statusState);
                    const effectivePrice = calculateEffectivePrice(batch);
                    const isDiscounted = effectivePrice < batch.originalPrice;

                    return (
                      <tr 
                        key={batch.id} 
                        className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition ${config.rowClass}`}
                      >
                        <td className="p-3 whitespace-nowrap">
                          <div className="flex flex-col gap-1 items-start">
                            <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${config.badgeClass}`}>
                              <span>{config.icon}</span>
                              <span>{config.label}</span>
                            </span>
                            
                            <span className={`text-[11px] font-bold ${
                              days < 0 
                                ? 'text-red-700 underline font-mono' 
                                : days <= 7 
                                ? 'text-red-600 font-bold' 
                                : days <= 15 
                                ? 'text-amber-700' 
                                : 'text-slate-600'
                            }`}>
                              {days < 0 
                                ? `VENCIDO HÁ ${Math.abs(days)}d` 
                                : days === 0 
                                ? '⚡ VENCE HOJE!' 
                                : `Faltam ${days} dias`}
                            </span>
                          </div>
                        </td>

                        <td className="p-3">
                          <div className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                            {batch.name}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5 font-mono">
                            <span>EAN: {batch.barcode}</span>
                          </div>
                        </td>

                        <td className="p-3 whitespace-nowrap">
                          <div className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                            #{batch.batchNumber}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {batch.location || 'Não informada'}
                          </div>
                        </td>

                        <td className="p-3 whitespace-nowrap font-mono text-xs">
                          <div className="font-bold text-slate-900 dark:text-slate-100">
                            {formatDateBR(batch.expiryDate)}
                          </div>
                        </td>

                        <td className="p-3 text-center whitespace-nowrap">
                          <span className="inline-block px-2 py-0.5 rounded font-bold font-mono text-xs bg-slate-100 dark:bg-slate-800">
                            {batch.quantity} {batch.unit}
                          </span>
                        </td>

                        <td className="p-3 text-right whitespace-nowrap font-mono text-xs font-bold">
                          {isDiscounted ? (
                            <div>
                              <span className="text-[10px] text-slate-400 line-through block">
                                {formatBRL(batch.originalPrice)}
                              </span>
                              <span className="font-bold text-purple-700 dark:text-purple-300">
                                {formatBRL(effectivePrice)}
                              </span>
                            </div>
                          ) : (
                            <span>{formatBRL(batch.originalPrice)}</span>
                          )}
                        </td>

                        <td className="p-3 text-right whitespace-nowrap">
                          {batch.supervisorDecision ? (
                            <span className="bg-purple-100 text-purple-900 border border-purple-300 text-[10px] px-2 py-0.5 rounded font-bold uppercase">
                              {batch.supervisorDecision.type === 'DISCOUNT_PERCENT' && `${batch.supervisorDecision.discountPercent}% OFF`}
                              {batch.supervisorDecision.type === 'BUY_1_GET_1' && 'Leve 2 Pague 1'}
                              {batch.supervisorDecision.type === 'CLEARANCE_FIXED' && 'Liquidação'}
                              {batch.supervisorDecision.type === 'DISCARD_AUTHORIZED' && 'Retirada'}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[10px] italic">Sem ação</span>
                          )}
                        </td>

                        <td className="p-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => onOpenMovementModal(batch)}
                              className="bg-green-700 hover:bg-green-800 text-white px-2 py-1 rounded text-[11px] font-bold transition cursor-pointer"
                              title="Dar baixa / Registrar saída"
                            >
                              Baixa
                            </button>

                            <button
                              onClick={() => onOpenSupervisorModal(batch)}
                              className="bg-amber-600 hover:bg-amber-700 text-white px-2 py-1 rounded text-[11px] font-bold transition cursor-pointer"
                              title="Configurar promoção do supervisor"
                            >
                              Decisão
                            </button>

                            <button
                              onClick={() => onOpenPrintLabelModal(batch)}
                              className="bg-slate-700 hover:bg-slate-800 text-white p-1 rounded text-[11px] transition cursor-pointer"
                              title="Imprimir Etiqueta Térmica Amarela"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>

                            {onDeleteBatch && (
                              <button
                                onClick={() => setBatchToDelete(batch)}
                                className="bg-red-50 hover:bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300 p-1 rounded text-[11px] border border-red-200 dark:border-red-800 transition cursor-pointer"
                                title="Remover lote do sistema"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SECTION 2: DISCHARGED / WITHDRAWN BATCHES (SALDO ZERO - MOVED TO THE BOTTOM) */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border-2 border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-100 dark:bg-slate-800/70">
          <div className="flex items-center gap-2">
            <Archive className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            <div>
              <h2 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                Lotes Baixados / Retirados do Estoque (Saldo Zero)
              </h2>
              <p className="text-[11px] text-slate-500">
                Produtos que tiveram baixa total por retirada de vencimento ou venda (desceram do painel principal)
              </p>
            </div>
          </div>

          <span className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs px-2.5 py-0.5 rounded-full font-mono font-bold">
            {filteredDischargedBatches.length} baixado(s)
          </span>
        </div>

        {filteredDischargedBatches.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400 italic">
            Nenhum lote com saldo zerado ou retirado no momento.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/40 text-slate-500 uppercase tracking-wider border-b border-slate-200 text-[10px] font-bold">
                  <th className="p-3">Status</th>
                  <th className="p-3">Produto &amp; Código EAN</th>
                  <th className="p-3">Lote</th>
                  <th className="p-3">Data de Validade</th>
                  <th className="p-3 text-center">Qtd Atual</th>
                  <th className="p-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredDischargedBatches.map((batch) => (
                  <tr key={batch.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 opacity-75 transition">
                    <td className="p-3 whitespace-nowrap">
                      <span className="bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300 font-bold text-[10px] px-2 py-0.5 rounded-full uppercase">
                        ✓ BAIXA TOTAL REALIZADA
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-slate-800 dark:text-slate-200">
                        {batch.name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        EAN: {batch.barcode}
                      </div>
                    </td>
                    <td className="p-3 font-mono text-slate-600 dark:text-slate-400">
                      #{batch.batchNumber}
                    </td>
                    <td className="p-3 font-mono text-slate-600 dark:text-slate-400">
                      {formatDateBR(batch.expiryDate)}
                    </td>
                    <td className="p-3 text-center font-bold font-mono text-slate-400">
                      0 {batch.unit}
                    </td>
                    <td className="p-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        {onDeleteBatch && (
                          <button
                            onClick={() => setBatchToDelete(batch)}
                            className="text-red-600 hover:text-red-800 dark:hover:text-red-400 px-2 py-1 rounded text-[11px] font-bold flex items-center gap-1 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
                            title="Remover definitivamente"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remover</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Modal for Deleting Batch */}
      {batchToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Confirmar Exclusão do Lote?
              </h3>
              <p className="text-xs text-slate-500">
                Deseja realmente remover o lote <strong className="text-slate-800 dark:text-slate-200">#{batchToDelete.batchNumber}</strong> do produto <strong className="text-slate-800 dark:text-slate-200">"{batchToDelete.name}"</strong>?
              </p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs space-y-1 font-mono text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              <div>EAN: {batchToDelete.barcode}</div>
              <div>Validade: {formatDateBR(batchToDelete.expiryDate)}</div>
              <div>Saldo Atual: {batchToDelete.quantity} {batchToDelete.unit}</div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setBatchToDelete(null)}
                className="w-1/2 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-lg transition text-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="w-1/2 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-sm transition text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Sim, Remover</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
