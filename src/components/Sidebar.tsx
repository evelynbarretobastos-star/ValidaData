import React, { useState } from 'react';
import { SystemUser, ProductBatch } from '../types';
import { getBatchStatusState } from '../utils/formatters';
import { ScannerConnectionState } from '../utils/scannerManager';
import { 
  BarChart3, 
  PackagePlus, 
  ArrowLeftRight, 
  ShieldCheck, 
  Users, 
  FileText, 
  LogOut, 
  AlertTriangle, 
  Scan, 
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Usb,
  Bluetooth
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: SystemUser;
  onSwitchUserClick: () => void;
  batches: ProductBatch[];
  onOpenQuickScan: () => void;
  connectionState?: ScannerConnectionState;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onSwitchUserClick,
  batches,
  onOpenQuickScan,
  connectionState,
}) => {
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  // Calculate items expiring in <= 7 days (or already expired)
  const criticalCount = batches.filter(b => {
    const state = getBatchStatusState(b.expiryDate);
    return state === 'CRITICAL' || state === 'EXPIRED';
  }).length;

  const tabs = [
    { id: 'dashboard', label: 'Painel Principal', icon: BarChart3, badge: null },
    { id: 'register', label: 'Cadastro de Validade', icon: PackagePlus, badge: null },
    { id: 'movements', label: 'Ações e Baixas', icon: ArrowLeftRight, badge: null },
    { id: 'supervisor', label: 'Decisões do Supervisor', icon: ShieldCheck, badge: 'Supervisor' },
    { id: 'users', label: 'Gestão de Usuários', icon: Users, badge: 'Restrito' },
    { id: 'audit', label: 'Histórico e Relatórios', icon: FileText, badge: null },
  ];

  const handleSelectTab = (tabId: string) => {
    setActiveTab(tabId);
    setIsMobileOpen(false); // Close mobile drawer on tab select so it disappears
  };

  return (
    <>
      {/* ========================================================= */}
      {/* MOBILE TOP NAVIGATION BAR (Visible on small screens < md)  */}
      {/* ========================================================= */}
      <div className="md:hidden sticky top-0 z-40 bg-green-800 text-white border-b-2 border-green-900 shadow-md px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="p-2 bg-green-700 hover:bg-green-600 rounded-lg text-white transition cursor-pointer flex items-center justify-center active:scale-95"
            title={isMobileOpen ? "Fechar Menu" : "Abrir Menu"}
            aria-label="Alternar Menu Lateral"
          >
            {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          {/* Mobile Logo: Valide Data */}
          <div 
            onClick={() => handleSelectTab('dashboard')} 
            className="flex items-center gap-2 cursor-pointer select-none"
          >
            <div className="bg-white text-green-800 px-2.5 py-1 rounded-md font-black text-base shadow-xs flex items-center gap-1">
              <span className="text-green-700 font-extrabold tracking-tighter">Valide</span>
              <span className="text-slate-900 font-black">Data</span>
            </div>
          </div>
        </div>

        {/* Mobile Header Quick Actions */}
        <div className="flex items-center gap-2">
          {criticalCount > 0 && (
            <button
              onClick={() => handleSelectTab('dashboard')}
              className="bg-red-600 hover:bg-red-700 text-white p-1.5 rounded-full text-xs font-bold animate-pulse flex items-center gap-1 px-2.5 cursor-pointer shadow-xs"
              title={`${criticalCount} produtos com validade crítica`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span className="text-[11px] font-extrabold">{criticalCount}</span>
            </button>
          )}

          <button
            onClick={onOpenQuickScan}
            className="bg-green-700 hover:bg-green-600 text-white p-2 rounded-lg border border-green-600 transition cursor-pointer"
            title="Leitor EAN"
          >
            <Scan className="w-4 h-4 text-green-200" />
          </button>

          <div 
            onClick={onSwitchUserClick}
            className="w-8 h-8 rounded-full bg-green-600 border border-white/60 flex items-center justify-center font-bold text-xs cursor-pointer shadow-xs"
            title={`Usuário: ${currentUser.name}`}
          >
            {currentUser.name.substring(0, 2).toUpperCase()}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MOBILE DRAWER BACKDROP (Hides menu when clicked)          */}
      {/* ========================================================= */}
      {isMobileOpen && (
        <div 
          onClick={() => setIsMobileOpen(false)} 
          className="md:hidden fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 transition-opacity"
        />
      )}

      {/* ========================================================= */}
      {/* VERTICAL SIDEBAR CONTAINER (Desktop + Mobile Slide Drawer) */}
      {/* ========================================================= */}
      <aside className={`
        fixed md:sticky top-0 left-0 z-50 md:z-30 h-screen bg-green-800 text-white border-r-2 border-green-900 shadow-xl font-sans flex flex-col justify-between transition-all duration-300
        ${isMobileOpen ? 'translate-x-0 w-72' : '-translate-x-full md:translate-x-0'}
        ${isCollapsed ? 'md:w-20' : 'md:w-64'}
      `}>
        {/* Top Header & Brand */}
        <div className="p-4 space-y-4">
          
          {/* Logo & Mobile Close Button */}
          <div className="flex items-center justify-between pb-3 border-b border-green-700">
            <div 
              onClick={() => handleSelectTab('dashboard')} 
              className="flex items-center gap-2.5 cursor-pointer select-none overflow-hidden"
            >
              <div className="bg-white text-green-800 px-3 py-1.5 rounded-lg font-black text-lg shadow-sm flex items-center shrink-0 border border-white/40">
                <span className="text-green-700 font-extrabold tracking-tighter">Valide</span>
                <span className="text-slate-900 font-black ml-0.5">Data</span>
              </div>
            </div>

            {/* Close Mobile Drawer Button */}
            <button
              onClick={() => setIsMobileOpen(false)}
              className="md:hidden p-1.5 text-green-200 hover:text-white hover:bg-green-700 rounded-lg transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>



          {/* Critical Expiry Alert Banner Button */}
          {criticalCount > 0 && (
            <button
              onClick={() => handleSelectTab('dashboard')}
              className={`w-full bg-red-600 hover:bg-red-700 text-white p-2.5 rounded-xl text-xs font-bold transition cursor-pointer shadow-sm flex items-center gap-2 animate-pulse ${
                isCollapsed && !isMobileOpen ? 'justify-center px-0' : 'justify-between'
              }`}
              title={`${criticalCount} produtos vencendo em breve`}
            >
              <div className="flex items-center gap-2 shrink-0">
                <AlertTriangle className="w-4 h-4 text-white" />
                {(!isCollapsed || isMobileOpen) && <span>Vencimento Próximo!</span>}
              </div>
              {(!isCollapsed || isMobileOpen) && (
                <span className="bg-white text-red-700 px-2 py-0.5 rounded-full text-[10px] font-black font-mono">
                  {criticalCount}
                </span>
              )}
            </button>
          )}

          {/* Quick Scanner & Connection Hub Button */}
          <button
            onClick={() => {
              setIsMobileOpen(false);
              onOpenQuickScan();
            }}
            className={`w-full bg-green-700 hover:bg-green-600 text-white p-2.5 rounded-xl text-xs font-bold transition cursor-pointer border border-green-600 flex items-center justify-between shadow-xs group ${
              isCollapsed && !isMobileOpen ? 'justify-center px-0' : 'px-3'
            }`}
            title="Central de Conexão do Leitor (Cabo USB & Bluetooth)"
          >
            <div className="flex items-center gap-2.5">
              <Scan className="w-4 h-4 text-emerald-300 shrink-0 group-hover:scale-110 transition-transform" />
              {(!isCollapsed || isMobileOpen) && (
                <div className="text-left">
                  <div className="leading-tight">Leitor de Cód. Barras</div>
                  <div className="text-[10px] text-emerald-300 font-normal flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Cabo & Bluetooth</span>
                  </div>
                </div>
              )}
            </div>
            {(!isCollapsed || isMobileOpen) && (
              <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                <Usb className="w-3 h-3 text-emerald-300" />
                <Bluetooth className="w-3 h-3 text-blue-300" />
              </div>
            )}
          </button>

          {/* Navigation Menu Links */}
          <nav className="space-y-1 pt-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => handleSelectTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition cursor-pointer select-none ${
                    isCollapsed && !isMobileOpen ? 'justify-center px-0' : 'justify-between'
                  } ${
                    isActive
                      ? 'bg-white text-green-900 font-bold shadow-md ring-2 ring-green-400'
                      : 'text-green-100 hover:bg-green-700 hover:text-white'
                  }`}
                  title={tab.label}
                >
                  <div className="flex items-center gap-3 shrink-0">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-green-800' : 'text-green-200'}`} />
                    {(!isCollapsed || isMobileOpen) && (
                      <span className="truncate">{tab.label}</span>
                    )}
                  </div>

                  {(!isCollapsed || isMobileOpen) && tab.badge && (
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase shrink-0 ${
                      isActive ? 'bg-amber-500 text-slate-950 font-black' : 'bg-green-900 text-yellow-300 border border-green-700'
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: User Info Card & Collapse Desktop Bar Toggle */}
        <div className="p-3 border-t border-green-700/80 space-y-2 bg-green-900/40">

          {/* User Profile Card */}
          <div className={`p-2.5 rounded-xl bg-green-900/80 border border-green-700 flex items-center justify-between gap-2 ${
            isCollapsed && !isMobileOpen ? 'flex-col items-center p-2' : ''
          }`}>
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-green-500 border border-white text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                {currentUser.name.substring(0, 2).toUpperCase()}
              </div>
              {(!isCollapsed || isMobileOpen) && (
                <div className="min-w-0 text-left">
                  <p className="text-xs font-bold text-white truncate leading-tight">{currentUser.name}</p>
                  <p className="text-[10px] text-green-200 truncate leading-tight mt-0.5">
                    {currentUser.role === 'SUPERVISOR' ? 'Supervisor' : 'Operador'}
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={onSwitchUserClick}
              className="p-1.5 bg-green-800 hover:bg-green-700 text-green-200 hover:text-white rounded-lg transition cursor-pointer shrink-0"
              title="Trocar Usuário / Fazer Login"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Desktop Collapse Toggle Button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:flex w-full p-2 bg-green-800/80 hover:bg-green-700 text-green-200 hover:text-white rounded-lg text-xs font-medium items-center justify-center gap-2 transition cursor-pointer border border-green-700"
            title={isCollapsed ? "Expandir Menu Lateral" : "Recolher Menu Lateral"}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4 text-white" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4 text-white" />
                <span>Ocultar / Recolher</span>
              </>
            )}
          </button>
        </div>

      </aside>
    </>
  );
};
