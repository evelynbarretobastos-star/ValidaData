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
  Usb,
  Bluetooth
} from 'lucide-react';

interface DashboardTabProps {
  batches: ProductBatch[];
  currentUser: SystemUser;
  onOpenMovementModal: (batch: ProductBatch) => void;
  onOpenSupervisorModal: (batch: ProductBatch) => void;
  onOpenPrintLabelModal: (batch: ProductBatch) => void;
  onNavigateToRegister: () => void;
  onOpenScannerModal?: () => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  batches,
  currentUser,
  onOpenMovementModal,
  onOpenSupervisorModal,
  onOpenPrintLabelModal,
  onNavigateToRegister,
  onOpenScannerModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL'); // ALL, CRITICAL, STABLE, NORMAL, EXPIRED, PROMOTION

  // Compute metrics
  const criticalItems = batches.filter(b => getBatchStatusState(b.expiryDate) === 'CRITICAL');
  const expiredItems = batches.filter(b => getBatchStatusState(b.expiryDate) === 'EXPIRED');
  const stableItems = batches.filter(b => getBatchStatusState(b.expiryDate) === 'STABLE');
  const normalItems = batches.filter(b => getBatchStatusState(b.expiryDate) === 'NORMAL');

  // Sum of items expiring in 1 week (<= 7 days) + expired
  const totalOneWeekExpiryCount = criticalItems.length + expiredItems.length;

  // Calculate financial value at risk (for items expiring in <= 15 days)
  const totalRiskValue = [...criticalItems, ...expiredItems, ...stableItems].reduce(
    (sum, item) => sum + (item.quantity * item.originalPrice),
    0
  );

  // Filtered batch list
  const filteredBatches = batches.filter(batch => {
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
      const matchBarcode = batch.barcode.includes(term);
      const matchBatch = batch.batchNumber.toLowerCase().includes(term);
      const matchLoc = (batch.location || '').toLowerCase().includes(term);
      return matchName || matchBarcode || matchBatch || matchLoc;
    }

    return true;
  });

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto font-sans">
      
      {/* Bento Grid Top Section */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        
        {/* Bento Box 1: Alert Table (Critical Expiries - 8 Cols) */}
        <div className="md:col-span-8 bg-white dark:bg-slate-900 rounded-xl border-2 border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 rounded-t-xl">
            <h2 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 text-sm">
              <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
              Alertas de Vencimento Crítico (Próximos 7 dias)
            </h2>
            <span className="text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 px-2 py-1 rounded-md font-mono">
              {totalOneWeekExpiryCount} Lote(s) Crítico(s)
            </span>
          </div>

          <div className="flex-1 overflow-x-auto">
            {criticalItems.length === 0 && expiredItems.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                ✅ Nenhum produto vencendo nos próximos 7 dias. Estoque saudável!
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
                            Tratar
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

        {/* Bento Box 2: Supervisor Control Card (Cohesive Green Theme) */}
        <div className="md:col-span-4 bg-green-800 text-white rounded-xl p-5 flex flex-col justify-between shadow-sm border border-green-700">
          <div>
            <div className="flex justify-between items-center mb-3 pb-3 border-b border-green-700">
              <h2 className="font-bold flex items-center gap-2 text-sm text-white">
                <ShieldCheck className="w-5 h-5 text-emerald-300" />
                <span>Painel do Supervisor</span>
              </h2>
              <span className="text-[10px] bg-green-900/90 text-green-200 border border-green-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                Supervisor
              </span>
            </div>

            <div className="bg-green-900/70 p-3.5 rounded-lg mb-4 space-y-2 border border-green-700/60">
              <p className="text-[11px] text-green-200 font-bold uppercase tracking-wider">
                Ações e Descontos Rápidos
              </p>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between items-center text-green-100">
                  <span className="text-green-200">Vencendo em 3 dias:</span>
                  <span className="font-mono text-emerald-300 font-bold bg-green-950/60 px-1.5 py-0.5 rounded border border-green-800">-50% OFF</span>
                </div>
                <div className="flex justify-between items-center text-green-100">
                  <span className="text-green-200">Vencendo em 7 dias:</span>
                  <span className="font-mono text-emerald-300 font-bold bg-green-950/60 px-1.5 py-0.5 rounded border border-green-800">Leve 2 Pague 1</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => onNavigateToRegister()}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2.5 rounded-lg transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 shadow-xs border border-emerald-500"
            >
              <Plus className="w-4 h-4" />
              <span>CADASTRAR ENTRADA</span>
            </button>
            <button
              onClick={() => onOpenSupervisorModal(batches[0] || {} as any)}
              className="w-full bg-green-700/70 hover:bg-green-700 text-green-100 hover:text-white border border-green-600 text-xs font-bold py-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
              <span>CONFIGURAR DESCONTOS</span>
            </button>
            {onOpenScannerModal && (
              <button
                onClick={onOpenScannerModal}
                className="w-full bg-green-950/60 hover:bg-green-950 text-emerald-300 hover:text-emerald-200 border border-green-700/80 text-xs font-bold py-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-2"
                title="Central de Conexão do Leitor (Cabo USB & Bluetooth)"
              >
                <Scan className="w-3.5 h-3.5 text-emerald-400" />
                <span>LEITOR CABO / BLUETOOTH</span>
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Stat Highlight Metrics Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1 */}
        <div 
          onClick={() => setStatusFilter('ONE_WEEK')}
          className={`p-4 rounded-xl border-2 transition shadow-sm cursor-pointer ${
            statusFilter === 'ONE_WEEK' || statusFilter === 'CRITICAL'
              ? 'bg-red-600 text-white border-red-700 ring-2 ring-red-400'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-red-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider ${
              statusFilter === 'ONE_WEEK' || statusFilter === 'CRITICAL' ? 'text-red-100' : 'text-slate-500 dark:text-slate-400'
            }`}>
              🚨 Vencendo em 1 Semana
            </span>
            <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-[10px] font-bold">
              CRÍTICO
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className={`text-2xl font-black ${
              statusFilter === 'ONE_WEEK' || statusFilter === 'CRITICAL' ? 'text-white' : 'text-red-600 dark:text-red-400'
            }`}>
              {totalOneWeekExpiryCount} <span className="text-xs font-normal text-slate-500">lotes</span>
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Requer ação imediata de reposição.
          </p>
        </div>

        {/* Metric 2 */}
        <div 
          onClick={() => setStatusFilter('STABLE')}
          className={`p-4 rounded-xl border-2 transition shadow-sm cursor-pointer ${
            statusFilter === 'STABLE'
              ? 'bg-amber-500 text-white border-amber-600 ring-2 ring-amber-300'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider ${
              statusFilter === 'STABLE' ? 'text-amber-100' : 'text-slate-500 dark:text-slate-400'
            }`}>
              ⚠️ Atenção (8 a 15 dias)
            </span>
            <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-[10px] font-bold">
              ATENÇÃO
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className={`text-2xl font-black ${
              statusFilter === 'STABLE' ? 'text-white' : 'text-amber-600 dark:text-amber-400'
            }`}>
              {stableItems.length} <span className="text-xs font-normal text-slate-500">lotes</span>
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Monitorar giro no estoque.
          </p>
        </div>

        {/* Metric 3 */}
        <div 
          onClick={() => setStatusFilter('NORMAL')}
          className={`p-4 rounded-xl border-2 transition shadow-sm cursor-pointer ${
            statusFilter === 'NORMAL'
              ? 'bg-emerald-700 text-white border-emerald-800 ring-2 ring-emerald-400'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-green-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider ${
              statusFilter === 'NORMAL' ? 'text-emerald-100' : 'text-slate-500 dark:text-slate-400'
            }`}>
              ✅ Validade Regular (&gt; 15d)
            </span>
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-[10px] font-bold">
              ESTÁVEL
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className={`text-2xl font-black ${
              statusFilter === 'NORMAL' ? 'text-white' : 'text-green-700 dark:text-green-400'
            }`}>
              {normalItems.length} <span className="text-xs font-normal text-slate-500">lotes</span>
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Validade dentro do prazo normal.
          </p>
        </div>

        {/* Metric 4 */}
        <div className="p-4 rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              💰 Valor Financeiro em Risco
            </span>
            <TrendingDown className="w-4 h-4 text-red-500" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {formatBRL(totalRiskValue)}
            </span>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Total em estoque com vencimento próximo.
            </p>
          </div>
        </div>

      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border-2 border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por Nome do Produto, Código de Barras (EAN), Lote ou Localização..."
              className="w-full pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:ring-2 ring-green-500 outline-none"
            />
          </div>

          <button
            onClick={onNavigateToRegister}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition cursor-pointer shrink-0 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Novo Lote</span>
          </button>
        </div>

        {/* Filter Badges Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800 pt-3 text-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <span className="font-bold text-slate-500 dark:text-slate-400 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Estado:
            </span>
            
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              Todos ({batches.length})
            </button>

            <button
              onClick={() => setStatusFilter('ONE_WEEK')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                statusFilter === 'ONE_WEEK'
                  ? 'bg-red-600 text-white ring-2 ring-red-300'
                  : 'bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-950/60 dark:text-red-300'
              }`}
            >
              <span>🚨 Críticos (≤ 7d)</span>
              <span className="bg-red-700 text-white px-1.5 py-0.2 rounded-full text-[10px]">
                {totalOneWeekExpiryCount}
              </span>
            </button>

            <button
              onClick={() => setStatusFilter('STABLE')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                statusFilter === 'STABLE'
                  ? 'bg-amber-500 text-white ring-2 ring-amber-300'
                  : 'bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-950/60 dark:text-amber-300'
              }`}
            >
              <span>⚠️ Estáveis (8-15d)</span>
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
      </div>

      {/* Main Full Batch Inventory Bento Table Container */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border-2 border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-green-700" />
            <h2 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
              Listagem Completa de Lotes no Estoque
            </h2>
            <span className="bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-300 text-xs px-2 py-0.5 rounded-full font-mono font-bold">
              {filteredBatches.length} itens
            </span>
          </div>

          <div className="text-xs text-slate-500 font-mono">
            Ordenado por prazo de validade
          </div>
        </div>

        {filteredBatches.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <AlertTriangle className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
              Nenhum produto encontrado com os filtros selecionados
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
                  <th className="p-3 text-center">Qtd</th>
                  <th className="p-3 text-right">Preço Un.</th>
                  <th className="p-3 text-right">Decisão do Supervisor</th>
                  <th className="p-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredBatches
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
                              {batch.supervisorDecision.type === 'DISCARD_AUTHORIZED' && 'Descarte'}
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
                            >
                              Baixa
                            </button>

                            <button
                              onClick={() => onOpenSupervisorModal(batch)}
                              className="bg-amber-600 hover:bg-amber-700 text-white px-2 py-1 rounded text-[11px] font-bold transition cursor-pointer"
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

    </div>
  );
};
