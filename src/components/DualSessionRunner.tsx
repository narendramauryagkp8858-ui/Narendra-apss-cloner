import React, { useState } from 'react';
import { ClonedApp, InstalledApp } from '../types';
import { AppIcon } from './AppIcon';
import {
  Send,
  Split,
  RefreshCw,
  Bell,
  MapPin,
  Trash2,
  HardDrive,
  Shield,
  Smartphone,
  CheckCircle,
  Plus,
} from 'lucide-react';

interface DualSessionRunnerProps {
  clones: ClonedApp[];
  installedApps: InstalledApp[];
  activeCloneId?: string;
  onSendNotification: (clone: ClonedApp, title: string, body: string) => void;
  onClearCache: (cloneId: string) => void;
  onUpdateCloneData: (cloneId: string, updatedData: any) => void;
}

export const DualSessionRunner: React.FC<DualSessionRunnerProps> = ({
  clones,
  installedApps,
  activeCloneId,
  onSendNotification,
  onClearCache,
  onUpdateCloneData,
}) => {
  const [selectedCloneId, setSelectedCloneId] = useState<string>(
    activeCloneId || clones[0]?.id || ''
  );
  const [isSplitMode, setIsSplitMode] = useState<boolean>(true);
  const [activeTabApp, setActiveTabApp] = useState<'chat' | 'notes' | 'info'>('chat');

  // Input states for interactive simulation
  const [originalChatInput, setOriginalChatInput] = useState<string>('');
  const [cloneChatInput, setCloneChatInput] = useState<string>('');
  const [newNoteTitle, setNewNoteTitle] = useState<string>('');
  const [newNoteContent, setNewNoteContent] = useState<string>('');

  // Find the selected clone and its matching original app
  const selectedClone = clones.find((c) => c.id === selectedCloneId) || clones[0];
  const originalApp = installedApps.find((a) => a.id === selectedClone?.originalAppId);

  // Original app simulated messages (Personal Session)
  const [originalMessages, setOriginalMessages] = useState([
    { id: 'orig-1', sender: 'Mom', text: 'Have you had dinner yet, Narendra?', time: '08:15 PM', isMe: false },
    { id: 'orig-2', sender: 'Me', text: 'Yes Mom, finishing up the Android App Cloner project.', time: '08:17 PM', isMe: true },
    { id: 'orig-3', sender: 'Gym Partner Alex', text: 'Leg workout tomorrow morning at 6:30 AM?', time: '09:00 PM', isMe: false },
  ]);

  if (!selectedClone) {
    return (
      <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl">
        <Smartphone className="h-10 w-10 text-slate-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-white">No Cloned Applications Available</h3>
        <p className="text-xs text-slate-400 mt-1">Create an app clone first from the Clones Dashboard.</p>
      </div>
    );
  }

  // Clone messages from its isolated simulated data
  const cloneMessages = selectedClone.simulatedData?.messages || [
    { id: 'c1', sender: 'Work Colleague', text: 'Reviewing the native APK build.', time: '10:00 AM', isMe: false },
  ];

  const handleSendOriginalMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!originalChatInput.trim()) return;

    const newMsg = {
      id: `orig-${Date.now()}`,
      sender: 'Me',
      text: originalChatInput.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
    };

    setOriginalMessages((prev) => [...prev, newMsg]);
    setOriginalChatInput('');
  };

  const handleSendCloneMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cloneChatInput.trim()) return;

    const newMsg = {
      id: `clone-${Date.now()}`,
      sender: 'Me',
      text: cloneChatInput.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
    };

    const updatedMessages = [...cloneMessages, newMsg];
    onUpdateCloneData(selectedClone.id, {
      ...selectedClone.simulatedData,
      messages: updatedMessages,
    });
    setCloneChatInput('');
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteTitle.trim()) return;

    const newNote = {
      id: `n-${Date.now()}`,
      title: newNoteTitle.trim(),
      content: newNoteContent.trim() || 'No additional details.',
      date: new Date().toISOString().slice(0, 10),
    };

    const existingNotes = selectedClone.simulatedData?.notes || [];
    onUpdateCloneData(selectedClone.id, {
      ...selectedClone.simulatedData,
      notes: [newNote, ...existingNotes],
    });

    setNewNoteTitle('');
    setNewNoteContent('');
  };

  return (
    <div className="space-y-6">
      
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-900 border border-slate-800 rounded-2xl">
        <div className="flex items-center gap-3 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider shrink-0">
            Active Container:
          </span>
          <div className="flex gap-2">
            {clones.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCloneId(c.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all shrink-0 ${
                  c.id === selectedClone.id
                    ? 'border-purple-500 bg-purple-950/50 text-white ring-1 ring-purple-500/50'
                    : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:text-slate-200'
                }`}
              >
                <AppIcon
                  iconSvg={installedApps.find((a) => a.id === c.originalAppId)?.iconSvg}
                  iconBg={installedApps.find((a) => a.id === c.originalAppId)?.iconBg}
                  hueRotateDeg={c.iconConfig.hueRotateDeg}
                  badgeText={c.iconConfig.badgeText}
                  badgeColor={c.iconConfig.badgeColor}
                  showBadge={true}
                  size="sm"
                />
                <span className="truncate max-w-[130px]">{c.customName}</span>
              </button>
            ))}
          </div>
        </div>

        {/* View & Session Actions */}
        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <button
            onClick={() => setIsSplitMode(!isSplitMode)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
              isSplitMode
                ? 'bg-blue-600 text-white border-blue-500'
                : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            <Split className="h-3.5 w-3.5" />
            <span>{isSplitMode ? 'Dual View' : 'Single Clone View'}</span>
          </button>

          <button
            onClick={() => onSendNotification(selectedClone, 'Push Simulation', `New activity in ${selectedClone.customName}`)}
            title="Simulate notification for this clone"
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs flex items-center gap-1"
          >
            <Bell className="h-3.5 w-3.5 text-amber-400" />
            <span className="hidden sm:inline">Send Alert</span>
          </button>

          <button
            onClick={() => onClearCache(selectedClone.id)}
            title="Clear isolated cache"
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs flex items-center gap-1"
          >
            <Trash2 className="h-3.5 w-3.5 text-red-400" />
            <span className="hidden sm:inline">Clear Cache</span>
          </button>
        </div>
      </div>

      {/* Main Dual View Container */}
      <div className={`grid gap-6 ${isSplitMode ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
        
        {/* PANEL 1: ORIGINAL INSTALLED APP (Account 1 - Personal) */}
        {isSplitMode && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden flex flex-col h-[580px] shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-slate-950/80 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <AppIcon
                  iconSvg={originalApp?.iconSvg}
                  iconBg={originalApp?.iconBg}
                  size="sm"
                  showBadge={false}
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white">{originalApp?.name}</span>
                    <span className="text-[10px] text-emerald-400 font-medium">Account 1 (Original)</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono truncate">{originalApp?.packageName}</p>
                </div>
              </div>
              <div className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                <HardDrive className="h-3 w-3 text-slate-500" />
                <span>{originalApp?.originalDataSizeMb.toFixed(1)} MB</span>
              </div>
            </div>

            {/* Chat Messages Feed */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-950/40">
              <div className="text-center my-1">
                <span className="text-[10px] text-slate-500 bg-slate-900/80 px-2 py-0.5 rounded-full border border-slate-800">
                  Primary Android Profile Storage (/data/data/{originalApp?.packageName})
                </span>
              </div>

              {originalMessages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col ${m.isMe ? 'items-end' : 'items-start'}`}
                >
                  <span className="text-[10px] text-slate-400 mb-0.5 px-1">{m.sender}</span>
                  <div
                    className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-xs shadow-sm ${
                      m.isMe
                        ? 'bg-blue-600 text-white rounded-br-xs'
                        : 'bg-slate-800 text-slate-200 rounded-bl-xs border border-slate-700/60'
                    }`}
                  >
                    <p>{m.text}</p>
                    <span className="text-[9px] opacity-70 block text-right mt-1">{m.time}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Message input */}
            <form
              onSubmit={handleSendOriginalMessage}
              className="p-3 border-t border-slate-800 bg-slate-950/70 flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Type message in Account 1..."
                value={originalChatInput}
                onChange={(e) => setOriginalChatInput(e.target.value)}
                className="flex-1 px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-colors cursor-pointer"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        )}

        {/* PANEL 2: VIRTUAL CLONED APP (Account 2 - Sandboxed) */}
        <div className="rounded-2xl border border-purple-900/60 bg-slate-900 overflow-hidden flex flex-col h-[580px] shadow-xl ring-1 ring-purple-500/20">
          
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-purple-950/30 border-b border-purple-900/50">
            <div className="flex items-center gap-2.5">
              <AppIcon
                iconSvg={originalApp?.iconSvg}
                iconBg={originalApp?.iconBg}
                hueRotateDeg={selectedClone.iconConfig.hueRotateDeg}
                badgeText={selectedClone.iconConfig.badgeText}
                badgeColor={selectedClone.iconConfig.badgeColor}
                showBadge={true}
                size="sm"
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white">{selectedClone.customName}</span>
                  <span className="text-[10px] text-purple-400 font-medium">
                    Clone #{selectedClone.cloneNumber} (Isolated)
                  </span>
                </div>
                <p className="text-[10px] text-purple-300/80 font-mono truncate">
                  {selectedClone.clonePackageName}
                </p>
              </div>
            </div>

            {/* Status pills */}
            <div className="flex items-center gap-2">
              {selectedClone.sandboxConfig.fakeGpsEnabled && (
                <span className="text-[10px] text-emerald-300 bg-emerald-950/60 border border-emerald-800 px-1.5 py-0.5 rounded flex items-center gap-1">
                  <MapPin className="h-2.5 w-2.5" />
                  <span>GPS Spoofed</span>
                </span>
              )}
              {selectedClone.isLocked && (
                <span className="text-[10px] text-amber-300 bg-amber-950/60 border border-amber-800 px-1.5 py-0.5 rounded flex items-center gap-1">
                  <Shield className="h-2.5 w-2.5" />
                  <span>Locked</span>
                </span>
              )}
            </div>
          </div>

          {/* Sub-tabs: Messages vs Notes vs Container Info */}
          <div className="flex items-center gap-1 px-4 py-2 bg-slate-950/60 border-b border-slate-800 text-xs">
            <button
              onClick={() => setActiveTabApp('chat')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                activeTabApp === 'chat'
                  ? 'bg-purple-900/60 text-purple-200 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Dual Chat Messages
            </button>
            <button
              onClick={() => setActiveTabApp('notes')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                activeTabApp === 'notes'
                  ? 'bg-purple-900/60 text-purple-200 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Isolated Notes &amp; Files
            </button>
            <button
              onClick={() => setActiveTabApp('info')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                activeTabApp === 'info'
                  ? 'bg-purple-900/60 text-purple-200 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Container Specs
            </button>
          </div>

          {/* Tab 1: Chat Feed */}
          {activeTabApp === 'chat' && (
            <>
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-950/40">
                <div className="text-center my-1">
                  <span className="text-[10px] text-purple-300/80 bg-purple-950/50 px-2 py-0.5 rounded-full border border-purple-800/60">
                    Isolated Storage Sandbox · Session ID: nac_usr_{selectedClone.cloneNumber}
                  </span>
                </div>

                {cloneMessages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex flex-col ${m.isMe ? 'items-end' : 'items-start'}`}
                  >
                    <span className="text-[10px] text-purple-300 mb-0.5 px-1">{m.sender}</span>
                    <div
                      className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-xs shadow-sm ${
                        m.isMe
                          ? 'bg-purple-600 text-white rounded-br-xs'
                          : 'bg-slate-800 text-slate-200 rounded-bl-xs border border-purple-900/40'
                      }`}
                    >
                      <p>{m.text}</p>
                      <span className="text-[9px] opacity-70 block text-right mt-1">{m.time}</span>
                    </div>
                  </div>
                ))}
              </div>

              <form
                onSubmit={handleSendCloneMessage}
                className="p-3 border-t border-slate-800 bg-slate-950/70 flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder={`Type message in ${selectedClone.customName}...`}
                  value={cloneChatInput}
                  onChange={(e) => setCloneChatInput(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
                <button
                  type="submit"
                  className="p-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white transition-colors cursor-pointer"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </>
          )}

          {/* Tab 2: Isolated Notes */}
          {activeTabApp === 'notes' && (
            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-950/40">
              <form onSubmit={handleAddNote} className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <input
                  type="text"
                  placeholder="New isolated note title..."
                  value={newNoteTitle}
                  onChange={(e) => setNewNoteTitle(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                />
                <textarea
                  rows={2}
                  placeholder="Content stored in isolated SQLite sandbox..."
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-purple-500 resize-none"
                />
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-medium cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Save to Sandbox</span>
                </button>
              </form>

              <div className="space-y-2.5">
                {(selectedClone.simulatedData?.notes || []).map((note) => (
                  <div key={note.id} className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold text-white">{note.title}</h4>
                      <span className="text-[10px] text-slate-500 font-mono">{note.date}</span>
                    </div>
                    <p className="text-xs text-slate-300 whitespace-pre-wrap">{note.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 3: Container Specs */}
          {activeTabApp === 'info' && (
            <div className="flex-1 p-5 overflow-y-auto space-y-4 text-xs text-slate-300">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Virtual Storage Architecture
                </h4>
                <div className="space-y-1 font-mono text-[11px] text-slate-400">
                  <p>Data Path: /data/user/{10 + selectedClone.cloneNumber}/{selectedClone.originalPackageName}/</p>
                  <p>Database: databases/app_isolated.db (SQLite 3.42, WAL mode)</p>
                  <p>Storage Size: {selectedClone.dataSizeMb} MB · Cache: {selectedClone.cacheSizeMb} MB</p>
                  <p>Sandbox Key: AES-256 GCM (Derived via Android Keystore)</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase">Work Profile Status</span>
                  <p className="font-semibold text-emerald-400 mt-0.5">Active (DevicePolicyManager)</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase">Launch Count</span>
                  <p className="font-semibold text-white mt-0.5">{selectedClone.launchCount} Sessions</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase">Fake GPS Geolocation</span>
                  <p className="font-semibold text-slate-200 mt-0.5">
                    {selectedClone.sandboxConfig.fakeCoordinates?.city || 'Default Hardware GPS'}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase">Notification Channel</span>
                  <p className="font-semibold text-purple-400 mt-0.5">Isolated Ringtone &amp; DND</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-900/40 text-blue-300">
                <p className="font-semibold">Narendra App Cloner Virtual Process Isolation</p>
                <p className="text-[11px] text-blue-300/80 mt-1">
                  Processes execute under UID 10000 + clone index, guaranteeing zero memory leak or cross-session state pollution with the primary app.
                </p>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
