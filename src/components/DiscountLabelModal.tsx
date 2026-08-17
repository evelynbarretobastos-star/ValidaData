import React from 'react';
import { ProductBatch } from '../types';
import { formatBRL, formatDateBR, calculateEffectivePrice } from '../utils/formatters';
import { Printer, X, Tag, Barcode, AlertTriangle } from 'lucide-react';

interface DiscountLabelModalProps {
  batch: ProductBatch | null;
  isOpen: boolean;
  onClose: () => void;
}

export const DiscountLabelModal: React.FC<DiscountLabelModalProps> = ({
  batch,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !batch) return null;

  const effectivePrice = calculateEffectivePrice(batch);
  const hasDiscount = effectivePrice < batch.originalPrice;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 font-sans">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border-2 border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-yellow-500 text-slate-950 p-4 flex items-center justify-between border-b-2 border-yellow-600">
          <div className="flex items-center gap-2 font-black text-base">
            <Tag className="w-5 h-5 text-slate-950" />
            <span>Etiqueta Amarela de Promoção por Vencimento</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-yellow-600/30 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5 text-slate-950" />
          </button>
        </div>

        {/* Tag Preview Box */}
        <div className="p-6 space-y-6">
          
          <div className="text-xs text-slate-500 text-center">
            Pré-visualização da etiqueta de liquidação para impressora térmica de gôndola:
          </div>

          {/* Yellow Supermarket Sticker Preview */}
          <div className="bg-amber-300 text-slate-950 border-4 border-amber-500 p-5 rounded-2xl shadow-sm relative font-sans space-y-3 select-none">
            
            {/* Tag Header */}
            <div className="bg-slate-950 text-amber-300 px-3 py-1 rounded-lg text-center font-black text-xs uppercase tracking-widest flex items-center justify-center gap-1">
              <AlertTriangle className="w-4 h-4 text-amber-300" />
              <span>OFERTA DE LIQUIDAÇÃO • VALIDADE PRÓXIMA</span>
            </div>

            {/* Product Name */}
            <div className="text-center">
              <h3 className="font-black text-base leading-tight text-slate-950">
                {batch.name}
              </h3>
              <div className="text-[11px] font-mono font-bold text-slate-800 mt-0.5">
                Lote: {batch.batchNumber} | EAN: {batch.barcode}
              </div>
            </div>

            {/* Prices Grid */}
            <div className="bg-amber-200/90 p-3 rounded-xl border border-amber-400 text-center flex items-center justify-around">
              <div>
                <span className="text-[10px] font-bold text-slate-600 block uppercase">De (Preço Orig)</span>
                <span className="text-sm font-bold text-slate-600 line-through font-mono">
                  {formatBRL(batch.originalPrice)}
                </span>
              </div>

              <div className="text-2xl font-black text-slate-950">
                &rarr;
              </div>

              <div>
                <span className="text-[10px] font-extrabold text-red-700 block uppercase">Por Apenas</span>
                <span className="text-2xl font-black text-red-700 font-mono">
                  {formatBRL(effectivePrice)}
                </span>
              </div>
            </div>

            {/* Expiry Date Warning Banner */}
            <div className="bg-red-700 text-white p-2 rounded-lg text-center text-xs font-bold font-mono">
              ⚡ DATA DE VENCIMENTO: {formatDateBR(batch.expiryDate)}
            </div>

            {/* Barcode visual simulation */}
            <div className="pt-1 text-center">
              <div className="bg-white p-2 rounded border border-amber-400 inline-block mx-auto">
                <div className="font-mono text-[10px] font-bold text-slate-900 tracking-widest">
                  |||||| ||||| ||||||| ||||||
                </div>
                <div className="font-mono text-[9px] text-slate-600">
                  {batch.barcode}
                </div>
              </div>
            </div>

          </div>

          {/* Print Action */}
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="w-1/3 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-lg text-xs cursor-pointer"
            >
              Fechar
            </button>
            <button
              onClick={handlePrint}
              className="flex-1 py-2.5 px-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-lg shadow-sm transition text-xs flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Etiqueta Térmica</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
