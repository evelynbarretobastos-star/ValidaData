import React, { useState, useEffect, useRef } from 'react';
import { 
  Scan, 
  X, 
  Camera, 
  Barcode, 
  CheckCircle2, 
  Usb, 
  Bluetooth, 
  Radio, 
  Settings2, 
  Zap, 
  Volume2, 
  VolumeX, 
  Info,
  Laptop,
  Check,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { PRESET_CATALOG } from '../data/initialData';
import { playScannerBeep, playSuccessBeep } from '../utils/sound';
import { ScannerConfig, ScannerConnectionState } from '../utils/scannerManager';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanResult: (barcode: string) => void;
  connectionState?: ScannerConnectionState;
  onConnectBluetooth?: () => Promise<boolean>;
  onDisconnectBluetooth?: () => void;
  isPairingBluetooth?: boolean;
  bluetoothError?: string | null;
  config?: ScannerConfig;
  onUpdateConfig?: (newConfig: ScannerConfig) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onScanResult,
  connectionState,
  onConnectBluetooth,
  onDisconnectBluetooth,
  isPairingBluetooth,
  bluetoothError,
  config,
  onUpdateConfig,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'usb' | 'bluetooth' | 'camera' | 'settings'>('usb');
  const [testScannedCode, setTestScannedCode] = useState<string | null>(null);
  const [testScannedTime, setTestScannedTime] = useState<number | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [isSuccessFlash, setIsSuccessFlash] = useState(false);
  const testInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTestScannedCode(connectionState?.lastScannedCode || null);
      // Auto focus test input if on usb or bluetooth tab
      setTimeout(() => {
        if (testInputRef.current) {
          testInputRef.current.focus();
        }
      }, 100);
    }
  }, [isOpen, connectionState?.lastScannedCode]);

  if (!isOpen) return null;

  const handleApplyScannedCode = (code: string) => {
    playScannerBeep();
    setTestScannedCode(code);
    setIsSuccessFlash(true);
    setTimeout(() => {
      onScanResult(code);
      onClose();
    }, 450);
  };

  const handleTestInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const val = (e.target as HTMLInputElement).value.trim();
      if (val) {
        const start = Date.now();
        playScannerBeep();
        setTestScannedCode(val);
        setTestScannedTime(Date.now() - start);
        setIsSuccessFlash(true);
        setTimeout(() => setIsSuccessFlash(false), 2000);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 font-sans animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border-2 border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="bg-green-800 text-white p-4 flex items-center justify-between border-b border-green-900 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-green-700 rounded-xl shadow-xs">
              <Scan className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white flex items-center gap-2">
                <span>Central de Conexão do Leitor de Código de Barras</span>
              </h2>
              <p className="text-xs text-green-200">
                Suporte integrado para Cabo USB, Bluetooth sem fio e Câmera
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-green-700 rounded-lg text-green-100 hover:text-white transition cursor-pointer"
            title="Fechar Central do Leitor"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Status Header Bar */}
        <div className="bg-green-950/80 px-4 py-2.5 border-b border-green-900/60 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-3">
            {/* USB Status */}
            <div className="flex items-center gap-1.5 text-emerald-300 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
              <Usb className="w-3.5 h-3.5" />
              <span>Entrada USB: <strong>Ativa (Plug & Play)</strong></span>
            </div>

            {/* Bluetooth Status */}
            <div className="flex items-center gap-1.5 text-emerald-300 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
              <Bluetooth className="w-3.5 h-3.5 text-blue-400" />
              <span>Bluetooth: <strong>Ativo (Modo Sem Fio)</strong></span>
            </div>
          </div>

          <div className="text-[11px] font-mono text-green-300 bg-green-900/60 px-2 py-0.5 rounded border border-green-700/60">
            {connectionState?.scanCount ? `${connectionState.scanCount} bips realizados nesta sessão` : 'Aguardando bip físico...'}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 px-4 pt-2 gap-2 overflow-x-auto shrink-0">
          <button
            onClick={() => setActiveSubTab('usb')}
            className={`pb-2.5 px-3 font-bold text-xs flex items-center gap-2 border-b-2 transition cursor-pointer whitespace-nowrap ${
              activeSubTab === 'usb'
                ? 'border-green-600 text-green-700 dark:text-green-400 bg-white dark:bg-slate-900 rounded-t-lg shadow-xs'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Usb className="w-4 h-4 text-green-600" />
            <span>Entrada por Cabo USB</span>
          </button>

          <button
            onClick={() => setActiveSubTab('bluetooth')}
            className={`pb-2.5 px-3 font-bold text-xs flex items-center gap-2 border-b-2 transition cursor-pointer whitespace-nowrap ${
              activeSubTab === 'bluetooth'
                ? 'border-green-600 text-green-700 dark:text-green-400 bg-white dark:bg-slate-900 rounded-t-lg shadow-xs'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Bluetooth className="w-4 h-4 text-blue-500" />
            <span>Entrada por Bluetooth (Sem Fio)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('camera')}
            className={`pb-2.5 px-3 font-bold text-xs flex items-center gap-2 border-b-2 transition cursor-pointer whitespace-nowrap ${
              activeSubTab === 'camera'
                ? 'border-green-600 text-green-700 dark:text-green-400 bg-white dark:bg-slate-900 rounded-t-lg shadow-xs'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Camera className="w-4 h-4 text-amber-500" />
            <span>Câmera / Backup</span>
          </button>

          <button
            onClick={() => setActiveSubTab('settings')}
            className={`pb-2.5 px-3 font-bold text-xs flex items-center gap-2 border-b-2 transition cursor-pointer whitespace-nowrap ${
              activeSubTab === 'settings'
                ? 'border-green-600 text-green-700 dark:text-green-400 bg-white dark:bg-slate-900 rounded-t-lg shadow-xs'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Settings2 className="w-4 h-4 text-slate-500" />
            <span>Configurações do Bip</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          
          {/* ================= TAB 1: CABO USB ================= */}
          {activeSubTab === 'usb' && (
            <div className="space-y-4">
              
              {/* How it works banner */}
              <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl p-4 flex items-start gap-3">
                <div className="p-2 bg-emerald-600 text-white rounded-lg shrink-0">
                  <Usb className="w-5 h-5" />
                </div>
                <div className="text-xs text-emerald-950 dark:text-emerald-200 space-y-1">
                  <p className="font-bold text-sm">Leitor com Cabo USB Conectado</p>
                  <p>
                    O sistema reconhece automaticamente qualquer leitor de código de barras USB (Honeywell, Elgin, Zebra, Bematech, C3Tech, etc.).
                    <strong> Não requer instalação de drivers!</strong> Basta apontar para a embalagem e apertar o gatilho.
                  </p>
                </div>
              </div>

              {/* Live Test Box */}
              <div className={`p-4 rounded-xl border-2 transition-all ${
                isSuccessFlash 
                  ? 'bg-emerald-100 dark:bg-emerald-900/60 border-emerald-500 ring-4 ring-emerald-400/30' 
                  : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-emerald-600" />
                    <span>Teste de Bip com o Leitor USB</span>
                  </label>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Aponte o leitor e aperte o gatilho
                  </span>
                </div>

                <div className="relative">
                  <input
                    ref={testInputRef}
                    type="text"
                    placeholder="Bipe com o leitor USB aqui para testar..."
                    onKeyDown={handleTestInputKeyDown}
                    className="w-full pl-9 pr-24 py-3 bg-white dark:bg-slate-900 border-2 border-emerald-500 dark:border-emerald-600 rounded-xl text-sm font-mono font-bold text-slate-900 dark:text-slate-100 outline-none focus:ring-4 focus:ring-emerald-500/20"
                  />
                  <Barcode className="w-5 h-5 text-emerald-600 absolute left-3 top-3.5" />
                  <span className="absolute right-3 top-3 text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-1 rounded">
                    PRONTO
                  </span>
                </div>

                {/* Scanned result card */}
                {testScannedCode && (
                  <div className="mt-3 p-3 bg-white dark:bg-slate-900 border border-emerald-400 rounded-lg flex items-center justify-between animate-in fade-in">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      <div>
                        <div className="text-xs font-mono font-bold text-slate-900 dark:text-slate-100">
                          Código Capturado: <span className="text-emerald-600 text-sm">{testScannedCode}</span>
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Tamanho: {testScannedCode.length} dígitos | Status: Reconhecido com Sucesso
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleApplyScannedCode(testScannedCode)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer shadow-xs"
                    >
                      Usar no Sistema →
                    </button>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ================= TAB 2: BLUETOOTH ================= */}
          {activeSubTab === 'bluetooth' && (
            <div className="space-y-4">
              
              {/* Bluetooth Status Box */}
              <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-300 dark:border-blue-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-xs shrink-0">
                    <Bluetooth className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-blue-950 dark:text-blue-200 flex items-center gap-2">
                      <span>Leitor Sem Fio Bluetooth (Plug & Play)</span>
                      <span className="bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                        ATIVO & PRONTO
                      </span>
                    </h3>
                    <p className="text-xs text-blue-800 dark:text-blue-300 mt-0.5">
                      Pistolas sem fio conectadas via Bluetooth transmitem os bips de qualquer corredor da loja para o sistema em tempo real.
                    </p>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onConnectBluetooth}
                    disabled={isPairingBluetooth}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Radio className="w-4 h-4" />
                    <span>{isPairingBluetooth ? 'Buscando...' : 'Buscar Dispositivo Bluetooth'}</span>
                  </button>
                </div>
              </div>

              {bluetoothError && (
                <div className="p-3 bg-blue-100 dark:bg-blue-950/70 border border-blue-300 dark:border-blue-800 rounded-xl text-xs text-blue-900 dark:text-blue-200 flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Como funciona a conexão Bluetooth:</p>
                    <p className="text-[11px] mt-0.5 leading-relaxed">{bluetoothError}</p>
                  </div>
                </div>
              )}

              {/* Live Test Box for Bluetooth */}
              <div className={`p-4 rounded-xl border-2 transition-all ${
                isSuccessFlash 
                  ? 'bg-emerald-100 dark:bg-emerald-900/60 border-emerald-500 ring-4 ring-emerald-400/30' 
                  : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Bluetooth className="w-4 h-4 text-blue-600" />
                    <span>Teste de Bip com o Leitor Bluetooth (Sem Fio)</span>
                  </label>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Aponte a pistola sem fio e aperte o gatilho
                  </span>
                </div>

                <div className="relative">
                  <input
                    ref={testInputRef}
                    type="text"
                    placeholder="Bipe com o leitor Bluetooth aqui para testar..."
                    onKeyDown={handleTestInputKeyDown}
                    className="w-full pl-9 pr-24 py-3 bg-white dark:bg-slate-900 border-2 border-blue-500 dark:border-blue-600 rounded-xl text-sm font-mono font-bold text-slate-900 dark:text-slate-100 outline-none focus:ring-4 focus:ring-blue-500/20"
                  />
                  <Barcode className="w-5 h-5 text-blue-600 absolute left-3 top-3.5" />
                  <span className="absolute right-3 top-3 text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    PRONTO
                  </span>
                </div>

                {/* Scanned result card */}
                {testScannedCode && (
                  <div className="mt-3 p-3 bg-white dark:bg-slate-900 border border-emerald-400 rounded-lg flex items-center justify-between animate-in fade-in">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      <div>
                        <div className="text-xs font-mono font-bold text-slate-900 dark:text-slate-100">
                          Código Capturado via Bluetooth: <span className="text-emerald-600 text-sm">{testScannedCode}</span>
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Tamanho: {testScannedCode.length} dígitos | Status: Reconhecido com Sucesso
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleApplyScannedCode(testScannedCode)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer shadow-xs"
                    >
                      Usar no Sistema →
                    </button>
                  </div>
                )}
              </div>

              {/* Step by step guide */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Laptop className="w-4 h-4 text-blue-600" />
                  <span>Como conectar qualquer leitor sem fio (Passo a Passo)</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px]">1</span>
                    <p className="font-bold text-slate-900 dark:text-slate-100">1. Ligue o Leitor</p>
                    <p className="text-[11px] text-slate-500">Aperte o gatilho da pistola sem fio para ativar o Bluetooth.</p>
                  </div>

                  <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px]">2</span>
                    <p className="font-bold text-slate-900 dark:text-slate-100">2. Pareie com o Computador</p>
                    <p className="text-[11px] text-slate-500">Nas configurações de Bluetooth do Windows/Mac ou celular, selecione o leitor e clique em Conectar.</p>
                  </div>

                  <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px]">3</span>
                    <p className="font-bold text-slate-900 dark:text-slate-100">3. Bip Instantâneo</p>
                    <p className="text-[11px] text-slate-500">Pronto! Ao bipar qualquer código nos corredores da loja, o sistema reconhece automaticamente.</p>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ================= TAB 3: CÂMERA ================= */}
          {activeSubTab === 'camera' && (
            <div className="space-y-4">
              <div className="relative bg-slate-900 text-white rounded-xl h-44 flex flex-col items-center justify-center border-2 border-green-500 overflow-hidden shadow-inner">
                {/* Laser Line Animation */}
                <div className="absolute inset-x-0 h-0.5 bg-red-500 shadow-[0_0_12px_#ef4444] animate-pulse top-1/2 -translate-y-1/2" />

                <div className="text-center space-y-2 z-10 px-4">
                  <Camera className="w-8 h-8 text-green-400 mx-auto animate-pulse" />
                  <p className="text-xs text-slate-300 font-mono">
                    Aproxime a etiqueta com o código EAN-13 da câmera ou webcam
                  </p>
                </div>

                {/* Corner Markers */}
                <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-green-400" />
                <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-green-400" />
                <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-green-400" />
                <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-green-400" />
              </div>

              {/* Sample Quick Scan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Ou clique em um código para simular leitura:
                </label>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                  {PRESET_CATALOG.slice(0, 4).map((item) => (
                    <button
                      key={item.barcode}
                      type="button"
                      onClick={() => handleApplyScannedCode(item.barcode)}
                      className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-green-600 hover:bg-green-50 dark:hover:bg-green-950/40 text-left transition flex items-center justify-between group cursor-pointer"
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-green-700 truncate max-w-[180px]">
                          {item.name}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400">
                          EAN: {item.barcode}
                        </div>
                      </div>
                      <Barcode className="w-4 h-4 text-slate-400 group-hover:text-green-600 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 4: CONFIGURAÇÕES DO BIP ================= */}
          {activeSubTab === 'settings' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Preferências de Som e Comportamento do Leitor
                </h3>

                {/* Sound toggle */}
                <div className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2.5">
                    {config?.soundEnabled ? (
                      <Volume2 className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <VolumeX className="w-5 h-5 text-slate-400" />
                    )}
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Som de Confirmação de Leitura (Beep)</p>
                      <p className="text-[11px] text-slate-500">Emite o sinal sonoro clássico de caixa de mercado a cada código lido</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (onUpdateConfig && config) {
                        onUpdateConfig({ ...config, soundEnabled: !config.soundEnabled });
                        if (!config.soundEnabled) playScannerBeep();
                      }
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer border ${
                      config?.soundEnabled 
                        ? 'bg-emerald-600 text-white border-emerald-700' 
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-300'
                    }`}
                  >
                    {config?.soundEnabled ? 'Ativado' : 'Desativado'}
                  </button>
                </div>

                {/* Auto navigate toggle */}
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Detecção Global de Bip Físico</p>
                    <p className="text-[11px] text-slate-500">Permite bipar mercadorias de qualquer tela do sistema sem precisar clicar em nenhum campo</p>
                  </div>

                  <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-1 rounded">
                    Sempre Ativo
                  </span>
                </div>

              </div>
            </div>
          )}

          {/* Manual Type Fallback */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex gap-2">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && manualCode.trim()) {
                  handleApplyScannedCode(manualCode.trim());
                }
              }}
              placeholder="Ou digite o código de barras manualmente..."
              className="flex-1 px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-900 dark:text-slate-100 outline-none focus:ring-2 ring-green-500"
            />
            <button
              type="button"
              onClick={() => {
                if (manualCode.trim()) handleApplyScannedCode(manualCode.trim());
              }}
              className="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg text-xs font-bold cursor-pointer transition shadow-xs"
            >
              Confirmar
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
