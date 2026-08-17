import React, { useState } from 'react';
import { ProductBatch, SupervisorDecision, SystemUser } from '../types';
import { formatBRL, formatDateBR, calculateDaysToExpiry, calculateEffectivePrice } from '../utils/formatters';
import { playSuccessBeep } from '../utils/sound';
import { 
  ShieldCheck, 
  Lock, 
  Tag, 
  Percent, 
  Gift, 
  Trash2, 
  DollarSign, 
  CheckCircle2, 
  Printer, 
  AlertTriangle, 
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface SupervisorTabProps {
  batches: ProductBatch[];
  currentUser: SystemUser;
  onApplySupervisorDecision: (batchId: string, decision: SupervisorDecision) => void;
  onRemoveSupervisorDecision: (batchId: string) => void;
  onRequestSupervisorLogin: () => void;
  onOpenPrintLabelModal: (batch: ProductBatch) => void;
}

export const SupervisorTab: React.FC<SupervisorTabProps> = ({
  batches,
  currentUser,
  onApplySupervisorDecision,
  onRemoveSupervisorDecision,
  onRequestSupervisorLogin,
  onOpenPrintLabelModal,
}) => {
  // Guard: Restricted access to Supervisor
  if (currentUser.role !== 'SUPERVISOR') {
    return (
      <div className="p-8 max-w-lg mx-auto text-center font-sans space-y-4">
        <div className="bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-800 p-8 rounded-2xl shadow-xl space-y-4">
          <div className="w-16 h-16 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-8 h-8 text-amber-700" />
          </div>
          <h2 className="text-xl font-black text-amber-950 dark:text-amber-100">
            Aba de Acesso Restrito ao Supervisor
          </h2>
          <p className="text-xs text-amber-800 dark:text-amber-300">
            Você está identificado atualmente como <strong>{currentUser.name} (Operador)</strong>.
            Esta aba é exclusiva para supervisores gerenciarem políticas de desconto, promoções 2 por 1 e descarte.
          </p>
          <button
            onClick={onRequestSupervisorLogin}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-4 rounded-xl shadow-md transition text-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <ShieldCheck className="w-5 h-5" />
            <span>Identificar-se como Supervisor (PIN)</span>
          </button>
        </div>
      </div>
    );
  }

  // Supervisor view
  const [selectedBatchId, setSelectedBatchId] = useState<string>(batches[0]?.id || '');
  const [decisionType, setDecisionType] = useState<'DISCOUNT_PERCENT' | 'BUY_1_GET_1' | 'CLEARANCE_FIXED' | 'DISCARD_AUTHORIZED'>('DISCOUNT_PERCENT');
  const [discountPercent, setDiscountPercent] = useState<number>(30);
  const [fixedPrice, setFixedPrice] = useState<number>(3.99);
  const [notes, setNotes] = useState<string>('Ação autorizada pelo supervisor para prevenção de vencimento.');
  
  const [successMessage, setSuccessMessage] = useState<string>('');

  const currentBatch = batches.find(b => b.id === selectedBatchId) || batches[0];

  const handleApplyDecision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBatch) return;

    let desc = '';
    if (decisionType === 'DISCOUNT_PERCENT') {
      desc = `Desconto especial de ${discountPercent}% por vencimento próximo.`;
    } else if (decisionType === 'BUY_1_GET_1') {
      desc = `Promoção Leve 2 Pague 1.`;
    } else if (decisionType === 'CLEARANCE_FIXED') {
      desc = `Preço fixo de liquidação por ${formatBRL(fixedPrice)}.`;
    } else if (decisionType === 'DISCARD_AUTHORIZED') {
      desc = `Descarte sanitário autorizado pelo supervisor.`;
    }

    const decision: SupervisorDecision = {
      type: decisionType,
      discountPercent: decisionType === 'DISCOUNT_PERCENT' ? discountPercent : undefined,
      fixedPrice: decisionType === 'CLEARANCE_FIXED' ? fixedPrice : undefined,
      description: `${desc} ${notes}`.trim(),
      decidedByUserId: currentUser.id,
      decidedByUserName: currentUser.name,
      decidedAt: new Date().toISOString(),
    };

    onApplySupervisorDecision(currentBatch.id, decision);
    playSuccessBeep();
    setSuccessMessage(`✅ Decisão aplicada com sucesso ao produto "${currentBatch.name}"!`);
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  // Batches sorted by days remaining (critical first)
  const sortedBatches = [...batches].sort(
    (a, b) => calculateDaysToExpiry(a.expiryDate) - calculateDaysToExpiry(b.expiryDate)
  );

  // Batches with active decision
  const activePromotions = batches.filter(b => b.supervisorDecision !== undefined);

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6 font-sans">
      
      {/* Top Bento Header */}
      <div className="bg-amber-600 text-white p-5 rounded-xl border-2 border-amber-700 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white/20 rounded-xl">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-wide">
              Aba do Supervisor: Gestão e Decisões de Validade Próxima
            </h2>
            <p className="text-xs text-amber-100">
              Configure promoções, descontos percentuais, ofertas 2 por 1 ou autorize baixas por descarte
            </p>
          </div>
        </div>

        <div className="bg-amber-800/80 border border-amber-500 px-3 py-1.5 rounded-lg text-xs font-mono">
          Supervisor Ativo: <strong className="text-white">{currentUser.name}</strong> ({currentUser.code})
        </div>
      </div>

      {/* Decision Configuration Form */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border-2 border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-6">
        
        {successMessage && (
          <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-3.5 rounded-lg text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleApplyDecision} className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Step 1: Select Batch */}
            <div className="space-y-3 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                1. Selecione o Produto / Lote Crítico
              </label>

              <select
                value={selectedBatchId}
                onChange={(e) => setSelectedBatchId(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-900 dark:text-slate-100 font-bold outline-none focus:ring-2 ring-amber-500"
              >
                {sortedBatches.map((b) => {
                  const days = calculateDaysToExpiry(b.expiryDate);
                  return (
                    <option key={b.id} value={b.id}>
                      [{days <= 7 ? '🚨 CRÍTICO' : days <= 15 ? '⚠️ ESTÁVEL' : '✅ NORMAL'}] {b.name} - Val: {formatDateBR(b.expiryDate)}
                    </option>
                  );
                })}
              </select>

              {currentBatch && (
                <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
                  <div className="font-extrabold text-slate-900 dark:text-slate-100">
                    {currentBatch.name}
                  </div>
                  <div className="text-[11px] font-mono text-slate-500">
                    Lote: <strong>{currentBatch.batchNumber}</strong> | Preço Orig: <strong>{formatBRL(currentBatch.originalPrice)}</strong>
                  </div>
                  <div className="text-xs font-bold text-red-600 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Data de Validade: {formatDateBR(currentBatch.expiryDate)} ({calculateDaysToExpiry(currentBatch.expiryDate)} dias)</span>
                  </div>
                </div>
              )}
            </div>

            {/* Step 2: Choose Strategy */}
            <div className="md:col-span-2 space-y-4">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                2. Determine a Ação / Promoção Recomendada
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                
                {/* 1: Discount Percent */}
                <button
                  type="button"
                  onClick={() => setDecisionType('DISCOUNT_PERCENT')}
                  className={`p-3 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                    decisionType === 'DISCOUNT_PERCENT'
                      ? 'bg-amber-600 text-white border-amber-700 ring-2 ring-amber-300 font-bold shadow-sm'
                      : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200'
                  }`}
                >
                  <Percent className="w-5 h-5" />
                  <span className="text-xs">Desconto %</span>
                </button>

                {/* 2: 2 for 1 */}
                <button
                  type="button"
                  onClick={() => setDecisionType('BUY_1_GET_1')}
                  className={`p-3 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                    decisionType === 'BUY_1_GET_1'
                      ? 'bg-purple-700 text-white border-purple-800 ring-2 ring-purple-300 font-bold shadow-sm'
                      : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200'
                  }`}
                >
                  <Gift className="w-5 h-5" />
                  <span className="text-xs">Leve 2 Pague 1</span>
                </button>

                {/* 3: Fixed Clearance */}
                <button
                  type="button"
                  onClick={() => setDecisionType('CLEARANCE_FIXED')}
                  className={`p-3 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                    decisionType === 'CLEARANCE_FIXED'
                      ? 'bg-green-700 text-white border-green-800 ring-2 ring-green-300 font-bold shadow-sm'
                      : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200'
                  }`}
                >
                  <DollarSign className="w-5 h-5" />
                  <span className="text-xs">Preço Fixo</span>
                </button>

                {/* 4: Discard */}
                <button
                  type="button"
                  onClick={() => setDecisionType('DISCARD_AUTHORIZED')}
                  className={`p-3 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                    decisionType === 'DISCARD_AUTHORIZED'
                      ? 'bg-red-700 text-white border-red-800 ring-2 ring-red-300 font-bold shadow-sm'
                      : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200'
                  }`}
                >
                  <Trash2 className="w-5 h-5" />
                  <span className="text-xs">Autorizar Descarte</span>
                </button>

              </div>

              {/* Strategy Parameters */}
              {decisionType === 'DISCOUNT_PERCENT' && (
                <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900/50 space-y-3">
                  <label className="block text-xs font-bold text-amber-900 dark:text-amber-200 uppercase">
                    Selecione a Porcentagem de Desconto (% OFF)
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    {[10, 20, 30, 40, 50, 70].map(pct => (
                      <button
                        type="button"
                        key={pct}
                        onClick={() => setDiscountPercent(pct)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition cursor-pointer ${
                          discountPercent === pct
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-amber-300'
                        }`}
                      >
                        {pct}% OFF
                      </button>
                    ))}
                  </div>

                  {currentBatch && (
                    <div className="text-xs text-amber-900 dark:text-amber-200 pt-1 flex items-center gap-2">
                      <span>Preço Original: <strong className="line-through">{formatBRL(currentBatch.originalPrice)}</strong></span>
                      <ArrowRight className="w-3.5 h-3.5" />
                      <span>Novo Preço Promocional: <strong className="text-xs font-bold text-green-700">{formatBRL(currentBatch.originalPrice * (1 - discountPercent / 100))}</strong></span>
                    </div>
                  )}
                </div>
              )}

              {decisionType === 'CLEARANCE_FIXED' && (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-900/50 space-y-2">
                  <label className="block text-xs font-bold text-emerald-900 dark:text-emerald-200 uppercase">
                    Defina o Preço Fixo Especial de Liquidação (R$)
                  </label>
                  <div className="relative max-w-xs">
                    <span className="text-xs font-bold text-slate-400 absolute left-3 top-2.5">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      min={0.10}
                      value={fixedPrice}
                      onChange={(e) => setFixedPrice(parseFloat(e.target.value) || 0.10)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 dark:text-slate-100 outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Submit Decision */}
              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-6 py-3 rounded-xl shadow-sm transition text-xs flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Aplicar Decisão e Gerar Etiqueta Promocional</span>
                </button>
              </div>

            </div>

          </div>

        </form>
      </div>

      {/* Lower Section: Active Promotions Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border-2 border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
              Lotes com Decisão / Promoção Ativa no Mercado ({activePromotions.length})
            </h3>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider border-b border-slate-200 text-[10px]">
                <th className="p-3">Produto &amp; Lote</th>
                <th className="p-3">Validade</th>
                <th className="p-3">Tipo de Decisão</th>
                <th className="p-3 text-right">Preço Orig.</th>
                <th className="p-3 text-right">Preço Promocional</th>
                <th className="p-3">Supervisor Resp.</th>
                <th className="p-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {activePromotions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 italic">
                    Nenhuma promoção ou decisão ativa no momento.
                  </td>
                </tr>
              ) : (
                activePromotions.map((batch) => {
                  const effective = calculateEffectivePrice(batch);
                  return (
                    <tr key={batch.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                      <td className="p-3 font-bold text-slate-900 dark:text-slate-100">
                        {batch.name}
                        <span className="block text-[10px] font-mono text-slate-400 font-normal">
                          Lote: {batch.batchNumber} | EAN: {batch.barcode}
                        </span>
                      </td>

                      <td className="p-3 font-mono text-red-600 font-bold whitespace-nowrap">
                        {formatDateBR(batch.expiryDate)}
                      </td>

                      <td className="p-3">
                        <span className="bg-purple-100 text-purple-900 border border-purple-300 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">
                          {batch.supervisorDecision?.description}
                        </span>
                      </td>

                      <td className="p-3 text-right font-mono line-through text-slate-400">
                        {formatBRL(batch.originalPrice)}
                      </td>

                      <td className="p-3 text-right font-mono font-bold text-purple-700 text-xs">
                        {formatBRL(effective)}
                      </td>

                      <td className="p-3 text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {batch.supervisorDecision?.decidedByUserName}
                      </td>

                      <td className="p-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onOpenPrintLabelModal(batch)}
                            className="bg-amber-600 hover:bg-amber-700 text-white px-2.5 py-1 rounded text-[11px] font-bold flex items-center gap-1 transition cursor-pointer shadow-xs"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Etiqueta</span>
                          </button>

                          <button
                            onClick={() => onRemoveSupervisorDecision(batch.id)}
                            className="bg-slate-200 hover:bg-slate-300 text-slate-800 dark:bg-slate-800 dark:text-slate-200 px-2.5 py-1 rounded text-[11px] font-bold transition cursor-pointer"
                            title="Remover decisão / Restaurar preço normal"
                          >
                            Remover
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
