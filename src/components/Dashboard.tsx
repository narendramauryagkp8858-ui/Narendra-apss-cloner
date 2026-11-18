import React, { useState } from 'react';
import { ClonedApp, InstalledApp } from '../types';
import { AppIcon } from './AppIcon';
import {
  Plus,
  Play,
  Trash2,
  Edit2,
  HardDrive,
  Search,
  Layers,
  Smartphone,
  Check,
} from 'lucide-react';

interface DashboardProps {
  clones: ClonedApp[];
  installedApps: InstalledApp[];
  onOpenCloneModal: (app?: InstalledApp) => void;
  onLaunchClone: (clone: ClonedApp) => void;
  onDeleteClone: (cloneId: string) => void;
  onRenameClone: (cloneId: string, newName: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  clones,
  installedApps,
  onOpenCloneModal,
  onLaunchClone,
  onDeleteClone,
  onRenameClone,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editingCloneId, setEditingCloneId] = useState<string | null>(null);
  const [editNameInput, setEditNameInput] = useState<string>('');

  // Filter clones
  const filteredClones = clones.filter((c) => {
    return (
      c.customName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.clonePackageName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Filter installed apps
  const filteredInstalled = installedApps.filter((app) => {
    const matchesSearch =
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.packageName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'all' || app.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const handleStartRename = (clone: ClonedApp) => {
    setEditingCloneId(clone.id);
    setEditNameInput(clone.customName);
  };

  const handleSaveRename = (cloneId: string) => {
    if (editNameInput.trim()) {
      onRenameClone(cloneId, editNameInput.trim());
    }
    setEditingCloneId(null);
  };

  return (
    <div className="space-y-8">
      
      {/* 3D Modern Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-purple-950/40 p-6 sm:p-8 shadow-2xl">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-mono text-purple-400 font-bold uppercase tracking-wider">
                Narendra Apps Cloner
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-xs text-blue-300 font-medium">narendramauryagkp@gmail.com</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Narendra Apps Cloner
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Create multiple independent copies of any installed app with custom names, custom 3D icons, and separate local storage.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => onOpenCloneModal()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-purple-600/20 active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Clone New App</span>
            </button>
          </div>
        </div>

        {/* Stat Row */}
        <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-slate-800/80 max-w-md">
          <div>
            <span className="text-[11px] text-slate-400">Cloned Apps</span>
            <p className="text-xl font-bold text-white tabular-nums mt-0.5">{clones.length}</p>
          </div>
          <div>
            <span className="text-[11px] text-slate-400">Installed Apps</span>
            <p className="text-xl font-bold text-blue-400 tabular-nums mt-0.5">{installedApps.length}</p>
          </div>
        </div>
      </div>

      {/* SECTION 1: CLONED APPS */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Layers className="h-5 w-5 text-purple-400" />
              <span>My Cloned Apps</span>
              <span className="text-xs font-normal text-slate-400 font-mono">({clones.length})</span>
            </h2>
            <p className="text-xs text-slate-400">Separate app copies running independently</p>
          </div>

          <div className="relative">
            <Search className="h-3.5 w-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search apps..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-purple-500 w-48 sm:w-56"
            />
          </div>
        </div>

        {filteredClones.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-950/40">
            <Smartphone className="h-10 w-10 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-white">No Cloned Apps Found</p>
            <p className="text-xs text-slate-400 mt-1">
              Select an installed app below or click &quot;Clone New App&quot; to create a clone.
            </p>
            <button
              onClick={() => onOpenCloneModal()}
              className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold cursor-pointer"
            >
              Clone App Now
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredClones.map((clone) => {
              const orig = installedApps.find((a) => a.id === clone.originalAppId);
              const isEditing = editingCloneId === clone.id;

              return (
                <div
                  key={clone.id}
                  className="card-3d relative rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg flex flex-col justify-between hover:border-purple-500/40 hover:shadow-purple-500/10 transition-all"
                >
                  {/* Top Row: Icon + Title */}
                  <div className="flex items-start gap-3.5">
                    <AppIcon
                      iconSvg={orig?.iconSvg}
                      iconBg={orig?.iconBg}
                      hueRotateDeg={clone.iconConfig.hueRotateDeg}
                      badgeText={clone.iconConfig.badgeText}
                      badgeColor={clone.iconConfig.badgeColor}
                      borderColor={clone.iconConfig.borderColor}
                      showBadge={true}
                      size="md"
                    />

                    <div className="min-w-0 flex-1">
                      {isEditing ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={editNameInput}
                            onChange={(e) => setEditNameInput(e.target.value)}
                            className="w-full text-xs bg-slate-950 border border-purple-500 rounded px-2 py-1 text-white"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveRename(clone.id)}
                            className="p-1 bg-purple-600 text-white rounded hover:bg-purple-500"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-bold text-white truncate" title={clone.customName}>
                            {clone.customName}
                          </h3>
                          <button
                            onClick={() => handleStartRename(clone)}
                            className="p-1 text-slate-500 hover:text-slate-300 cursor-pointer"
                            title="Rename Clone"
                          >
                            <Edit2 className="h-3 w-3" />
                          </button>
                        </div>
                      )}

                      <p className="text-[10px] text-slate-400 font-mono truncate mt-0.5">
                        {clone.clonePackageName}
                      </p>

                      <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-400 font-mono">
                        <span className="flex items-center gap-1">
                          <HardDrive className="h-3 w-3 text-slate-500" />
                          <span>{clone.dataSizeMb.toFixed(1)} MB</span>
                        </span>
                        <span>·</span>
                        <span>Clone #{clone.cloneNumber}</span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Action Buttons */}
                  <div className="flex items-center justify-between gap-2 pt-3 mt-4 border-t border-slate-800/60">
                    <button
                      onClick={() => onLaunchClone(clone)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-purple-600/20 active:scale-95 transition-all cursor-pointer"
                    >
                      <Play className="h-3.5 w-3.5 fill-current" />
                      <span>Open Clone</span>
                    </button>

                    <button
                      onClick={() => onDeleteClone(clone.id)}
                      title="Delete Clone"
                      className="p-2 rounded-xl bg-slate-800/80 hover:bg-red-950/40 border border-slate-700/60 hover:border-red-800/60 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 2: INSTALLED APPS CATALOG (One-Tap Clone) */}
      <div className="space-y-4 pt-4 border-t border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-blue-400" />
              <span>Installed Apps</span>
              <span className="text-xs font-normal text-slate-400 font-mono">({installedApps.length})</span>
            </h2>
            <p className="text-xs text-slate-400">Select any app below to create a clone</p>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto">
            {['all', 'messaging', 'social', 'productivity', 'tools'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 text-xs font-medium rounded-lg capitalize transition-colors whitespace-nowrap cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {filteredInstalled.map((app) => {
            const clonesForApp = clones.filter((c) => c.originalAppId === app.id);
            return (
              <div
                key={app.id}
                className="p-4 rounded-xl border border-slate-800/80 bg-slate-900/60 hover:bg-slate-900 hover:border-slate-700 transition-all flex flex-col justify-between space-y-3"
              >
                <div className="flex items-start gap-3">
                  <AppIcon iconSvg={app.iconSvg} iconBg={app.iconBg} size="md" showBadge={false} />
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-white truncate">{app.name}</h4>
                    <p className="text-[10px] text-slate-400 font-mono truncate">{app.packageName}</p>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500">
                      <span>v{app.versionName}</span>
                      <span>·</span>
                      <span>{app.originalDataSizeMb.toFixed(0)} MB</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                  <span className="text-[11px] font-mono text-slate-400">
                    {clonesForApp.length > 0 ? (
                      <span className="text-purple-400 font-semibold">{clonesForApp.length} Clone(s)</span>
                    ) : (
                      'No Clones'
                    )}
                  </span>

                  <button
                    onClick={() => onOpenCloneModal(app)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/40 text-xs font-semibold transition-all cursor-pointer"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Clone</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
