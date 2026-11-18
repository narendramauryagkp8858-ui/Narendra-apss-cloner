import React, { useState, useRef, useEffect } from 'react';
import { SecuritySettings, ClonedApp } from '../types';
import {
  Lock,
  Unlock,
  Fingerprint,
  Grid,
  Calculator as CalcIcon,
  ShieldAlert,
  CheckCircle,
  Eye,
  EyeOff,
  Settings,
  X,
  AlertCircle,
} from 'lucide-react';

interface AppLockerModalProps {
  isOpen: boolean;
  mode: 'unlock' | 'settings'; // unlock gatekeeper vs configuring security
  onClose: () => void;
  security: SecuritySettings;
  onUpdateSecurity: (newSettings: SecuritySettings) => void;
  clones: ClonedApp[];
  targetCloneName?: string;
  onUnlocked: () => void;
}

export const AppLockerModal: React.FC<AppLockerModalProps> = ({
  isOpen,
  mode,
  onClose,
  security,
  onUpdateSecurity,
  clones,
  targetCloneName,
  onUnlocked,
}) => {
  // Unlock states
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<boolean>(false);
  const [activeLockMethod, setActiveLockMethod] = useState<'pin' | 'pattern' | 'biometric'>(
    security.lockType
  );
  const [isBiometricScanning, setIsBiometricScanning] = useState<boolean>(false);
  const [biometricSuccess, setBiometricSuccess] = useState<boolean>(false);

  // Pattern lock states
  const [patternDots, setPatternDots] = useState<number[]>([]);
  const [isDrawingPattern, setIsDrawingPattern] = useState<boolean>(false);
  const [patternError, setPatternError] = useState<boolean>(false);

  // Calculator Disguise states
  const [calcDisplay, setCalcDisplay] = useState<string>('0');
  const [calcSequence, setCalcSequence] = useState<string>('');

  // Settings tab states
  const [newPin, setNewPin] = useState<string>(security.pinCode);
  const [selectedDisguise, setSelectedDisguise] = useState(security.stealthDisguise);
  const [activeTab, setActiveTab] = useState<'methods' | 'apps' | 'disguise'>('methods');

  useEffect(() => {
    if (isOpen) {
      setPinInput('');
      setPinError(false);
      setPatternDots([]);
      setPatternError(false);
      setIsBiometricScanning(false);
      setBiometricSuccess(false);
      setCalcDisplay('0');
      setCalcSequence('');
      setActiveLockMethod(security.lockType);
    }
  }, [isOpen, security.lockType]);

  if (!isOpen) return null;

  // Handle PIN Keypad press
  const handlePinDigit = (digit: string) => {
    setPinError(false);
    if (pinInput.length < 6) {
      const updated = pinInput + digit;
      setPinInput(updated);

      // Auto submit on matching length
      if (updated === security.pinCode) {
        setTimeout(() => {
          onUnlocked();
        }, 150);
      } else if (updated.length >= 4 && updated.length === security.pinCode.length) {
        setPinError(true);
        setTimeout(() => setPinInput(''), 600);
      }
    }
  };

  const handlePinDelete = () => {
    setPinInput((prev) => prev.slice(0, -1));
    setPinError(false);
  };

  // Handle Pattern Lock logic
  const handleDotClick = (index: number) => {
    if (!patternDots.includes(index)) {
      const nextPattern = [...patternDots, index];
      setPatternDots(nextPattern);

      // Compare if matches security.patternPath
      const targetPath = security.patternPath || [0, 1, 2, 5, 8];
      if (nextPattern.length === targetPath.length) {
        const matches = nextPattern.every((val, i) => val === targetPath[i]);
        if (matches) {
          setTimeout(() => onUnlocked(), 200);
        } else {
          setPatternError(true);
          setTimeout(() => {
            setPatternDots([]);
            setPatternError(false);
          }, 800);
        }
      }
    }
  };

  // Handle Biometric scan
  const handleBiometricTrigger = () => {
    setIsBiometricScanning(true);
    setTimeout(() => {
      setIsBiometricScanning(false);
      setBiometricSuccess(true);
      setTimeout(() => {
        onUnlocked();
      }, 400);
    }, 900);
  };

  // Calculator Disguise input
  const handleCalcBtn = (val: string) => {
    if (val === 'C') {
      setCalcDisplay('0');
      setCalcSequence('');
      return;
    }

    if (val === '=') {
      // Check secret unlock code: default is PIN + "=" (e.g. "1234=")
      if (calcSequence === security.pinCode || calcDisplay === security.pinCode) {
        onUnlocked();
        return;
      }

      // Otherwise evaluate arithmetic
      try {
        // Safe evaluation of simple math
        const sanitized = calcDisplay.replace(/[^0-9+\-*/.]/g, '');
        // eslint-disable-next-line no-eval
        const result = Function(`'use strict'; return (${sanitized})`)();
        setCalcDisplay(String(result));
        setCalcSequence('');
      } catch {
        setCalcDisplay('Error');
      }
      return;
    }

    setCalcSequence((prev) => prev + val);
    setCalcDisplay((prev) => (prev === '0' || prev === 'Error' ? val : prev + val));
  };

  // Toggle locked clone app
  const handleToggleCloneLock = (cloneId: string) => {
    const isLocked = security.lockedAppIds.includes(cloneId);
    const updated = isLocked
      ? security.lockedAppIds.filter((id) => id !== cloneId)
      : [...security.lockedAppIds, cloneId];
    onUpdateSecurity({ ...security, lockedAppIds: updated });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-6">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-purple-600/20 text-purple-400 flex items-center justify-center">
              <Lock className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {mode === 'unlock' ? (targetCloneName ? `Unlock ${targetCloneName}` : 'Narendra App Locker') : 'Security Vault Settings'}
              </h3>
              <p className="text-[10px] text-slate-400">
                AES-256 Sandboxed Hardware Protection
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* MODE: UNLOCK GATEKEEPER */}
        {mode === 'unlock' && (
          <div className="p-6">
            
            {/* If Calculator disguise is enabled */}
            {security.stealthDisguise === 'calculator' ? (
              <div className="space-y-4">
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-right font-mono text-2xl text-white overflow-x-auto">
                  {calcDisplay}
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {['C', '/', '*', '-', '7', '8', '9', '+', '4', '5', '6', '=', '1', '2', '3', '0'].map((btn) => (
                    <button
                      key={btn}
                      type="button"
                      onClick={() => handleCalcBtn(btn)}
                      className={`h-12 rounded-xl text-base font-bold transition-all ${
                        btn === '='
                          ? 'bg-purple-600 text-white hover:bg-purple-500 col-span-2'
                          : btn === 'C'
                          ? 'bg-red-950/60 text-red-300 border border-red-900/60'
                          : ['+', '-', '*', '/'].includes(btn)
                          ? 'bg-blue-900/40 text-blue-300 border border-blue-800/40'
                          : 'bg-slate-800 text-white hover:bg-slate-700'
                      }`}
                    >
                      {btn}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-500 text-center">
                  Tip: Enter your secret PIN (default: {security.pinCode}) and tap &quot;=&quot; to unlock.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* Method selector tabs */}
                <div className="flex items-center justify-center gap-3 p-1 bg-slate-950 rounded-xl border border-slate-800">
                  <button
                    onClick={() => setActiveLockMethod('pin')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      activeLockMethod === 'pin' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>PIN</span>
                  </button>
                  <button
                    onClick={() => setActiveLockMethod('pattern')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      activeLockMethod === 'pattern' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Grid className="h-3.5 w-3.5" />
                    <span>Pattern</span>
                  </button>
                  <button
                    onClick={() => setActiveLockMethod('biometric')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      activeLockMethod === 'biometric' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Fingerprint className="h-3.5 w-3.5" />
                    <span>Fingerprint</span>
                  </button>
                </div>

                {/* METHOD 1: PIN KEYPAD */}
                {activeLockMethod === 'pin' && (
                  <div className="space-y-5">
                    {/* PIN Dots */}
                    <div className="flex justify-center gap-3">
                      {[0, 1, 2, 3].map((idx) => {
                        const filled = pinInput.length > idx;
                        return (
                          <div
                            key={idx}
                            className={`w-4 h-4 rounded-full border-2 transition-all ${
                              pinError
                                ? 'border-red-500 bg-red-500 animate-bounce'
                                : filled
                                ? 'border-purple-500 bg-purple-500 scale-110'
                                : 'border-slate-700 bg-slate-800'
                            }`}
                          />
                        );
                      })}
                    </div>

                    {pinError && (
                      <p className="text-center text-xs text-red-400 flex items-center justify-center gap-1">
                        <AlertCircle className="h-3.5 w-3.5" />
                        <span>Incorrect PIN. Try again.</span>
                      </p>
                    )}

                    {/* Numeric Keypad */}
                    <div className="grid grid-cols-3 gap-3 max-w-[260px] mx-auto">
                      {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'].map((digit, i) => {
                        if (digit === '') return <div key={i} />;
                        if (digit === 'del') {
                          return (
                            <button
                              key={i}
                              type="button"
                              onClick={handlePinDelete}
                              className="h-12 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-xs font-bold text-slate-300 flex items-center justify-center transition-colors"
                            >
                              DEL
                            </button>
                          );
                        }
                        return (
                          <button
                            key={digit}
                            type="button"
                            onClick={() => handlePinDigit(digit)}
                            className="h-12 rounded-xl bg-slate-800 hover:bg-purple-900/40 hover:border-purple-500 border border-slate-700/60 text-lg font-bold text-white transition-all active:scale-95 flex items-center justify-center"
                          >
                            {digit}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-[11px] text-slate-500 text-center font-mono">
                      Default PIN: {security.pinCode}
                    </p>
                  </div>
                )}

                {/* METHOD 2: PATTERN UNLOCK */}
                {activeLockMethod === 'pattern' && (
                  <div className="space-y-4">
                    <p className="text-xs text-center text-slate-400">
                      Connect the pattern dots to unlock (Default: Z-shape / Top to Bottom)
                    </p>
                    
                    {/* 3x3 Grid */}
                    <div className="relative w-64 h-64 mx-auto bg-slate-950 border border-slate-800 rounded-2xl p-4 flex items-center justify-center">
                      <div className="grid grid-cols-3 gap-8">
                        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((dotIndex) => {
                          const isConnected = patternDots.includes(dotIndex);
                          return (
                            <button
                              key={dotIndex}
                              type="button"
                              onClick={() => handleDotClick(dotIndex)}
                              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                                patternError
                                  ? 'bg-red-500 ring-4 ring-red-500/30'
                                  : isConnected
                                  ? 'bg-purple-500 ring-4 ring-purple-500/40 scale-110'
                                  : 'bg-slate-800 hover:bg-slate-700'
                              }`}
                            >
                              <div className="w-2.5 h-2.5 rounded-full bg-white" />
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex justify-between items-center px-4 text-xs">
                      <span className="text-slate-500">Connected: {patternDots.length} dots</span>
                      <button
                        onClick={() => setPatternDots([])}
                        className="text-purple-400 hover:underline"
                      >
                        Reset Gesture
                      </button>
                    </div>
                  </div>
                )}

                {/* METHOD 3: BIOMETRIC SCAN */}
                {activeLockMethod === 'biometric' && (
                  <div className="text-center py-6 space-y-5">
                    <button
                      type="button"
                      onClick={handleBiometricTrigger}
                      className={`relative w-24 h-24 mx-auto rounded-3xl flex items-center justify-center transition-all ${
                        biometricSuccess
                          ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-600/30 scale-105'
                          : isBiometricScanning
                          ? 'bg-purple-600 text-white animate-pulse'
                          : 'bg-slate-800 text-purple-400 border border-purple-500/40 hover:border-purple-500'
                      }`}
                    >
                      {biometricSuccess ? (
                        <CheckCircle className="h-12 w-12" />
                      ) : (
                        <Fingerprint className="h-12 w-12" />
                      )}
                    </button>

                    <div>
                      <p className="text-sm font-semibold text-white">
                        {biometricSuccess
                          ? 'Biometric Verified!'
                          : isBiometricScanning
                          ? 'Scanning Fingerprint Sensor...'
                          : 'Touch Fingerprint Sensor'}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Android BiometricPrompt API Simulation
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleBiometricTrigger}
                      className="px-4 py-2 text-xs font-semibold text-purple-300 bg-purple-950/60 border border-purple-800/80 rounded-xl hover:bg-purple-900/60 transition-colors"
                    >
                      Simulate Hardware Touch
                    </button>
                  </div>
                )}

              </div>
            )}

          </div>
        )}

        {/* MODE: SECURITY SETTINGS */}
        {mode === 'settings' && (
          <div className="p-6 space-y-6">
            
            {/* Tabs */}
            <div className="flex border-b border-slate-800 text-xs">
              <button
                onClick={() => setActiveTab('methods')}
                className={`flex-1 py-2 font-medium text-center border-b-2 transition-colors ${
                  activeTab === 'methods'
                    ? 'border-purple-500 text-white'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                Unlock Options
              </button>
              <button
                onClick={() => setActiveTab('apps')}
                className={`flex-1 py-2 font-medium text-center border-b-2 transition-colors ${
                  activeTab === 'apps'
                    ? 'border-purple-500 text-white'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                Locked Clones ({security.lockedAppIds.length})
              </button>
              <button
                onClick={() => setActiveTab('disguise')}
                className={`flex-1 py-2 font-medium text-center border-b-2 transition-colors ${
                  activeTab === 'disguise'
                    ? 'border-purple-500 text-white'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                Stealth Disguise
              </button>
            </div>

            {/* TAB 1: METHODS */}
            {activeTab === 'methods' && (
              <div className="space-y-4">
                <label className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-950/40">
                  <div>
                    <p className="text-xs font-semibold text-white">Enable App Locker</p>
                    <p className="text-[10px] text-slate-400">Master gatekeeper for all clones</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={security.isLockEnabled}
                    onChange={(e) => onUpdateSecurity({ ...security, isLockEnabled: e.target.checked })}
                    className="w-4 h-4 accent-purple-600 cursor-pointer"
                  />
                </label>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Master PIN Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={newPin}
                    onChange={(e) => {
                      setNewPin(e.target.value);
                      if (e.target.value.length >= 4) {
                        onUpdateSecurity({ ...security, pinCode: e.target.value });
                      }
                    }}
                    className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-700 rounded-lg text-white font-mono"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Must be 4 to 6 digits numeric.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-2">
                    Default Unlock Method
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['pin', 'pattern', 'biometric'] as const).map((method) => (
                      <button
                        key={method}
                        onClick={() => onUpdateSecurity({ ...security, lockType: method })}
                        className={`p-2.5 rounded-xl border text-xs font-medium capitalize transition-all ${
                          security.lockType === method
                            ? 'border-purple-500 bg-purple-950/50 text-white'
                            : 'border-slate-800 bg-slate-950/30 text-slate-400'
                        }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: LOCKED APPS */}
            {activeTab === 'apps' && (
              <div className="space-y-2.5 max-h-64 overflow-y-auto">
                {clones.map((clone) => {
                  const isLocked = security.lockedAppIds.includes(clone.id);
                  return (
                    <div
                      key={clone.id}
                      onClick={() => handleToggleCloneLock(clone.id)}
                      className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-950/40 hover:border-slate-700 cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <Lock className={`h-4 w-4 ${isLocked ? 'text-purple-400' : 'text-slate-600'}`} />
                        <div>
                          <p className="text-xs font-semibold text-white">{clone.customName}</p>
                          <p className="text-[10px] text-slate-500 font-mono">{clone.clonePackageName}</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={isLocked}
                        readOnly
                        className="w-4 h-4 accent-purple-600 cursor-pointer"
                      />
                    </div>
                  );
                })}
              </div>
            )}

            {/* TAB 3: DISGUISE */}
            {activeTab === 'disguise' && (
              <div className="space-y-3">
                <p className="text-xs text-slate-400">
                  Disguise Narendra App Cloner on your device to prevent snooping:
                </p>

                {[
                  { id: 'none', title: 'No Disguise', desc: 'Standard App Cloner dashboard' },
                  { id: 'calculator', title: 'Calculator Disguise', desc: 'Opens as a working calculator. Enter PIN + "=" to unlock.' },
                  { id: 'fake_crash', title: 'Fake Crash Dialog', desc: 'Shows "App has stopped unexpectedly" on launch.' },
                ].map((item) => (
                  <div
                    key={item.id}
                    onClick={() => onUpdateSecurity({ ...security, stealthDisguise: item.id as any })}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      security.stealthDisguise === item.id
                        ? 'border-purple-500 bg-purple-950/40 text-white'
                        : 'border-slate-800 bg-slate-950/30 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white">{item.title}</span>
                      <input
                        type="radio"
                        checked={security.stealthDisguise === item.id}
                        readOnly
                        className="accent-purple-600"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">{item.desc}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-2 border-t border-slate-800">
              <button
                onClick={onClose}
                className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Save &amp; Close
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
