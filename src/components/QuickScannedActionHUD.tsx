import React from 'react';
import { ProductBatch } from '../types';
import { getBatchStatusState, formatBRL, calculateDaysToExpiry, formatDateBR } from '../utils/formatters';
import { 
  Barcode, 
  PackagePlus, 
  ArrowLeftRight, 
  Tag, 
  X, 
  CheckCircle2, 
  AlertTriangle,
  Clock,
  ExternalLink
} from 'lucide-react';

interface QuickScannedActionHUDProps {
  scannedCode: string | null;
  batches: ProductBatch[];
  onClose: () => void;
  onNavigateToRegisterWithCode: (code: string) => void;
  onOpenMovementForBatch: (batch: ProductBatch) => void;
  onOpenPrintLabel: (batch: ProductBatch) => void;
}

export const QuickScannedActionHUD: React.FC<QuickScannedActionHUDProps> = ({
  scannedCode,
  batches,
  onClose,
  onNavigateToRegisterWithCode,
  onOpenMovementForBatch,
  onOpenPrintLabel,
}) => {
  if (!scannedCode) return null;

  // Find all batches matching the scanned barcode
  const matchingBatches = batches.filter(b => b.barcode === scannedCode);
  const primaryBatch = matchingBatches[0] || null;

  return (
    <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:w-[460px] z-50 animate-in slide-in-from-bottom-5 duration-200">
      <div className="bg-slate-900 text-white rounded-2xl shadow-2xl border-2 border-emerald-500 overflow-hidden font-sans">
        
        {/* Header Bar */}
        <div className="bg-emerald-700 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-white animate-ping" />
            <Barcode className="w-4 h-4 text-white" />
            <span className="text-xs font-black uppercase tracking-wider text-white">
              Bip do Leitor Físico Detectado!
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-emerald-100 hover:text-white p-1 rounded-md transition cursor-pointer"
            title="Fechar Notificação"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 space-y-3">
          
          <div className="flex items-center justify-between">
            <div className="text-xs font-mono text-emerald-400 font-bold bg-slate-800 px-2.5 py-1 rounded border border-slate-700">
              EAN: {scannedCode}
            </div>
            {primaryBatch && (
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                getBatchStatusState(primaryBatch.expiryDate) === 'CRITICAL' || getBatchStatusState(primaryBatch.expiryDate) === 'EXPIRED'
                  ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              }`}>
                {matchingBatches.length} Lote(s) no Estoque
              </span>
            )}
          </div>

          {primaryBatch ? (
            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-bold text-sm text-slate-100 line-clamp-1">{primaryBatch.name}</h4>
                  <p className="text-[11px] text-slate-400">
                    Lote: <strong className="text-slate-300 font-mono">#{primaryBatch.batchNumber}</strong>
                    {primaryBatch.location && primaryBatch.location !== 'Não informada' && (
                      <span className="ml-2 text-slate-500">• {primaryBatch.location}</span>
                    )}
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-400 shrink-0">
                  {formatBRL(primaryBatch.originalPrice)}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-700/60">
                <div className="flex items-center gap-1.5 text-slate-300">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Validade: <strong>{formatDateBR(primaryBatch.expiryDate)}</strong></span>
                </div>
                <span className={`font-mono text-[11px] font-bold ${
                  calculateDaysToExpiry(primaryBatch.expiryDate) <= 7 ? 'text-red-400' : 'text-emerald-400'
                }`}>
                  {calculateDaysToExpiry(primaryBatch.expiryDate) < 0 
                    ? 'VENCIDO' 
                    : `${calculateDaysToExpiry(primaryBatch.expiryDate)} dias rest.`}
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700 text-xs text-slate-300 space-y-1">
              <p className="font-bold text-slate-200">Novo produto identificado pelo leitor!</p>
              <p className="text-[11px] text-slate-400">Este código ainda não possui lotes cadastrados no sistema.</p>
            </div>
          )}

          {/* Action Buttons Grid */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            {primaryBatch ? (
              <>
                <button
                  onClick={() => {
                    onOpenMovementForBatch(primaryBatch);
                    onClose();
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white p-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                  <span>Dar Baixa / Ação</span>
                </button>

                <button
                  onClick={() => {
                    onNavigateToRegisterWithCode(scannedCode);
                    onClose();
                  }}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 p-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <PackagePlus className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Novo Lote</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  onNavigateToRegisterWithCode(scannedCode);
                  onClose();
                }}
                className="col-span-2 bg-emerald-600 hover:bg-emerald-500 text-white p-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <PackagePlus className="w-4 h-4" />
                <span>Cadastrar Entrada Deste Produto →</span>
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
