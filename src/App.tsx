import React, { useState, useEffect, useCallback } from 'react';
import { SystemUser, ProductBatch, MovementLog, MovementType, SupervisorDecision } from './types';
import { loadUsers, saveUsers, loadBatches, saveBatches, loadLogs, saveLogs, loadCurrentUserId, saveCurrentUserId, resetToDefaults } from './utils/storage';
import { INITIAL_USERS } from './data/initialData';
import { Sidebar } from './components/Sidebar';
import { LoginModal } from './components/LoginModal';
import { DashboardTab } from './components/DashboardTab';
import { ProductFormTab } from './components/ProductFormTab';
import { MovementsTab } from './components/MovementsTab';
import { SupervisorTab } from './components/SupervisorTab';
import { UsersTab } from './components/UsersTab';
import { AuditTab } from './components/AuditTab';
import { BarcodeScannerModal } from './components/BarcodeScannerModal';
import { QuickScannedActionHUD } from './components/QuickScannedActionHUD';
import { DiscountLabelModal } from './components/DiscountLabelModal';
import { calculateEffectivePrice } from './utils/formatters';
import { useHardwareBarcodeScanner } from './hooks/useHardwareBarcodeScanner';

export default function App() {
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [batches, setBatches] = useState<ProductBatch[]>([]);
  const [logs, setLogs] = useState<MovementLog[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Modals & Context States
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [requireSupervisorOnly, setRequireSupervisorOnly] = useState<boolean>(false);
  const [isScannerModalOpen, setIsScannerModalOpen] = useState<boolean>(false);
  const [onScannerResultCallback, setOnScannerResultCallback] = useState<((code: string) => void) | null>(null);

  const [isLabelModalOpen, setIsLabelModalOpen] = useState<boolean>(false);
  const [selectedLabelBatch, setSelectedLabelBatch] = useState<ProductBatch | null>(null);

  const [selectedBatchForMovement, setSelectedBatchForMovement] = useState<ProductBatch | null>(null);
  const [registerBarcodePrefill, setRegisterBarcodePrefill] = useState<string>('');
  const [quickScannedHUDCode, setQuickScannedHUDCode] = useState<string | null>(null);

  // Hardware Scanner Integration (USB Cable & Bluetooth HID / Web Bluetooth)
  const handleGlobalBarcodeScan = useCallback((scannedCode: string) => {
    if (isScannerModalOpen && onScannerResultCallback) {
      onScannerResultCallback(scannedCode);
      setIsScannerModalOpen(false);
      return;
    }

    if (activeTab === 'register') {
      setRegisterBarcodePrefill(scannedCode);
      return;
    }

    // If on another tab, show the Quick Action HUD
    setQuickScannedHUDCode(scannedCode);
  }, [isScannerModalOpen, onScannerResultCallback, activeTab]);

  const {
    connectionState,
    config: scannerConfig,
    setConfig: setScannerConfig,
    connectBluetoothScanner,
    disconnectBluetoothScanner,
    isPairingBluetooth,
    bluetoothError,
  } = useHardwareBarcodeScanner({
    onScan: handleGlobalBarcodeScan,
    enabled: true,
  });

  // Initialize data on mount
  useEffect(() => {
    const loadedUsers = loadUsers();
    const loadedBatches = loadBatches();
    const loadedLogs = loadLogs();
    const loadedUserId = loadCurrentUserId();

    setUsers(loadedUsers);
    setBatches(loadedBatches);
    setLogs(loadedLogs);
    setCurrentUserId(loadedUserId || loadedUsers[0]?.id || 'usr-1');
  }, []);

  const currentUser = users.find(u => u.id === currentUserId) || users[0] || {
    id: 'usr-1',
    code: 'SUP-001',
    name: 'Supervisor',
    role: 'SUPERVISOR',
    pin: '1234',
    active: true,
  };

  // Switch tab with access check
  const handleTabChange = (tabId: string) => {
    // If tab is restricted and user is not supervisor, ask for supervisor login
    if ((tabId === 'supervisor' || tabId === 'users') && currentUser.role !== 'SUPERVISOR') {
      setRequireSupervisorOnly(true);
      setIsLoginModalOpen(true);
    }
    setActiveTab(tabId);
  };

  // User Selection
  const handleSelectUser = (selectedUser: SystemUser) => {
    setCurrentUserId(selectedUser.id);
    saveCurrentUserId(selectedUser.id);
    setIsLoginModalOpen(false);
    setRequireSupervisorOnly(false);
  };

  // Add New Product Batch
  const handleSaveBatch = (newBatchData: Omit<ProductBatch, 'id' | 'createdAt' | 'createdUserId' | 'createdUserName'>) => {
    const newBatch: ProductBatch = {
      ...newBatchData,
      id: `batch-${Date.now()}`,
      createdUserId: currentUser.id,
      createdUserName: currentUser.name,
      createdAt: new Date().toISOString(),
    };

    const updated = [newBatch, ...batches];
    setBatches(updated);
    saveBatches(updated);
  };

  // Record Movement / Action (Retirado, Vendido, Promoção, Descartado)
  const handleRecordMovement = (
    batchId: string,
    movementType: MovementType,
    quantityMoved: number,
    reason: string,
    notes?: string
  ) => {
    const batchIndex = batches.findIndex(b => b.id === batchId);
    if (batchIndex === -1) return;

    const batch = batches[batchIndex];
    const unitPrice = calculateEffectivePrice(batch);
    const totalValueAffected = unitPrice * quantityMoved;

    // Create log entry
    const newLog: MovementLog = {
      id: `log-${Date.now()}`,
      batchId: batch.id,
      barcode: batch.barcode,
      productName: batch.name,
      batchNumber: batch.batchNumber,
      movementType,
      quantity: quantityMoved,
      unit: batch.unit,
      reason,
      unitPriceAtTime: unitPrice,
      totalValueAffected,
      performedByUserId: currentUser.id,
      performedByUserName: currentUser.name,
      performedByUserRole: currentUser.role,
      timestamp: new Date().toISOString(),
      notes,
    };

    // Update batch quantity if removed, sold, or discarded
    let updatedBatches = [...batches];
    if (movementType === 'RETIRADO' || movementType === 'VENDIDO' || movementType === 'DESCARTADO') {
      const newQty = Math.max(0, batch.quantity - quantityMoved);
      updatedBatches[batchIndex] = {
        ...batch,
        quantity: newQty,
      };
    }

    const updatedLogs = [newLog, ...logs];

    setBatches(updatedBatches);
    saveBatches(updatedBatches);

    setLogs(updatedLogs);
    saveLogs(updatedLogs);
  };

  // Supervisor Decision (Discount, 2 por 1, Clearance, Discard)
  const handleApplySupervisorDecision = (batchId: string, decision: SupervisorDecision) => {
    const updatedBatches = batches.map(b => {
      if (b.id === batchId) {
        return {
          ...b,
          supervisorDecision: decision,
        };
      }
      return b;
    });

    setBatches(updatedBatches);
    saveBatches(updatedBatches);
  };

  const handleRemoveSupervisorDecision = (batchId: string) => {
    const updatedBatches = batches.map(b => {
      if (b.id === batchId) {
        const { supervisorDecision, ...rest } = b;
        return rest as ProductBatch;
      }
      return b;
    });

    setBatches(updatedBatches);
    saveBatches(updatedBatches);
  };

  // User Management
  const handleAddUser = (newUser: Omit<SystemUser, 'id'>) => {
    const created: SystemUser = {
      ...newUser,
      id: `usr-${Date.now()}`,
    };
    const updated = [...users, created];
    setUsers(updated);
    saveUsers(updated);
  };

  const handleToggleUserActive = (userId: string) => {
    const updated = users.map(u => u.id === userId ? { ...u, active: !u.active } : u);
    setUsers(updated);
    saveUsers(updated);
  };

  const handleUpdateUserPin = (userId: string, newPin: string) => {
    const updated = users.map(u => u.id === userId ? { ...u, pin: newPin } : u);
    setUsers(updated);
    saveUsers(updated);
  };

  const handleDeleteUser = (userId: string) => {
    if (users.length <= 1) {
      alert('Não é possível remover o único usuário do sistema.');
      return;
    }
    const targetUser = users.find(u => u.id === userId);
    const supervisors = users.filter(u => u.role === 'SUPERVISOR' && u.id !== userId);
    if (targetUser?.role === 'SUPERVISOR' && supervisors.length === 0) {
      alert('Não é possível remover o único Supervisor do sistema. Cadastre outro Supervisor antes.');
      return;
    }

    const updated = users.filter(u => u.id !== userId);
    setUsers(updated);
    saveUsers(updated);

    if (currentUserId === userId && updated.length > 0) {
      setCurrentUserId(updated[0].id);
      saveCurrentUserId(updated[0].id);
    }
  };

  // Quick Action Handlers
  const handleOpenMovementForBatch = (batch: ProductBatch) => {
    setSelectedBatchForMovement(batch);
    setActiveTab('movements');
  };

  const handleOpenSupervisorForBatch = (batch: ProductBatch) => {
    if (currentUser.role !== 'SUPERVISOR') {
      setRequireSupervisorOnly(true);
      setIsLoginModalOpen(true);
    }
    setActiveTab('supervisor');
  };

  const handleOpenPrintLabel = (batch: ProductBatch) => {
    setSelectedLabelBatch(batch);
    setIsLabelModalOpen(true);
  };

  const handleTriggerScannerModal = (onScan: (scannedCode: string) => void) => {
    setOnScannerResultCallback(() => onScan);
    setIsScannerModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans flex flex-col md:flex-row selection:bg-green-500 selection:text-white">
      
      {/* Vertical Side Navigation Bar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        currentUser={currentUser}
        onSwitchUserClick={() => {
          setRequireSupervisorOnly(false);
          setIsLoginModalOpen(true);
        }}
        batches={batches}
        connectionState={connectionState}
        onOpenQuickScan={() => {
          handleTriggerScannerModal((code) => {
            // Find batch and open movement
            const found = batches.find(b => b.barcode === code);
            if (found) {
              handleOpenMovementForBatch(found);
            } else {
              setRegisterBarcodePrefill(code);
              setActiveTab('register');
            }
          });
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 p-2 sm:p-4 md:p-6 pb-12 overflow-x-hidden">
        {activeTab === 'dashboard' && (
          <DashboardTab
            batches={batches}
            currentUser={currentUser}
            onOpenMovementModal={handleOpenMovementForBatch}
            onOpenSupervisorModal={handleOpenSupervisorForBatch}
            onOpenPrintLabelModal={handleOpenPrintLabel}
            onNavigateToRegister={() => setActiveTab('register')}
            onOpenScannerModal={() => setIsScannerModalOpen(true)}
          />
        )}

        {activeTab === 'register' && (
          <ProductFormTab
            currentUser={currentUser}
            onSaveBatch={handleSaveBatch}
            onOpenScannerModal={handleTriggerScannerModal}
            initialBarcode={registerBarcodePrefill}
          />
        )}

        {activeTab === 'movements' && (
          <MovementsTab
            batches={batches}
            logs={logs}
            currentUser={currentUser}
            onRecordMovement={handleRecordMovement}
            selectedBatchForAction={selectedBatchForMovement}
            onClearSelectedBatch={() => setSelectedBatchForMovement(null)}
          />
        )}

        {activeTab === 'supervisor' && (
          <SupervisorTab
            batches={batches}
            currentUser={currentUser}
            onApplySupervisorDecision={handleApplySupervisorDecision}
            onRemoveSupervisorDecision={handleRemoveSupervisorDecision}
            onRequestSupervisorLogin={() => {
              setRequireSupervisorOnly(true);
              setIsLoginModalOpen(true);
            }}
            onOpenPrintLabelModal={handleOpenPrintLabel}
          />
        )}

        {activeTab === 'users' && (
          <UsersTab
            users={users}
            currentUser={currentUser}
            onAddUser={handleAddUser}
            onToggleUserActive={handleToggleUserActive}
            onUpdateUserPin={handleUpdateUserPin}
            onDeleteUser={handleDeleteUser}
            onRequestSupervisorLogin={() => {
              setRequireSupervisorOnly(true);
              setIsLoginModalOpen(true);
            }}
          />
        )}

        {activeTab === 'audit' && (
          <AuditTab
            logs={logs}
            batches={batches}
            currentUser={currentUser}
          />
        )}
      </main>

      {/* Modals & Quick Action HUD */}
      <QuickScannedActionHUD
        scannedCode={quickScannedHUDCode}
        batches={batches}
        onClose={() => setQuickScannedHUDCode(null)}
        onNavigateToRegisterWithCode={(code) => {
          setRegisterBarcodePrefill(code);
          setActiveTab('register');
        }}
        onOpenMovementForBatch={handleOpenMovementForBatch}
        onOpenPrintLabel={handleOpenPrintLabel}
      />

      <LoginModal
        users={users}
        currentUser={currentUser}
        onSelectUser={handleSelectUser}
        isOpen={isLoginModalOpen}
        onClose={() => {
          setIsLoginModalOpen(false);
          setRequireSupervisorOnly(false);
        }}
        requireSupervisorOnly={requireSupervisorOnly}
        titleOverride={requireSupervisorOnly ? 'Autenticação de Supervisor Requerida' : undefined}
      />

      <BarcodeScannerModal
        isOpen={isScannerModalOpen}
        onClose={() => setIsScannerModalOpen(false)}
        onScanResult={(code) => {
          if (onScannerResultCallback) {
            onScannerResultCallback(code);
          }
        }}
        connectionState={connectionState}
        onConnectBluetooth={connectBluetoothScanner}
        onDisconnectBluetooth={disconnectBluetoothScanner}
        isPairingBluetooth={isPairingBluetooth}
        bluetoothError={bluetoothError}
        config={scannerConfig}
        onUpdateConfig={setScannerConfig}
      />

      <DiscountLabelModal
        batch={selectedLabelBatch}
        isOpen={isLabelModalOpen}
        onClose={() => {
          setIsLabelModalOpen(false);
          setSelectedLabelBatch(null);
        }}
      />

    </div>
  );
}
