import React, { useState, useEffect } from 'react';
import { InstalledApp, ClonedApp } from '../types';
import { AppIcon } from './AppIcon';
import { X, Check, Sliders, Sparkles } from 'lucide-react';
import { triggerConfetti } from '../utils/storage';

interface CloneModalProps {
  isOpen: boolean;
  onClose: () => void;
  installedApps: InstalledApp[];
  existingClones: ClonedApp[];
  onCloneCreated: (newClone: ClonedApp) => void;
  preSelectedApp?: InstalledApp | null;
}

const PRESET_COLORS = ['#2563eb', '#7c3aed', '#10b981', '#f59e0b', '#ec4899', '#06b6d4'];

export const CloneModal: React.FC<CloneModalProps> = ({
  isOpen,
  onClose,
  installedApps,
  existingClones,
  onCloneCreated,
  preSelectedApp,
}) => {
  const [selectedAppId, setSelectedAppId] = useState<string>(
    preSelectedApp ? preSelectedApp.id : installedApps[0]?.id || 'whatsapp'
  );

  const selectedApp = installedApps.find((a) => a.id === selectedAppId) || installedApps[0];

  const [cloneNumber, setCloneNumber] = useState<number>(1);
  const [customName, setCustomName] = useState<string>('');
  const [hueRotate, setHueRotate] = useState<number>(180);
  const [badgeText, setBadgeText] = useState<string>('2');
  const [badgeColor, setBadgeColor] = useState<string>('#3b82f6');
  const [isolatedStorage, setIsolatedStorage] = useState<boolean>(true);
  const [isCreating, setIsCreating] = useState<boolean>(false);

  // Sync defaults whenever modal opens or preSelectedApp changes
  useEffect(() => {
    if (!isOpen) return;
    const targetApp = preSelectedApp || installedApps[0];
    if (!targetApp) return;

    const nextNum = existingClones.filter((c) => c.originalAppId === targetApp.id).length + 1;
    setSelectedAppId(targetApp.id);
    setCloneNumber(nextNum);
    setCustomName(`${targetApp.name} (Clone ${nextNum})`);
    setBadgeText(nextNum === 1 ? 'WORK' : `${nextNum}`);
    setHueRotate((nextNum * 90) % 360);
  }, [isOpen, preSelectedApp, installedApps, existingClones]);

  const handleSelectApp = (app: InstalledApp) => {
    setSelectedAppId(app.id);
    const count = existingClones.filter((c) => c.originalAppId === app.id).length + 1;
    setCloneNumber(count);
    setCustomName(`${app.name} (Clone ${count})`);
    setBadgeText(count === 1 ? 'WORK' : `${count}`);
    setHueRotate((count * 90) % 360);
  };

  const handleCreateClone = () => {
    if (!selectedApp) return;

    setIsCreating(true);

    setTimeout(() => {
      const newClone: ClonedApp = {
        id: `clone-${selectedApp.id}-${Date.now().toString(36)}`,
        originalAppId: selectedApp.id,
        originalPackageName: selectedApp.packageName,
        cloneNumber: cloneNumber,
        customName: customName.trim() || `${selectedApp.name} Clone ${cloneNumber}`,
        clonePackageName: `com.narendra.cloner.user_${cloneNumber}.${selectedApp.packageName}`,
        createdAt: new Date().toLocaleString(),
        lastUsedAt: 'Just created',
        launchCount: 0,
        dataSizeMb: 12.5,
        cacheSizeMb: 0.8,
        isLocked: false,
        isHidden: false,
        iconConfig: {
          badgeText: badgeText || undefined,
          badgeColor,
          hueRotateDeg: hueRotate,
          borderColor: badgeColor,
          showBadge: Boolean(badgeText.trim()),
          scale: 1,
        },
        sandboxConfig: {
          isolatedStorage,
          fakeGpsEnabled: false,
          independentNotifications: true,
          incognitoMode: false,
          cameraAccess: true,
          microphoneAccess: true,
          workProfileMode: true,
        },
        simulatedData: {
          accountHandle: `${customName} Session`,
          accountAvatar: '👤',
          messages: [],
          notes: [],
        },
      };

      onCloneCreated(newClone);
      triggerConfetti();
      setIsCreating(false);
      onClose();
    }, 450);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Clone Application</h2>
              <p className="text-xs text-slate-400">Narendra App Cloner</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* Step 1: Select Installed App */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              1. Select App to Clone
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {installedApps.map((app) => {
                const isSelected = app.id === selectedAppId;
                return (
                  <button
                    key={app.id}
                    type="button"
                    onClick={() => handleSelectApp(app)}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-blue-500 bg-blue-950/40 text-white shadow-sm ring-1 ring-blue-500/50'
                        : 'border-slate-800 bg-slate-800/40 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <AppIcon iconSvg={app.iconSvg} iconBg={app.iconBg} size="sm" showBadge={false} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold truncate">{app.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{app.category}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Live 3D Icon & Name Customizer */}
          <div className="p-4 rounded-xl border border-slate-800/80 bg-slate-950/40">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              
              {/* Live Icon Preview */}
              <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-900 border border-slate-800/80 shrink-0">
                <AppIcon
                  iconSvg={selectedApp?.iconSvg}
                  iconBg={selectedApp?.iconBg}
                  hueRotateDeg={hueRotate}
                  badgeText={badgeText}
                  badgeColor={badgeColor}
                  borderColor={badgeColor}
                  showBadge={Boolean(badgeText.trim())}
                  size="xl"
                />
                <span className="text-[11px] font-mono text-slate-400 mt-2">Icon Preview</span>
              </div>

              {/* Controls */}
              <div className="flex-1 space-y-3 w-full">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Custom Clone Name
                  </label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="e.g. WhatsApp (Clone 2)"
                    className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Clone Number
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={99}
                      value={cloneNumber}
                      onChange={(e) => setCloneNumber(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Badge Label
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={badgeText}
                      onChange={(e) => setBadgeText(e.target.value)}
                      placeholder="e.g. 2"
                      className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                </div>

                {/* Hue Rotation slider */}
                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>Icon Color Shift</span>
                    <span className="font-mono text-blue-400">{hueRotate}°</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={360}
                    value={hueRotate}
                    onChange={(e) => setHueRotate(parseInt(e.target.value))}
                    className="w-full accent-blue-500 cursor-pointer"
                  />
                </div>

                {/* Badge Color Presets */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Badge Color:</span>
                  <div className="flex gap-1.5">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setBadgeColor(c)}
                        style={{ backgroundColor: c }}
                        className={`w-5 h-5 rounded-full transition-transform cursor-pointer ${badgeColor === c ? 'scale-125 ring-2 ring-white' : 'opacity-80'}`}
                      />
                    ))}
                  </div>
                </div>

              </div>

            </div>
          </div>

          {/* Step 3: Separate Storage */}
          <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-800 bg-slate-950/40 cursor-pointer hover:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-600/20 text-blue-400">
                <Sliders className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Separate App Data &amp; Storage</p>
                <p className="text-[11px] text-slate-400">Keep clone login and files isolated from the original app</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={isolatedStorage}
              onChange={(e) => setIsolatedStorage(e.target.checked)}
              className="w-4 h-4 accent-blue-600 cursor-pointer"
            />
          </label>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800 bg-slate-950/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isCreating}
            onClick={handleCreateClone}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-lg hover:from-blue-500 hover:to-purple-500 shadow-lg shadow-purple-500/20 disabled:opacity-50 transition-all cursor-pointer"
          >
            {isCreating ? (
              <span>Creating Clone...</span>
            ) : (
              <>
                <Check className="h-4 w-4" />
                <span>Create Clone #{cloneNumber}</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
