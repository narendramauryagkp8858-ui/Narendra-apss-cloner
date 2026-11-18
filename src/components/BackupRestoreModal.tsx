import React, { useState } from 'react';
import { ClonedApp, SecuritySettings } from '../types';
import { buildClonerBackupJson } from '../utils/storage';
import {
  Archive,
  Copy,
  Check,
  Upload,
  X,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';

interface BackupRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  clones: ClonedApp[];
  security: SecuritySettings;
  onRestoreClones: (restoredClones: ClonedApp[]) => void;
}

export const BackupRestoreModal: React.FC<BackupRestoreModalProps> = ({
  isOpen,
  onClose,
  clones,
  security,
  onRestoreClones,
}) => {
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [copiedBackup, setCopiedBackup] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleCopyBackup = () => {
    const jsonStr = buildClonerBackupJson(clones, security);
    navigator.clipboard.writeText(jsonStr);
    setCopiedBackup(true);
    setTimeout(() => setCopiedBackup(false), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        if (Array.isArray(parsed.clones)) {
          onRestoreClones(parsed.clones);
          setImportStatus(`Successfully restored ${parsed.clones.length} cloned applications!`);
          setIsSuccess(true);
        } else {
          setImportStatus('Invalid backup format: missing clones array.');
          setIsSuccess(false);
        }
      } catch (err) {
        setImportStatus('Failed to parse backup file. Please ensure valid JSON.');
        setIsSuccess(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-purple-600/20 text-purple-400 flex items-center justify-center">
              <Archive className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Backup &amp; Restore Clones</h3>
              <p className="text-[10px] text-slate-400">Narendra App Cloner Snapshot Engine</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          
          {/* Export section (Clipboard Copy, No Download) */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/40 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-white">Copy Full Cloner Snapshot</h4>
                <p className="text-[11px] text-slate-400">
                  Copy all {clones.length} clone configurations, sandbox SQLite metadata, and icon settings as JSON.
                </p>
              </div>
            </div>
            <button
              onClick={handleCopyBackup}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-purple-600/20 transition-all cursor-pointer"
            >
              {copiedBackup ? <Check className="h-4 w-4 text-emerald-300" /> : <Copy className="h-4 w-4" />}
              <span>{copiedBackup ? 'Snapshot JSON Copied!' : 'Copy Backup JSON'}</span>
            </button>
          </div>

          {/* Import section */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/40 space-y-3">
            <div>
              <h4 className="text-xs font-bold text-white">Restore from Backup File</h4>
              <p className="text-[11px] text-slate-400">
                Select a previously saved <code className="text-purple-300">.nacbackup</code> or JSON file to restore clones.
              </p>
            </div>

            <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-700 hover:border-purple-500 rounded-xl cursor-pointer bg-slate-900/60 transition-all">
              <Upload className="h-8 w-8 text-purple-400 mb-2" />
              <span className="text-xs font-semibold text-white">Choose Backup File</span>
              <span className="text-[10px] text-slate-500 mt-0.5">.nacbackup or .json format</span>
              <input
                type="file"
                accept=".json,.nacbackup"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            {importStatus && (
              <div
                className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                  isSuccess
                    ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'
                    : 'bg-red-950/60 border border-red-800 text-red-300'
                }`}
              >
                {isSuccess ? <CheckCircle className="h-4 w-4 shrink-0" /> : <AlertTriangle className="h-4 w-4 shrink-0" />}
                <span>{importStatus}</span>
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/60 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
