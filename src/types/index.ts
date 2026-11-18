/**
 * Narendra App Cloner - Types & Interfaces
 * Developer: Narendra Maurya
 */

export type AppCategory = 'social' | 'messaging' | 'productivity' | 'finance' | 'tools' | 'entertainment';

export interface InstalledApp {
  id: string;
  name: string;
  packageName: string;
  versionName: string;
  versionCode: number;
  iconBg: string;
  iconSvg: string; // SVG path or identifier
  category: AppCategory;
  originalDataSizeMb: number;
  isSystemApp?: boolean;
  canClone: boolean;
  cloneCount: number;
}

export interface ClonedApp {
  id: string;
  originalAppId: string;
  originalPackageName: string;
  cloneNumber: number;
  customName: string;
  clonePackageName: string; // e.g. com.narendra.cloner.virtual_user_10.whatsapp
  createdAt: string;
  lastUsedAt: string;
  launchCount: number;
  dataSizeMb: number;
  cacheSizeMb: number;
  isLocked: boolean;
  isHidden: boolean;
  iconConfig: {
    badgeText?: string;
    badgeColor?: string;
    hueRotateDeg: number;
    borderColor?: string;
    showBadge: boolean;
    scale: number;
  };
  sandboxConfig: {
    isolatedStorage: boolean;
    fakeGpsEnabled: boolean;
    fakeCoordinates?: { lat: number; lng: number; city: string };
    independentNotifications: boolean;
    incognitoMode: boolean;
    cameraAccess: boolean;
    microphoneAccess: boolean;
    workProfileMode: boolean;
  };
  simulatedData?: {
    messages?: Array<{ id: string; sender: string; text: string; time: string; isMe: boolean }>;
    notes?: Array<{ id: string; title: string; content: string; date: string }>;
    accountHandle?: string;
    accountAvatar?: string;
  };
}

export interface SecuritySettings {
  isLockEnabled: boolean;
  lockType: 'pin' | 'pattern' | 'biometric';
  pinCode: string; // default e.g. "1234"
  patternPath: number[]; // sequence of dot indices 0-8
  isBiometricAvailable: boolean;
  stealthDisguise: 'none' | 'calculator' | 'fake_crash';
  autoLockDelaySeconds: number; // 0 = immediately
  lockedAppIds: string[]; // IDs of cloned apps that are locked
  isVaultLocked: boolean;
}

export interface AppUsageRecord {
  appId: string;
  appName: string;
  isClone: boolean;
  cloneNumber?: number;
  screenTimeMinutes: number;
  launches: number;
  batteryPercent: number;
  dataUsedMb: number;
}

export interface NotificationItem {
  id: string;
  clonedAppId: string;
  appName: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
}
