import React from 'react';
import { ClonedApp, InstalledApp } from '../types';
import { AppIcon } from './AppIcon';
import {
  HardDrive,
  Clock,
  Battery,
  Trash2,
  FileCheck,
  Smartphone,
  ShieldCheck,
  Activity,
} from 'lucide-react';

interface UsageAnalyticsProps {
  clones: ClonedApp[];
  installedApps: InstalledApp[];
  onClearAllCache: () => void;
  onClearCloneCache: (cloneId: string) => void;
}

export const UsageAnalytics: React.FC<UsageAnalyticsProps> = ({
  clones,
  installedApps,
  onClearAllCache,
  onClearCloneCache,
}) => {
  const totalClonesDataMb = clones.reduce((acc, c) => acc + c.dataSizeMb, 0);
  const totalClonesCacheMb = clones.reduce((acc, c) => acc + c.cacheSizeMb, 0);
  const totalLaunches = clones.reduce((acc, c) => acc + c.launchCount, 0);

  return (
    <div className="space-y-6">
      
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Virtual Sandbox Storage</span>
            <HardDrive className="h-4 w-4 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-white tabular-nums">
            {totalClonesDataMb.toFixed(1)} <span className="text-xs font-normal text-slate-400">MB</span>
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Across {clones.length} cloned instances</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Isolated Cache Space</span>
            <Trash2 className="h-4 w-4 text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-purple-400 tabular-nums">
            {totalClonesCacheMb.toFixed(1)} <span className="text-xs font-normal text-slate-400">MB</span>
          </p>
          <button
            onClick={onClearAllCache}
            className="text-[11px] text-purple-300 hover:text-white mt-1 block hover:underline cursor-pointer"
          >
            Clean All Virtual Cache
          </button>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Total Dual Launches</span>
            <Activity className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400 tabular-nums">
            {totalLaunches} <span className="text-xs font-normal text-slate-400">sessions</span>
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Independent process runs</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Encrypted SQLite DBs</span>
            <ShieldCheck className="h-4 w-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-amber-400 tabular-nums">
            {clones.length} <span className="text-xs font-normal text-slate-400">sandboxes</span>
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Hardware AES-256 protected</p>
        </div>
      </div>

      {/* Per-Clone Usage Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div>
            <h3 className="text-sm font-bold text-white">Isolated Clone App Storage &amp; Telemetry</h3>
            <p className="text-xs text-slate-400">Real-time breakdown of sandbox directories and runtime stats</p>
          </div>
          <button
            onClick={onClearAllCache}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors border border-slate-700 cursor-pointer"
          >
            Clear All Cache ({totalClonesCacheMb.toFixed(1)} MB)
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-6 py-3">Clone Application</th>
                <th className="px-6 py-3">Package / Sandbox Path</th>
                <th className="px-6 py-3 text-right">App Data</th>
                <th className="px-6 py-3 text-right">Cache</th>
                <th className="px-6 py-3 text-right">Launches</th>
                <th className="px-6 py-3 text-right">Last Used</th>
                <th className="px-6 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {clones.map((clone) => {
                const orig = installedApps.find((a) => a.id === clone.originalAppId);
                return (
                  <tr key={clone.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-3.5 flex items-center gap-3">
                      <AppIcon
                        iconSvg={orig?.iconSvg}
                        iconBg={orig?.iconBg}
                        hueRotateDeg={clone.iconConfig.hueRotateDeg}
                        badgeText={clone.iconConfig.badgeText}
                        badgeColor={clone.iconConfig.badgeColor}
                        showBadge={true}
                        size="sm"
                      />
                      <div>
                        <p className="font-semibold text-white">{clone.customName}</p>
                        <p className="text-[10px] text-slate-500">Clone #{clone.cloneNumber}</p>
                      </div>
                    </td>

                    <td className="px-6 py-3.5 font-mono text-[11px] text-slate-400">
                      <div>{clone.clonePackageName}</div>
                      <div className="text-[10px] text-slate-500">
                        /data/user/{10 + clone.cloneNumber}/{clone.originalPackageName}
                      </div>
                    </td>

                    <td className="px-6 py-3.5 text-right font-mono font-medium text-white tabular-nums">
                      {clone.dataSizeMb.toFixed(1)} MB
                    </td>

                    <td className="px-6 py-3.5 text-right font-mono text-purple-300 tabular-nums">
                      {clone.cacheSizeMb.toFixed(1)} MB
                    </td>

                    <td className="px-6 py-3.5 text-right font-mono tabular-nums text-slate-200">
                      {clone.launchCount}
                    </td>

                    <td className="px-6 py-3.5 text-right text-slate-400 text-[11px]">
                      {clone.lastUsedAt}
                    </td>

                    <td className="px-6 py-3.5 text-center">
                      <button
                        onClick={() => onClearCloneCache(clone.id)}
                        disabled={clone.cacheSizeMb === 0}
                        className="px-2.5 py-1 text-[11px] text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-lg transition-colors border border-slate-700 cursor-pointer"
                      >
                        Clear Cache
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
