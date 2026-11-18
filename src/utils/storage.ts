import { ClonedApp, InstalledApp, SecuritySettings, NotificationItem } from '../types';
import { DEFAULT_INSTALLED_APPS, INITIAL_CLONED_APPS } from '../data/defaultApps';
import confetti from 'canvas-confetti';

const STORAGE_KEYS = {
  INSTALLED_APPS: 'nac_installed_apps',
  CLONED_APPS: 'nac_cloned_apps',
  SECURITY: 'nac_security_settings',
  NOTIFICATIONS: 'nac_notifications',
  DARK_MODE: 'nac_dark_mode',
};

export const DEFAULT_SECURITY_SETTINGS: SecuritySettings = {
  isLockEnabled: true,
  lockType: 'pin',
  pinCode: '1234',
  patternPath: [0, 1, 2, 5, 8], // Z or L shaped pattern
  isBiometricAvailable: true,
  stealthDisguise: 'none',
  autoLockDelaySeconds: 0,
  lockedAppIds: ['clone-whatsapp-work', 'clone-whatsapp-secret', 'clone-notes-private'],
  isVaultLocked: false,
};

export const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    clonedAppId: 'clone-whatsapp-work',
    appName: 'WhatsApp (Work)',
    title: 'Rahul (Tech Lead)',
    body: 'Narendra, the Native Android APK build succeeded on GitHub Actions!',
    time: '12m ago',
    read: false,
  },
  {
    id: 'notif-2',
    clonedAppId: 'clone-telegram-crypto',
    appName: 'Telegram (Alpha)',
    title: 'Alpha Signal Bot',
    body: 'BTC resistance broken. Target 2 reached.',
    time: '1h ago',
    read: false,
  },
  {
    id: 'notif-3',
    clonedAppId: 'clone-notes-private',
    appName: 'Vault Notes',
    title: 'Encrypted Vault',
    body: 'Automated AES-256 local snapshot secured.',
    time: '3h ago',
    read: true,
  },
];

export function loadInstalledApps(): InstalledApp[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.INSTALLED_APPS);
    if (!raw) return DEFAULT_INSTALLED_APPS;
    return JSON.parse(raw);
  } catch {
    return DEFAULT_INSTALLED_APPS;
  }
}

export function saveInstalledApps(apps: InstalledApp[]) {
  localStorage.setItem(STORAGE_KEYS.INSTALLED_APPS, JSON.stringify(apps));
}

export function loadClonedApps(): ClonedApp[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CLONED_APPS);
    if (!raw) return INITIAL_CLONED_APPS;
    return JSON.parse(raw);
  } catch {
    return INITIAL_CLONED_APPS;
  }
}

export function saveClonedApps(clones: ClonedApp[]) {
  localStorage.setItem(STORAGE_KEYS.CLONED_APPS, JSON.stringify(clones));
}

export function loadSecuritySettings(): SecuritySettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SECURITY);
    if (!raw) return DEFAULT_SECURITY_SETTINGS;
    return { ...DEFAULT_SECURITY_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SECURITY_SETTINGS;
  }
}

export function saveSecuritySettings(settings: SecuritySettings) {
  localStorage.setItem(STORAGE_KEYS.SECURITY, JSON.stringify(settings));
}

export function loadNotifications(): NotificationItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    if (!raw) return DEFAULT_NOTIFICATIONS;
    return JSON.parse(raw);
  } catch {
    return DEFAULT_NOTIFICATIONS;
  }
}

export function saveNotifications(notifs: NotificationItem[]) {
  localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifs));
}

export function triggerConfetti() {
  try {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4'],
    });
  } catch {
    // fallback ignore
  }
}

/**
 * Build backup of clones and settings as formatted JSON string
 */
export function buildClonerBackupJson(clones: ClonedApp[], security: SecuritySettings): string {
  const backup = {
    appName: 'Narendra App Cloner',
    developer: 'Narendra Maurya',
    email: 'narendramauryagkp@gmail.com',
    exportedAt: new Date().toISOString(),
    version: '1.0.0',
    clones,
    security: {
      isLockEnabled: security.isLockEnabled,
      lockType: security.lockType,
      stealthDisguise: security.stealthDisguise,
      lockedAppIds: security.lockedAppIds,
    },
  };

  return JSON.stringify(backup, null, 2);
}
