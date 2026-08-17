// Utility and state manager for physical USB cable and Bluetooth barcode scanners
import { playScannerBeep, playSuccessBeep } from './sound';

export interface ScannerConnectionState {
  isUsbActive: boolean;
  isBluetoothConnected: boolean;
  bluetoothDeviceName: string | null;
  lastScannedCode: string | null;
  lastScannedTime: Date | null;
  scanCount: number;
}

export type ScanActionPreference = 'auto' | 'register' | 'movement' | 'query';

const SCANNER_CONFIG_KEY = 'validedata_scanner_config';

export interface ScannerConfig {
  soundEnabled: boolean;
  autoNavigate: boolean;
  actionPreference: ScanActionPreference;
  minBarcodeLength: number;
  maxKeyIntervalMs: number;
}

export const DEFAULT_SCANNER_CONFIG: ScannerConfig = {
  soundEnabled: true,
  autoNavigate: true,
  actionPreference: 'auto',
  minBarcodeLength: 3,
  maxKeyIntervalMs: 65, // Max ms between chars to be recognized as physical scanner
};

export function loadScannerConfig(): ScannerConfig {
  try {
    const saved = localStorage.getItem(SCANNER_CONFIG_KEY);
    if (saved) return { ...DEFAULT_SCANNER_CONFIG, ...JSON.parse(saved) };
  } catch (e) {
    console.warn('Error loading scanner config', e);
  }
  return DEFAULT_SCANNER_CONFIG;
}

export function saveScannerConfig(config: ScannerConfig): void {
  try {
    localStorage.setItem(SCANNER_CONFIG_KEY, JSON.stringify(config));
  } catch (e) {
    console.warn('Error saving scanner config', e);
  }
}
