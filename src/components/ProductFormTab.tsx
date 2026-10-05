import React, { useState, useEffect } from 'react';
import { ProductBatch, SystemUser } from '../types';
import { PRESET_CATALOG } from '../data/initialData';
import { generateRandomBarcode, generateRandomBatch, formatBRL, formatDateBR, getBatchStatusState } from '../utils/formatters';
import { playSuccessBeep } from '../utils/sound';
import { 
  PackagePlus, 
  Barcode, 
  Calendar, 
  Layers, 
  Hash, 
  MapPin, 
  Sparkles, 
  CheckCircle2, 
  Scan, 
  AlertCircle,
  Trash2,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';

interface ProductFormTabProps {
  currentUser: SystemUser;
  batches?: ProductBatch[];
  onSaveBatch: (newBatch: Omit<ProductBatch, 'id' | 'createdAt' | 'createdUserId' | 'createdUserName'>) => void;
  onDeleteBatch?: (batchId: string) => void;
  onOpenScannerModal: (onScan: (scannedCode: string) => void) => void;
  initialBarcode?: string;
}

export const ProductFormTab: React.FC<ProductFormTabProps> = ({
  currentUser,
  batches = [],
  onSaveBatch,
  onDeleteBatch,
  onOpenScannerModal,
  initialBarcode,
}) => {
  // Form State - Initialized completely CLEAN for effortless typing
  const [barcode, setBarcode] = useState(initialBarcode || '');
  const [name, setName] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [manufacturingDate, setManufacturingDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [quantity, setQuantity] = useState<string>('');
  const [unit, setUnit] = useState<'un' | 'kg' | 'cx' | 'pct'>('un');
  const [originalPrice, setOriginalPrice] = useState<string>('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');

  const [formSuccessMessage, setFormSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [hasScannedFlash, setHasScannedFlash] = useState(false);

  // Deletion confirmation state
  const [batchToDelete, setBatchToDelete] = useState<ProductBatch | null>(null);

  useEffect(() => {
    if (initialBarcode) {
      setBarcode(initialBarcode);
      setHasScannedFlash(true);
      setTimeout(() => setHasScannedFlash(false), 2000);
    }
  }, [initialBarcode]);

  // Listen to global physical scanner events
  useEffect(() => {
    const handleGlobalScan = (e: any) => {
      const code = e.detail?.barcode;
      if (code) {
        setBarcode(code);
        setHasScannedFlash(true);
        setFormSuccessMessage(`Código ${code} capturado via leitor físico!`);
        setTimeout(() => setHasScannedFlash(false), 2000);
        setTimeout(() => setFormSuccessMessage(''), 3500);
      }
    };

    window.addEventListener('validedata:barcode-scanned', handleGlobalScan);
    return () => {
      window.removeEventListener('validedata:barcode-scanned', handleGlobalScan);
    };
  }, []);

  const handleGenerateBarcode = () => {
    const newBar = generateRandomBarcode();
    setBarcode(newBar);
  };

  const handleGenerateBatch = () => {
    const newBatch = generateRandomBatch();
    setBatchNumber(newBatch);
  };

  const handleClearForm = () => {
    setBarcode('');
    setName('');
    setBatchNumber('');
    setManufacturingDate('');
    setExpiryDate('');
    setQuantity('');
    setOriginalPrice('');
    setLocation('');
    setNotes('');
    setErrorMessage('');
  };

  // EXPLICIT SAVE ACTION (Only executes when the Save button is clicked)
  const handleExplicitSave = () => {
    setErrorMessage('');
    setFormSuccessMessage('');

    // Validations (Barcode, Batch, Manufacturing Date are optional)
    if (!name.trim()) {
      setErrorMessage('O nome do produto é obrigatório!');
      return;
    }
    if (!expiryDate) {
      setErrorMessage('A data de validade é obrigatória!');
      return;
    }

    const parsedQty = parseInt(quantity, 10);
    if (isNaN(parsedQty) || parsedQty <= 0) {
      setErrorMessage('Informe uma quantidade válida maior que zero!');
      return;
    }

    const parsedPrice = parseFloat(originalPrice.replace(',', '.')) || 0;

    if (manufacturingDate && expiryDate && new Date(manufacturingDate) > new Date(expiryDate)) {
      setErrorMessage('A data de fabricação não pode ser posterior à data de validade!');
      return;
    }

    const finalBatchNumber = batchNumber.trim() || 'S/L';

    // Call save batch
    onSaveBatch({
      barcode: barcode.trim() || 'SEM EAN',
      name: name.trim(),
      category: 'Geral',
      batchNumber: finalBatchNumber,
      manufacturingDate: manufacturingDate || '',
      expiryDate,
      quantity: parsedQty,
      initialQuantity: parsedQty,
      unit,
      originalPrice: parsedPrice,
      location: location.trim() || 'Não informada',
      notes: notes.trim(),
    });

    playSuccessBeep();
    setFormSuccessMessage(`✅ Lote "${finalBatchNumber}" do produto "${name}" cadastrado com sucesso!`);

    // Reset fields cleanly
    setBarcode('');
    setName('');
    setBatchNumber('');
    setManufacturingDate('');
    setExpiryDate('');
    setQuantity('');
    setOriginalPrice('');
    setLocation('');
    setNotes('');

    setTimeout(() => setFormSuccessMessage(''), 5000);
  };

  const handleConfirmDelete = () => {
    if (batchToDelete && onDeleteBatch) {
      onDeleteBatch(batchToDelete.id);
      playSuccessBeep();
      setFormSuccessMessage(`Lote #${batchToDelete.batchNumber} (${batchToDelete.name}) removido com sucesso.`);
      setBatchToDelete(null);
      setTimeout(() => setFormSuccessMessage(''), 4000);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto font-sans space-y-6">
      
      {/* Main Registration Card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border-2 border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        
        {/* Bento Card Header */}
        <div className="bg-green-700 text-white p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-xl">
              <PackagePlus className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">
                Aba de Registro de Produto e Validade
              </h2>
              <p className="text-xs text-green-100 mt-0.5">
                Preencha os dados do lote: Validade, Fabricação, Lote e Quantidade
              </p>
            </div>
          </div>

          <div className="text-right text-xs bg-green-800/80 px-3 py-1.5 rounded-lg border border-green-600 font-mono">
            Operador Resp: <span className="font-bold text-white">{currentUser.name}</span>
          </div>
        </div>

        {/* Form Body - PREVENT SUBMISSION ON ENTER */}
        <form 
          onSubmit={(e) => e.preventDefault()} 
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault(); // Prevents accidental Enter submissions & duplication
            }
          }}
          className="p-6 space-y-6"
        >
          
          {/* Notifications */}
          {errorMessage && (
            <div className="bg-red-50 border border-red-300 text-red-800 dark:bg-red-950 dark:text-red-200 p-3.5 rounded-lg text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {formSuccessMessage && (
            <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 p-3.5 rounded-lg text-xs font-bold flex items-center gap-2 shadow-xs">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>{formSuccessMessage}</span>
            </div>
          )}

          {/* Quick Preset Selector & Visual Model Cards */}
          {PRESET_CATALOG.length > 0 && (
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-green-700" />
                  <span>Modelos Rápidos do Catálogo ({PRESET_CATALOG.length} Produtos)</span>
                </label>

                <button
                  type="button"
                  onClick={() => onOpenScannerModal((scanned) => {
                    setBarcode(scanned);
                    const found = PRESET_CATALOG.find(p => p.barcode === scanned);
                    if (found) {
                      setName(found.name);
                      setOriginalPrice(found.originalPrice.toFixed(2));
                      setUnit(found.unit);
                    }
                  })}
                  className="bg-green-700 hover:bg-green-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
                >
                  <Scan className="w-4 h-4" />
                  <span>Simular Leitor Cód. Barras</span>
                </button>
              </div>

              {/* Grid of Quick Pick Product Models */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-1">
                {PRESET_CATALOG.map((p) => (
                  <button
                    key={p.barcode}
                    type="button"
                    onClick={() => {
                      setBarcode(p.barcode);
                      setName(p.name);
                      setUnit(p.unit);
                      setOriginalPrice(p.originalPrice.toFixed(2));
                      setFormSuccessMessage(`Modelo selecionado: ${p.name}`);
                      setTimeout(() => setFormSuccessMessage(''), 3000);
                    }}
                    className={`p-2.5 rounded-lg border text-left transition flex flex-col justify-between group cursor-pointer ${
                      barcode === p.barcode
                        ? 'bg-green-50 dark:bg-green-950/60 border-green-600 ring-2 ring-green-500'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-green-500 hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-100 group-hover:text-green-700 line-clamp-2 leading-tight">
                        {p.name}
                      </span>
                      <span className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-mono font-semibold px-1.5 py-0.5 rounded shrink-0">
                        R$ {p.originalPrice.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-end text-[10px] text-green-600 font-bold mt-1.5 group-hover:underline">
                      Usar Modelo →
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Section 1: Product Identification */}
          <div className="space-y-4">
            <h3 className="text-xs font-extrabold text-green-800 dark:text-green-300 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 pb-1 flex items-center gap-1.5">
              <Barcode className="w-4 h-4 text-green-700" />
              <span>1. Identificação do Produto</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Barcode Field */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase flex items-center gap-1.5">
                    <span>Código de Barras (EAN-13)</span>
                    <span className="text-[10px] font-normal text-slate-400 lowercase">(opcional)</span>
                  </label>
                  
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Leitor USB/Bluetooth Ativo</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Barcode className={`w-4 h-4 absolute left-3 top-2.5 transition-colors ${
                      hasScannedFlash ? 'text-emerald-500 animate-bounce' : 'text-slate-400'
                    }`} />
                    <input
                      type="text"
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                      placeholder="Bipe com o leitor ou digite o EAN..."
                      className={`w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg text-xs text-slate-900 dark:text-slate-100 font-mono font-bold focus:ring-2 outline-none transition-all ${
                        hasScannedFlash
                          ? 'border-emerald-500 ring-2 ring-emerald-500 bg-emerald-50 dark:bg-emerald-950/40'
                          : 'border-slate-300 dark:border-slate-700 ring-green-500'
                      }`}
                    />
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => onOpenScannerModal((scanned) => {
                      setBarcode(scanned);
                      setHasScannedFlash(true);
                      setTimeout(() => setHasScannedFlash(false), 2000);
                    })}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-2 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs shrink-0"
                    title="Abrir Leitor / Câmera"
                  >
                    <Scan className="w-3.5 h-3.5" />
                    <span>Leitor</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleGenerateBarcode}
                    className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-2 rounded-lg text-[11px] font-bold border border-slate-300 dark:border-slate-700 cursor-pointer shrink-0"
                    title="Gerar código aleatório EAN"
                  >
                    Gerar EAN
                  </button>
                </div>
              </div>

              {/* Product Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Nome do Produto <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Leite Integral UHT 1L"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 font-semibold focus:ring-2 ring-green-500 outline-none"
                />
              </div>

              {/* Location in Supermarket (Optional) */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1 flex items-center justify-between">
                  <span>Localização / Corredor / Gôndola</span>
                  <span className="text-[10px] font-normal text-slate-400">Opcional</span>
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Ex: Corredor 3 - Prateleira B / Câmara Fria (opcional)"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:ring-2 ring-green-500 outline-none"
                  />
                </div>
              </div>

            </div>
          </div>

          {/* Section 2: Dates & Batch */}
          <div className="space-y-4">
            <h3 className="text-xs font-extrabold text-green-800 dark:text-green-300 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 pb-1 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-green-700" />
              <span>2. Lote, Fabricação e Validade</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              
              {/* Batch Number */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1 flex items-center gap-1.5">
                  <span>Número do Lote</span>
                  <span className="text-[10px] font-normal text-slate-400 lowercase">(opcional)</span>
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={batchNumber}
                      onChange={(e) => setBatchNumber(e.target.value)}
                      placeholder="Ex: LOT-2026-A89 (ou em branco)"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono font-bold text-slate-900 dark:text-slate-100 focus:ring-2 ring-green-500 outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleGenerateBatch}
                    className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-2 rounded-lg text-[10px] font-bold border border-slate-300 cursor-pointer"
                    title="Gerar código de lote aleatório"
                  >
                    Auto
                  </button>
                </div>
              </div>

              {/* Manufacturing Date */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1 flex items-center gap-1.5">
                  <span>Data de Fabricação</span>
                  <span className="text-[10px] font-normal text-slate-400 lowercase">(opcional)</span>
                </label>
                <input
                  type="date"
                  value={manufacturingDate}
                  onChange={(e) => setManufacturingDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono font-bold text-slate-900 dark:text-slate-100 focus:ring-2 ring-green-500 outline-none"
                />
              </div>

              {/* Expiry Date */}
              <div>
                <label className="block text-xs font-bold text-red-600 dark:text-red-400 uppercase mb-1 flex items-center justify-between">
                  <span>Data de Validade <span className="text-red-500">*</span></span>
                  <span className="text-[10px] font-mono text-red-700 bg-red-100 px-1.5 py-0.2 rounded">Crítico</span>
                </label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full px-3 py-2 bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 rounded-lg text-xs font-mono font-black text-red-900 dark:text-red-200 focus:ring-2 ring-red-500 outline-none"
                />
              </div>

            </div>
          </div>

          {/* Section 3: Quantity & Price */}
          <div className="space-y-4">
            <h3 className="text-xs font-extrabold text-green-800 dark:text-green-300 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 pb-1 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-green-700" />
              <span>3. Quantidade e Valor Financeiro</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              {/* Quantity */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Quantidade no Lote <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="Ex: 24"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold font-mono text-slate-900 dark:text-slate-100 focus:ring-2 ring-green-500 outline-none"
                />
              </div>

              {/* Unit */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Unidade de Medida
                </label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-slate-100 focus:ring-2 ring-green-500 outline-none"
                >
                  <option value="un">Unidade (un)</option>
                  <option value="kg">Quilograma (kg)</option>
                  <option value="cx">Caixa (cx)</option>
                  <option value="pct">Pacote (pct)</option>
                </select>
              </div>

              {/* Price */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Preço Original (R$)
                </label>
                <div className="relative">
                  <span className="text-xs font-bold text-slate-400 absolute left-3 top-2.5">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(e.target.value)}
                    placeholder="0,00"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold font-mono text-slate-900 dark:text-slate-100 focus:ring-2 ring-green-500 outline-none"
                  />
                </div>
              </div>

            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Observações Adicionais do Lote (Opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Ex: Embalagem intacta, verificado no recebimento da carga."
              className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:ring-2 ring-green-500 outline-none"
            />
          </div>

          {/* Submit Action (ONLY SAVES WHEN BUTTON IS CLICKED) */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500">
                Operador: <strong className="text-slate-800 dark:text-slate-200">{currentUser.name}</strong> ({currentUser.code})
              </span>
              <button
                type="button"
                onClick={handleClearForm}
                className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Limpar Campos</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleExplicitSave}
              className="w-full sm:w-auto bg-green-700 hover:bg-green-800 text-white font-bold px-8 py-3 rounded-lg shadow-sm transition text-xs flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-200" />
              <span>Salvar e Cadastrar Lote</span>
            </button>
          </div>

        </form>
      </div>

      {/* RECENTLY REGISTERED BATCHES WITH REMOVE / DELETE OPTION */}
      {batches.length > 0 && onDeleteBatch && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border-2 border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-red-600" />
                <span>Lotes Cadastrados Recentemente (Remover em caso de erro)</span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Se algum lote foi registrado com dados errados ou duplicado, você pode excluí-lo diretamente aqui.
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">{batches.length} lote(s) no sistema</span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-60 overflow-y-auto">
            {batches.slice(0, 6).map((b) => (
              <div key={b.id} className="py-2.5 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 px-2 rounded-lg transition">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">{b.name}</span>
                    <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">
                      Lote: #{b.batchNumber}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5 flex items-center gap-2">
                    <span>EAN: {b.barcode}</span>
                    <span>•</span>
                    <span>Validade: <strong>{formatDateBR(b.expiryDate)}</strong></span>
                    <span>•</span>
                    <span>Qtd: <strong>{b.quantity} {b.unit}</strong></span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setBatchToDelete(b)}
                  className="bg-red-50 hover:bg-red-100 text-red-700 dark:bg-red-950/40 dark:hover:bg-red-900/60 dark:text-red-300 px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border border-red-200 dark:border-red-800 transition cursor-pointer shrink-0"
                  title="Remover item salvo incorretamente"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remover Lote</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirmation Modal for Deleting Batch */}
      {batchToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Confirmar Remoção do Lote?
              </h3>
              <p className="text-xs text-slate-500">
                Deseja realmente remover o lote <strong className="text-slate-800 dark:text-slate-200">#{batchToDelete.batchNumber}</strong> do produto <strong className="text-slate-800 dark:text-slate-200">"{batchToDelete.name}"</strong>?
              </p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs space-y-1 font-mono text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              <div>EAN: {batchToDelete.barcode}</div>
              <div>Validade: {formatDateBR(batchToDelete.expiryDate)}</div>
              <div>Quantidade: {batchToDelete.quantity} {batchToDelete.unit}</div>
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
