import { useEffect, useRef, useState, useCallback } from 'react';
import { playScannerBeep } from '../utils/sound';
import { loadScannerConfig, ScannerConfig, ScannerConnectionState } from '../utils/scannerManager';

export interface UseHardwareScannerOptions {
  onScan?: (barcode: string, rawEvent?: KeyboardEvent) => void;
  enabled?: boolean;
}

export function useHardwareBarcodeScanner(options?: UseHardwareScannerOptions) {
  const [config, setConfig] = useState<ScannerConfig>(loadScannerConfig);
  const [connectionState, setConnectionState] = useState<ScannerConnectionState>({
    isUsbActive: true, // USB / HID keyboard wedge is always passively active in browser
    isBluetoothConnected: false,
    bluetoothDeviceName: null,
    lastScannedCode: null,
    lastScannedTime: null,
    scanCount: 0,
  });

  const [bluetoothError, setBluetoothError] = useState<string | null>(null);
  const [isPairingBluetooth, setIsPairingBluetooth] = useState<boolean>(false);

  const bufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);
  const bluetoothDeviceRef = useRef<any>(null);

  const onScanRef = useRef(options?.onScan);
  useEffect(() => {
    onScanRef.current = options?.onScan;
  }, [options?.onScan]);

  const enabled = options?.enabled !== false;

  const handleBarcodeDetected = useCallback((scannedCode: string, e?: KeyboardEvent) => {
    const trimmed = scannedCode.trim();
    if (trimmed.length < config.minBarcodeLength) return;

    if (config.soundEnabled) {
      playScannerBeep();
    }

    setConnectionState(prev => ({
      ...prev,
      lastScannedCode: trimmed,
      lastScannedTime: new Date(),
      scanCount: prev.scanCount + 1,
    }));

    // Trigger custom window event so any screen can react if needed
    window.dispatchEvent(new CustomEvent('validedata:barcode-scanned', { detail: { barcode: trimmed } }));

    if (onScanRef.current) {
      onScanRef.current(trimmed, e);
    }
  }, [config.minBarcodeLength, config.soundEnabled]);

  // Global Keydown listener for USB & Bluetooth HID scanners
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const now = Date.now();
      const timeDiff = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      // Ignore single modifier keys
      if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab'].includes(e.key)) {
        return;
      }

      // If time between keystrokes is too long, reset the buffer
      // (physical scanners send characters with < 50ms intervals)
      if (timeDiff > config.maxKeyIntervalMs && bufferRef.current.length > 0) {
        // If the buffer was already long and suddenly stopped, it might be a scanner without Enter
        if (bufferRef.current.length >= 8 && bufferRef.current.length <= 14 && /^\d+$/.test(bufferRef.current)) {
          const finishedCode = bufferRef.current;
          bufferRef.current = '';
          handleBarcodeDetected(finishedCode, e);
          return;
        }
        bufferRef.current = '';
      }

      if (e.key === 'Enter') {
        if (bufferRef.current.length >= config.minBarcodeLength) {
          const finishedCode = bufferRef.current;
          bufferRef.current = '';
          
          // Prevent form submit if it was a scanner blast
          if (timeDiff < config.maxKeyIntervalMs || finishedCode.length >= 8) {
            e.preventDefault();
            e.stopPropagation();
          }

          handleBarcodeDetected(finishedCode, e);
        } else {
          bufferRef.current = '';
        }
        return;
      }

      // Append standard characters (numbers, letters)
      if (e.key.length === 1) {
        bufferRef.current += e.key;

        // Auto-detect full EAN-13 (13 digits) if received in a single ultra-fast burst
        if (bufferRef.current.length === 13 && /^\d{13}$/.test(bufferRef.current)) {
          // If next key is not coming within 30ms, we can dispatch
          setTimeout(() => {
            if (bufferRef.current.length === 13) {
              const finishedCode = bufferRef.current;
              bufferRef.current = '';
              handleBarcodeDetected(finishedCode, e);
            }
          }, 35);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [enabled, config.maxKeyIntervalMs, config.minBarcodeLength, handleBarcodeDetected]);

  // Web Bluetooth API Integration
  const connectBluetoothScanner = async () => {
    setIsPairingBluetooth(true);
    setBluetoothError(null);

    const nav = navigator as any;
    if (!nav.bluetooth) {
      // Browser doesn't support Web Bluetooth API or is in insecure context
      // Note: Bluetooth scanners also work 100% out of the box via standard Bluetooth HID keyboard pairing!
      setIsPairingBluetooth(false);
      setBluetoothError(
        'Este navegador não suporta Web Bluetooth direta, mas seu leitor Bluetooth funciona perfeitamente pareando nas configurações de Bluetooth do computador/celular (Modo Teclado HID)!'
      );
      return false;
    }

    try {
      const device = await nav.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          'generic_access',
          'battery_service',
        ],
      });

      if (device) {
        bluetoothDeviceRef.current = device;
        setConnectionState(prev => ({
          ...prev,
          isBluetoothConnected: true,
          bluetoothDeviceName: device.name || 'Leitor Bluetooth Sem Fio',
        }));

        device.addEventListener('gattserverdisconnected', () => {
          setConnectionState(prev => ({
            ...prev,
            isBluetoothConnected: false,
            bluetoothDeviceName: null,
          }));
        });

        setIsPairingBluetooth(false);
        return true;
      }
    } catch (err: any) {
      console.warn('Bluetooth pairing note:', err);
      setIsPairingBluetooth(false);
      if (err.name === 'NotFoundError') {
        // User just closed/cancelled the chooser dialog
        setBluetoothError(null);
      } else {
        setBluetoothError('Dica: Seu leitor Bluetooth conecta diretamente no Bluetooth do seu computador (Windows/Mac/Celular). Ao parear com o computador, o sistema já reconhece os bips instantaneamente!');
      }
      return false;
    }
    setIsPairingBluetooth(false);
    return false;
  };

  const disconnectBluetoothScanner = () => {
    if (bluetoothDeviceRef.current && bluetoothDeviceRef.current.gatt && bluetoothDeviceRef.current.gatt.connected) {
      bluetoothDeviceRef.current.gatt.disconnect();
    }
    bluetoothDeviceRef.current = null;
    setConnectionState(prev => ({
      ...prev,
      isBluetoothConnected: false,
      bluetoothDeviceName: null,
    }));
  };

  return {
    connectionState,
    config,
    setConfig,
    connectBluetoothScanner,
    disconnectBluetoothScanner,
    isPairingBluetooth,
    bluetoothError,
    setBluetoothError,
    triggerManualScan: handleBarcodeDetected,
  };
}
