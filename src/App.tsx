/**
 * Narendra App Cloner
 * Developer: Narendra Maurya
 * Email: narendramauryagkp@gmail.com
 */

import React, { useState, useEffect } from 'react';
import { ClonedApp, InstalledApp } from './types';
import {
  loadInstalledApps,
  saveInstalledApps,
  loadClonedApps,
  saveClonedApps,
} from './utils/storage';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { CloneModal } from './components/CloneModal';
import { AppIcon } from './components/AppIcon';
import { CheckCircle, X, HardDrive, Layers } from 'lucide-react';

export default function App() {
  const [installedApps, setInstalledApps] = useState<InstalledApp[]>(loadInstalledApps);
  const [clones, setClones] = useState<ClonedApp[]>(loadClonedApps);

  // Clone creation modal
  const [isCloneModalOpen, setIsCloneModalOpen] = useState<boolean>(false);
  const [preSelectedAppForClone, setPreSelectedAppForClone] = useState<InstalledApp | null>(null);

  // Active launched clone modal
  const [launchedClone, setLaunchedClone] = useState<ClonedApp | null>(null);

  // Save changes to localStorage
  useEffect(() => {
    saveClonedApps(clones);
  }, [clones]);

  useEffect(() => {
    saveInstalledApps(installedApps);
  }, [installedApps]);

  // Clone handlers
  const handleOpenCloneModal = (app?: InstalledApp) => {
    setPreSelectedAppForClone(app || null);
    setIsCloneModalOpen(true);
  };

  const handleCloneCreated = (newClone: ClonedApp) => {
    setClones((prev) => [newClone, ...prev]);

    setInstalledApps((prev) =>
      prev.map((a) =>
        a.id === newClone.originalAppId ? { ...a, cloneCount: a.cloneCount + 1 } : a
      )
    );
  };

  const handleDeleteClone = (cloneId: string) => {
    const clone = clones.find((c) => c.id === cloneId);
    if (!clone) return;

    if (window.confirm(`Delete "${clone.customName}" and remove its cloned data?`)) {
      setClones((prev) => prev.filter((c) => c.id !== cloneId));
      setInstalledApps((prev) =>
        prev.map((a) =>
          a.id === clone.originalAppId
            ? { ...a, cloneCount: Math.max(0, a.cloneCount - 1) }
            : a
        )
      );
      if (launchedClone?.id === cloneId) {
        setLaunchedClone(null);
      }
    }
  };

  const handleRenameClone = (cloneId: string, newName: string) => {
    setClones((prev) =>
      prev.map((c) => (c.id === cloneId ? { ...c, customName: newName } : c))
    );
  };

  const handleLaunchClone = (clone: ClonedApp) => {
    setClones((prev) =>
      prev.map((c) =>
        c.id === clone.id
          ? { ...c, launchCount: c.launchCount + 1, lastUsedAt: 'Just now' }
          : c
      )
    );
    setLaunchedClone(clone);
  };

  const launchedOriginalApp = launchedClone
    ? installedApps.find((a) => a.id === launchedClone.originalAppId)
    : null;

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      
      {/* Pure App Cloner Top Header */}
      <Header onOpenCloneModal={() => handleOpenCloneModal()} />

      {/* Main Content Area: Strictly App Cloner */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Dashboard
          clones={clones}
          installedApps={installedApps}
          onOpenCloneModal={handleOpenCloneModal}
          onLaunchClone={handleLaunchClone}
          onDeleteClone={handleDeleteClone}
          onRenameClone={handleRenameClone}
        />
      </main>

      {/* Cloner Modal */}
      <CloneModal
        isOpen={isCloneModalOpen}
        onClose={() => setIsCloneModalOpen(false)}
        installedApps={installedApps}
        existingClones={clones}
        onCloneCreated={handleCloneCreated}
        preSelectedApp={preSelectedAppForClone}
      />

      {/* Running Cloned App Modal */}
      {launchedClone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-slate-900 border border-purple-500/40 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/80">
              <div className="flex items-center gap-3">
                <AppIcon
                  iconSvg={launchedOriginalApp?.iconSvg}
                  iconBg={launchedOriginalApp?.iconBg}
                  hueRotateDeg={launchedClone.iconConfig.hueRotateDeg}
                  badgeText={launchedClone.iconConfig.badgeText}
                  badgeColor={launchedClone.iconConfig.badgeColor}
                  borderColor={launchedClone.iconConfig.borderColor}
                  showBadge={true}
                  size="sm"
                />
                <div>
                  <h3 className="text-sm font-bold text-white">{launchedClone.customName}</h3>
                  <p className="text-[10px] text-purple-300 font-mono">{launchedClone.clonePackageName}</p>
                </div>
              </div>
              <button
                onClick={() => setLaunchedClone(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-center">
              <div className="mx-auto w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <CheckCircle className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Clone Instance Active</p>
                <p className="text-xs text-slate-400 mt-1">
                  Running independently from the original {launchedOriginalApp?.name || 'app'}.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-left space-y-1.5 text-[11px] font-mono text-slate-400">
                <div className="flex items-center gap-2">
                  <Layers className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                  <span className="truncate">Clone #{launchedClone.cloneNumber} · Separate Account</span>
                </div>
                <div className="flex items-center gap-2">
                  <HardDrive className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                  <span className="truncate">/data/user/{launchedClone.cloneNumber}/{launchedClone.originalPackageName}</span>
                </div>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/60 flex justify-end">
              <button
                onClick={() => setLaunchedClone(null)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clean Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-slate-950 py-5 px-4 sm:px-6 lg:px-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-slate-300">Narendra App Cloner</span>
            <span>·</span>
            <span>Created by Narendra Maurya</span>
          </div>
          <a
            href="mailto:narendramauryagkp@gmail.com"
            className="text-blue-400 hover:text-purple-400 transition-colors"
          >
            narendramauryagkp@gmail.com
          </a>
        </div>
      </footer>

    </div>
  );
}
