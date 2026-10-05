import React, { useState, useEffect } from 'react';
import { ProductBatch, MovementLog, MovementType, SystemUser } from '../types';
import { formatBRL, formatDateBR } from '../utils/formatters';
import { playSuccessBeep } from '../utils/sound';
import { 
  ArrowLeftRight, 
  Trash2, 
  ShoppingBag, 
  Tag, 
  AlertOctagon, 
  UserCheck, 
  Search, 
  CheckCircle2, 
  FileSpreadsheet, 
  Calendar, 
  Barcode, 
  Hash, 
  Filter,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';

interface MovementsTabProps {
  batches: ProductBatch[];
  logs: MovementLog[];
  currentUser: SystemUser;
  onRecordMovement: (
    batchId: string,
    type: MovementType,
    quantity: number,
    reason: string,
    notes?: string
  ) => void;
  onDeleteBatch?: (batchId: string) => void;
  onDeleteMovementLog?: (logId: string) => void;
  selectedBatchForAction?: ProductBatch | null;
  onClearSelectedBatch?: () => void;
}

export const MovementsTab: React.FC<MovementsTabProps> = ({
  batches,
  logs,
  currentUser,
  onRecordMovement,
  onDeleteBatch,
  onDeleteMovementLog,
  selectedBatchForAction,
  onClearSelectedBatch,
}) => {
  const [selectedBatchId, setSelectedBatchId] = useState<string>(
    selectedBatchForAction ? selectedBatchForAction.id : (batches[0]?.id || '')
  );
  // Default to RETIRADO (Unified with Descarte)
  const [movementType, setMovementType] = useState<MovementType>('RETIRADO');
  const [quantity, setQuantity] = useState<string>('1');
  const [reason, setReason] = useState<string>('Retirada / Descarte por vencimento do produto');
  const [notes, setNotes] = useState<string>('');
  
  const [logFilterType, setLogFilterType] = useState<string>('ALL');
  const [logSearchTerm, setLogSearchTerm] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [scannedAlert, setScannedAlert] = useState<string | null>(null);

  // Deletion modal state
  const [batchToDelete, setBatchToDelete] = useState<ProductBatch | null>(null);
  const [logToDelete, setLogToDelete] = useState<MovementLog | null>(null);

  // Auto-sync when selectedBatchForAction prop changes
  useEffect(() => {
    if (selectedBatchForAction) {
      setSelectedBatchId(selectedBatchForAction.id);
    }
  }, [selectedBatchForAction]);

  // Keep selectedBatchId valid
  useEffect(() => {
    if (batches.length > 0 && !batches.some(b => b.id === selectedBatchId)) {
      setSelectedBatchId(batches[0].id);
    }
  }, [batches, selectedBatchId]);

  // Listen to physical scanner events to auto-select matching batch
  useEffect(() => {
    const handleScan = (e: any) => {
      const barcode = e.detail?.barcode;
      if (barcode) {
        const found = batches.find(b => b.barcode === barcode);
        if (found) {
          setSelectedBatchId(found.id);
          setScannedAlert(`Lote "${found.batchNumber}" do produto "${found.name}" selecionado pelo leitor físico!`);
          setTimeout(() => setScannedAlert(null), 4000);
        } else {
          setScannedAlert(`Código ${barcode} lido, mas nenhum lote correspondente foi encontrado.`);
          setTimeout(() => setScannedAlert(null), 4000);
        }
      }
    };

    window.addEventListener('validedata:barcode-scanned', handleScan);
    return () => {
      window.removeEventListener('validedata:barcode-scanned', handleScan);
    };
  }, [batches]);

  const currentSelectedBatch = batches.find(b => b.id === selectedBatchId) || batches[0];

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!currentSelectedBatch) {
      setErrorMessage('Selecione um lote de produto válido no estoque.');
      return;
    }

    const parsedQty = parseInt(quantity, 10);
    if (isNaN(parsedQty) || parsedQty <= 0) {
      setErrorMessage('A quantidade movimentada deve ser maior que zero.');
      return;
    }

    if (parsedQty > currentSelectedBatch.quantity && (movementType === 'RETIRADO' || movementType === 'DESCARTADO' || movementType === 'VENDIDO')) {
      setErrorMessage(`A quantidade solicitada (${parsedQty}) excede o saldo atual em estoque (${currentSelectedBatch.quantity} ${currentSelectedBatch.unit}).`);
      return;
    }

    if (!reason.trim()) {
      setErrorMessage('Por favor informe o motivo/justificativa da ação.');
      return;
    }

    // Record movement (Normalize to RETIRADO for discard/withdrawn items)
    const normalizedType: MovementType = movementType === 'DESCARTADO' ? 'RETIRADO' : movementType;

    onRecordMovement(
      currentSelectedBatch.id,
      normalizedType,
      Number(parsedQty),
      reason.trim(),
      notes.trim()
    );

    playSuccessBeep();
    setSuccessMessage(
      `✅ Registrada baixa de ${parsedQty} ${currentSelectedBatch.unit} (${normalizedType === 'RETIRADO' ? 'Retirada / Descarte' : normalizedType}) no produto "${currentSelectedBatch.name}". Operador: ${currentUser.name}`
    );

    setNotes('');
    if (onClearSelectedBatch) onClearSelectedBatch();
    setTimeout(() => setSuccessMessage(''), 5000);
  };

  const handleConfirmDelete = () => {
    if (batchToDelete && onDeleteBatch) {
      onDeleteBatch(batchToDelete.id);
      playSuccessBeep();
      setSuccessMessage(`Lote #${batchToDelete.batchNumber} (${batchToDelete.name}) removido do sistema.`);
      setBatchToDelete(null);
      setTimeout(() => setSuccessMessage(''), 4000);
    }
  };

  const handleConfirmDeleteLog = () => {
    if (logToDelete && onDeleteMovementLog) {
      onDeleteMovementLog(logToDelete.id);
      playSuccessBeep();
      setSuccessMessage(`Registro removido! ${logToDelete.quantity} ${logToDelete.unit} do produto "${logToDelete.productName}" retornaram ao estoque.`);
      setLogToDelete(null);
      setTimeout(() => setSuccessMessage(''), 4000);
    }
  };

  // Filter logs
  const filteredLogs = logs.filter(log => {
    if (logFilterType !== 'ALL') {
      if (logFilterType === 'RETIRADO' && (log.movementType === 'RETIRADO' || log.movementType === 'DESCARTADO')) {
        // match both
      } else if (log.movementType !== logFilterType) {
        return false;
      }
    }
    if (logSearchTerm.trim() !== '') {
      const term = logSearchTerm.toLowerCase();
      const matchProduct = log.productName.toLowerCase().includes(term);
      const matchBarcode = (log.barcode || '').toLowerCase().includes(term);
      const matchBatch = log.batchNumber.toLowerCase().includes(term);
      const matchUser = log.performedByUserName.toLowerCase().includes(term);
      return matchProduct || matchBarcode || matchBatch || matchUser;
    }
    return true;
  });

  const getMovementConfig = (type: MovementType) => {
    switch (type) {
      case 'RETIRADO':
      case 'DESCARTADO':
        return {
          label: 'RETIRADA / DESCARTE',
          bg: 'bg-red-100 text-red-900 border-red-300 dark:bg-red-950/60 dark:text-red-200',
          badge: 'bg-red-700 text-white',
          icon: AlertOctagon,
          desc: 'Retirado do balcão ou descartado por vencimento',
        };
      case 'VENDIDO':
        return {
          label: 'VENDIDO',
          bg: 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-200',
          badge: 'bg-emerald-700 text-white',
          icon: ShoppingBag,
          desc: 'Venda efetuada com sucesso no PDV',
        };
      case 'PROMOCAO':
        return {
          label: 'COLOCADO EM PROMOÇÃO',
          bg: 'bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-950/60 dark:text-purple-200',
          badge: 'bg-purple-700 text-white',
          icon: Tag,
          desc: 'Colocado na gôndola de liquidação por vencimento próximo',
        };
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6 font-sans">
      
      {/* Upper Grid: Movement Action Form */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border-2 border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        
        {/* Bento Header */}
        <div className="bg-green-700 text-white p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-xl">
              <ArrowLeftRight className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">
                Registro de Ações e Baixas do Produto
              </h2>
              <p className="text-xs text-green-100 mt-0.5">
                Registre retiradas por vencimento, promoções ou vendas vinculadas ao seu usuário
              </p>
            </div>
          </div>

          {/* User Identification Chip */}
          <div className="bg-green-800/80 p-2.5 rounded-lg border border-green-600 flex items-center gap-2 text-xs">
            <UserCheck className="w-4 h-4 text-green-200" />
            <div>
              <div className="font-bold text-white">
                Operador: {currentUser.name}
              </div>
              <div className="text-[10px] text-green-200 font-mono">
                Matrícula: {currentUser.code} ({currentUser.role})
              </div>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleFormSubmit} className="p-6 space-y-6">
          
          {errorMessage && (
            <div className="bg-red-50 border border-red-300 text-red-800 p-3.5 rounded-lg text-xs font-medium flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-3.5 rounded-lg text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {scannedAlert && (
            <div className="bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-400 text-emerald-900 dark:text-emerald-200 p-3.5 rounded-lg text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <Barcode className="w-5 h-5 text-emerald-600 flex-shrink-0 animate-pulse" />
              <span>{scannedAlert}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Column 1: Select Product Batch */}
            <div className="lg:col-span-1 space-y-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                1. Selecione o Lote do Produto
              </label>

              {batches.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500 italic">
                  Nenhum lote cadastrado no momento.
                </div>
              ) : (
                <select
                  value={selectedBatchId}
                  onChange={(e) => setSelectedBatchId(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-900 dark:text-slate-100 font-bold focus:ring-2 ring-green-500 outline-none"
                >
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} - Lote: {b.batchNumber} (Val: {formatDateBR(b.expiryDate)} | Saldo: {b.quantity} {b.unit})
                    </option>
                  ))}
                </select>
              )}

              {currentSelectedBatch && (
                <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 text-xs space-y-2">
                  <div className="flex items-start justify-between gap-1">
                    <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                      {currentSelectedBatch.name}
                    </div>
                    {onDeleteBatch && (
                      <button
                        type="button"
                        onClick={() => setBatchToDelete(currentSelectedBatch)}
                        className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
                        title="Remover / Excluir este lote do sistema"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-600 dark:text-slate-400">
                    <div>
                      <span className="text-slate-400 block">EAN:</span>
                      <strong className="text-slate-800 dark:text-slate-200">{currentSelectedBatch.barcode}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Lote:</span>
                      <strong className="text-slate-800 dark:text-slate-200">{currentSelectedBatch.batchNumber}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Validade:</span>
                      <strong className="text-red-600 font-bold">{formatDateBR(currentSelectedBatch.expiryDate)}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Estoque Atual:</span>
                      <strong className="text-green-700 font-bold text-sm">{currentSelectedBatch.quantity} {currentSelectedBatch.unit}</strong>
                    </div>
                  </div>

                  {onDeleteBatch && (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                      <button
                        type="button"
                        onClick={() => setBatchToDelete(currentSelectedBatch)}
                        className="w-full py-1.5 px-2 bg-red-50 hover:bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-300 border border-red-200 dark:border-red-800 rounded text-[11px] font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Remover Este Lote do Sistema</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Column 2: Choose Action Type (Preserving only RETIRADA, PROMOCAO, VENDIDO) */}
            <div className="lg:col-span-2 space-y-4">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                2. Selecione a Ação a Realizar
              </label>

              {/* 3 Unified Options */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                
                {/* 1: RETIRADA (Unified with Descarte) */}
                <button
                  type="button"
                  onClick={() => {
                    setMovementType('RETIRADO');
                    setReason('Retirada / Descarte por vencimento do produto');
                  }}
                  className={`p-3.5 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                    movementType === 'RETIRADO' || movementType === 'DESCARTADO'
                      ? 'bg-red-600 text-white border-red-700 ring-2 ring-red-400 font-bold shadow-sm'
                      : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <AlertOctagon className="w-6 h-6" />
                  <span className="text-xs font-bold">Retirada / Descarte</span>
                  <span className="text-[10px] opacity-80 leading-tight">Retirado por vencimento</span>
                </button>

                {/* 2: PROMOCAO */}
                <button
                  type="button"
                  onClick={() => {
                    setMovementType('PROMOCAO');
                    setReason('Proximidade da data de vencimento (Oferta Especial)');
                  }}
                  className={`p-3.5 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                    movementType === 'PROMOCAO'
                      ? 'bg-purple-700 text-white border-purple-800 ring-2 ring-purple-400 font-bold shadow-sm'
                      : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <Tag className="w-6 h-6" />
                  <span className="text-xs font-bold">Em Promoção</span>
                  <span className="text-[10px] opacity-80 leading-tight">Liquidação preventiva</span>
                </button>

                {/* 3: VENDIDO */}
                <button
                  type="button"
                  onClick={() => {
                    setMovementType('VENDIDO');
                    setReason('Venda efetuada no caixa');
                  }}
                  className={`p-3.5 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                    movementType === 'VENDIDO'
                      ? 'bg-green-700 text-white border-green-800 ring-2 ring-green-400 font-bold shadow-sm'
                      : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <ShoppingBag className="w-6 h-6" />
                  <span className="text-xs font-bold">Vendido</span>
                  <span className="text-[10px] opacity-80 leading-tight">Saída por venda</span>
                </button>

              </div>

              {/* Quantity & Justification */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Quantidade da Baixa
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={currentSelectedBatch?.quantity || 999}
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="Ex: 1"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold font-mono text-slate-900 dark:text-slate-100 outline-none focus:ring-2 ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Justificativa / Motivo
                  </label>
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Ex: Vencido no prazo / Avaria"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 outline-none focus:ring-2 ring-green-500"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Observações Adicionais (Opcional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Etiqueta amarela colada / Caixa de descarte"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 outline-none focus:ring-2 ring-green-500"
                />
              </div>

              {/* Submit */}
              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="bg-green-700 hover:bg-green-800 text-white font-bold px-6 py-2.5 rounded-lg shadow-sm transition text-xs flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Gravar Baixa / Ação com {currentUser.name}</span>
                </button>
              </div>

            </div>

          </div>

        </form>
      </div>

      {/* Lower Section: Audit History of Movements */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border-2 border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/40">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-green-700" />
              <span>Histórico de Baixas e Ações Registradas</span>
            </h3>
            <p className="text-xs text-slate-500">
              Todas as baixas registradas contêm identificação do operador responsável
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={logSearchTerm}
                onChange={(e) => setLogSearchTerm(e.target.value)}
                placeholder="Filtrar por produto, operador..."
                className="pl-8 pr-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700 text-[10px]">
                <th className="p-3">Data / Hora</th>
                <th className="p-3">Ação</th>
                <th className="p-3">Produto &amp; Lote</th>
                <th className="p-3 text-center">Quantidade</th>
                <th className="p-3 text-right">Valor Total</th>
                <th className="p-3">Operador</th>
                <th className="p-3">Justificativa</th>
                <th className="p-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 italic">
                    Nenhum registro de movimentação retornado.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const config = getMovementConfig(log.movementType);
                  return (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                      <td className="p-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString('pt-BR')}
                      </td>

                      <td className="p-3 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${config?.badge || 'bg-slate-700 text-white'}`}>
                          {log.movementType === 'RETIRADO' || log.movementType === 'DESCARTADO' ? 'RETIRADA' : log.movementType}
                        </span>
                      </td>

                      <td className="p-3">
                        <div className="font-bold text-slate-900 dark:text-slate-100">
                          {log.productName}
                        </div>
                        <div className="text-[10px] font-mono text-slate-500">
                          Lote: #{log.batchNumber} | EAN: {log.barcode}
                        </div>
                      </td>

                      <td className="p-3 text-center font-bold font-mono">
                        {log.quantity} {log.unit}
                      </td>

                      <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                        {formatBRL(log.totalValueAffected)}
                      </td>

                      <td className="p-3">
                        <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                          <UserCheck className="w-3.5 h-3.5 text-green-600" />
                          <span>{log.performedByUserName}</span>
                        </div>
                        <div className="text-[10px] font-mono text-slate-500">
                          Cargo: {log.performedByUserRole}
                        </div>
                      </td>

                      <td className="p-3 text-slate-600 dark:text-slate-400 text-xs">
                        {log.reason}
                        {log.notes && <span className="block text-[10px] text-slate-400 italic mt-0.5">{log.notes}</span>}
                      </td>

                      <td className="p-3 text-center whitespace-nowrap">
                        {onDeleteMovementLog && (
                          <button
                            onClick={() => setLogToDelete(log)}
                            className="text-red-500 hover:text-red-700 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 p-1.5 rounded transition cursor-pointer"
                            title="Remover do histórico e devolver ao estoque"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
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
                Deseja realmente remover o lote <strong className="text-slate-800 dark:text-slate-200">#{batchToDelete.batchNumber}</strong> do produto <strong className="text-slate-800 dark:text-slate-200">"{batchToDelete.name}"</strong> do sistema?
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
                <span>Sim, Excluir</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Deleting Movement Log */}
      {logToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Remover Registro e Retornar ao Estoque?
              </h3>
              <p className="text-xs text-slate-500">
                Deseja remover o registro de baixa do produto <strong className="text-slate-800 dark:text-slate-200">"{logToDelete.productName}"</strong>? A quantidade baixada retornará automaticamente para o estoque.
              </p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs space-y-1 font-mono text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              <div>Ação: <span className="font-bold text-slate-800 dark:text-slate-200">{logToDelete.movementType === 'RETIRADO' || logToDelete.movementType === 'DESCARTADO' ? 'RETIRADA' : logToDelete.movementType}</span></div>
              <div>Lote: #{logToDelete.batchNumber} | Quantidade a devolver: <strong className="text-emerald-600 dark:text-emerald-400">+{logToDelete.quantity} {logToDelete.unit}</strong></div>
              <div>Data da baixa: {new Date(logToDelete.timestamp).toLocaleString('pt-BR')}</div>
              <div>Operador: {logToDelete.performedByUserName} ({logToDelete.performedByUserRole})</div>
              <div>Motivo original: {logToDelete.reason}</div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setLogToDelete(null)}
                className="w-1/2 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-lg transition text-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteLog}
                className="w-1/2 py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg shadow-sm transition text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Restaurar ao Estoque</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
