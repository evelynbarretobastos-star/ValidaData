import React, { useState } from 'react';
import { MovementLog, ProductBatch, SystemUser } from '../types';
import { formatBRL, formatDateBR } from '../utils/formatters';
import { 
  FileText, 
  Printer, 
  Download, 
  TrendingDown, 
  DollarSign, 
  CheckCircle2, 
  Search, 
  UserCheck, 
  Calendar, 
  FileSpreadsheet,
  Trash2,
  Tag,
  ShoppingBag
} from 'lucide-react';

interface AuditTabProps {
  logs: MovementLog[];
  batches: ProductBatch[];
  currentUser: SystemUser;
}

export const AuditTab: React.FC<AuditTabProps> = ({
  logs,
  batches,
  currentUser,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Compute stats
  const totalDiscardValue = logs
    .filter(l => l.movementType === 'DESCARTADO')
    .reduce((sum, l) => sum + l.totalValueAffected, 0);

  const totalPromotionValue = logs
    .filter(l => l.movementType === 'PROMOCAO')
    .reduce((sum, l) => sum + l.totalValueAffected, 0);

  const totalSoldValue = logs
    .filter(l => l.movementType === 'VENDIDO')
    .reduce((sum, l) => sum + l.totalValueAffected, 0);

  const filteredLogs = logs.filter(log => {
    if (typeFilter !== 'ALL' && log.movementType !== typeFilter) return false;
    if (searchTerm.trim() !== '') {
      const t = searchTerm.toLowerCase();
      return (
        log.productName.toLowerCase().includes(t) ||
        log.barcode.includes(t) ||
        log.batchNumber.toLowerCase().includes(t) ||
        log.performedByUserName.toLowerCase().includes(t) ||
        log.reason.toLowerCase().includes(t)
      );
    }
    return true;
  });

  const handlePrintReport = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = ['Data', 'Hora', 'Ação', 'Produto', 'EAN', 'Lote', 'Quantidade', 'Valor Total', 'Operador', 'Justificativa'];
    const rows = logs.map(l => [
      new Date(l.timestamp).toLocaleDateString('pt-BR'),
      new Date(l.timestamp).toLocaleTimeString('pt-BR'),
      l.movementType,
      `"${l.productName.replace(/"/g, '""')}"`,
      l.barcode,
      l.batchNumber,
      l.quantity,
      l.totalValueAffected.toFixed(2),
      `"${l.performedByUserName.replace(/"/g, '""')}"`,
      `"${l.reason.replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `relatorio_validades_supermercado_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6 font-sans">
      
      {/* Bento Header */}
      <div className="bg-green-700 text-white p-5 rounded-xl border-2 border-green-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white/20 rounded-xl">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-wide">
              Relatório Geral de Controle de Validades e Auditoria
            </h2>
            <p className="text-xs text-green-100 mt-0.5">
              Métricas financeiras de perdas por descarte, vendas em liquidação e rastreabilidade por operador
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="bg-green-800 hover:bg-green-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition border border-green-600 cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar CSV</span>
          </button>

          <button
            onClick={handlePrintReport}
            className="bg-slate-800 hover:bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition border border-slate-700 cursor-pointer shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir Relatório</span>
          </button>
        </div>
      </div>

      {/* Metric Bento Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border-2 border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase">Perda por Descartes (R$)</span>
            <div className="text-2xl font-black text-red-600 mt-1 font-mono">
              {formatBRL(totalDiscardValue)}
            </div>
            <span className="text-[10px] text-slate-400">Produtos inutilizados por vencimento</span>
          </div>
          <div className="p-3 bg-red-100 dark:bg-red-950/60 text-red-700 rounded-xl">
            <Trash2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border-2 border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase">Volume em Promoção (R$)</span>
            <div className="text-2xl font-black text-purple-700 mt-1 font-mono">
              {formatBRL(totalPromotionValue)}
            </div>
            <span className="text-[10px] text-slate-400">Recuperação de margem de estoque</span>
          </div>
          <div className="p-3 bg-purple-100 dark:bg-purple-950/60 text-purple-700 rounded-xl">
            <Tag className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border-2 border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase">Vendas Efetivadas (R$)</span>
            <div className="text-2xl font-black text-green-700 mt-1 font-mono">
              {formatBRL(totalSoldValue)}
            </div>
            <span className="text-[10px] text-slate-400">Total vendido dos lotes monitorados</span>
          </div>
          <div className="p-3 bg-green-100 dark:bg-green-950/60 text-green-700 rounded-xl">
            <ShoppingBag className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Log List */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border-2 border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-green-700" />
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
              Trilha de Auditoria Completa ({filteredLogs.length} registros)
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs outline-none"
            >
              <option value="ALL">Todas as Ações</option>
              <option value="RETIRADO">Somente Retirados</option>
              <option value="VENDIDO">Somente Vendidos</option>
              <option value="PROMOCAO">Somente Promoções</option>
              <option value="DESCARTADO">Somente Descartes</option>
            </select>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar produto ou operador..."
                className="pl-8 pr-3 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs outline-none"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider border-b border-slate-200 text-[10px]">
                <th className="p-3">Data / Hora</th>
                <th className="p-3">Ação</th>
                <th className="p-3">Produto</th>
                <th className="p-3">Lote / EAN</th>
                <th className="p-3 text-center">Qtd</th>
                <th className="p-3 text-right">Valor Total</th>
                <th className="p-3">Operador Identificado</th>
                <th className="p-3">Motivo / Notas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredLogs.map(l => (
                <tr key={l.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                  <td className="p-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                    {new Date(l.timestamp).toLocaleString('pt-BR')}
                  </td>

                  <td className="p-3 font-bold whitespace-nowrap">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      l.movementType === 'DESCARTADO' 
                        ? 'bg-red-800 text-white' 
                        : l.movementType === 'PROMOCAO' 
                        ? 'bg-purple-700 text-white' 
                        : l.movementType === 'VENDIDO' 
                        ? 'bg-green-700 text-white' 
                        : 'bg-amber-600 text-white'
                    }`}>
                      {l.movementType}
                    </span>
                  </td>

                  <td className="p-3 font-bold text-slate-900 dark:text-slate-100">
                    {l.productName}
                  </td>

                  <td className="p-3 font-mono text-[10px] text-slate-500">
                    {l.batchNumber} / {l.barcode}
                  </td>

                  <td className="p-3 text-center font-bold font-mono">
                    {l.quantity} {l.unit}
                  </td>

                  <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                    {formatBRL(l.totalValueAffected)}
                  </td>

                  <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">
                    <div className="flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5 text-green-600" />
                      <span>{l.performedByUserName} ({l.performedByUserRole})</span>
                    </div>
                  </td>

                  <td className="p-3 text-slate-600 dark:text-slate-400 text-xs">
                    {l.reason}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
