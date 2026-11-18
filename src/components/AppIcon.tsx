import React from 'react';
import {
  MessageCircle,
  Send,
  Camera,
  Hash,
  FileText,
  Coins,
  Twitter,
  Globe,
  Smartphone,
  Box,
} from 'lucide-react';

interface AppIconProps {
  iconSvg?: string;
  iconBg?: string;
  hueRotateDeg?: number;
  badgeText?: string;
  badgeColor?: string;
  borderColor?: string;
  showBadge?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const AppIcon: React.FC<AppIconProps> = ({
  iconSvg = 'box',
  iconBg = 'from-blue-600 to-indigo-700',
  hueRotateDeg = 0,
  badgeText,
  badgeColor = '#3b82f6',
  borderColor,
  showBadge = true,
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-9 h-9 rounded-xl',
    md: 'w-12 h-12 rounded-2xl',
    lg: 'w-16 h-16 rounded-2xl',
    xl: 'w-20 h-20 rounded-3xl',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-10 h-10',
  };

  const renderIcon = () => {
    const cls = `${iconSizes[size]} text-white drop-shadow`;
    switch (iconSvg) {
      case 'message-circle':
        return <MessageCircle className={cls} />;
      case 'send':
        return <Send className={cls} />;
      case 'camera':
        return <Camera className={cls} />;
      case 'hash':
        return <Hash className={cls} />;
      case 'file-text':
        return <FileText className={cls} />;
      case 'coins':
        return <Coins className={cls} />;
      case 'twitter':
        return <Twitter className={cls} />;
      case 'globe':
        return <Globe className={cls} />;
      default:
        return <Smartphone className={cls} />;
    }
  };

  return (
    <div className={`relative inline-block select-none ${className}`}>
      {/* 3D Icon Container */}
      <div
        className={`${sizeClasses[size]} bg-gradient-to-br ${iconBg} p-0.5 flex items-center justify-center shadow-lg transition-transform duration-200`}
        style={{
          filter: hueRotateDeg !== 0 ? `hue-rotate(${hueRotateDeg}deg)` : undefined,
          boxShadow: borderColor ? `0 0 0 2px ${borderColor}, 0 8px 16px -4px rgba(0,0,0,0.4)` : undefined,
        }}
      >
        <div className="w-full h-full rounded-[inherit] flex items-center justify-center bg-black/10">
          {renderIcon()}
        </div>
      </div>

      {/* Floating Badge (e.g. WORK, 2, VIP, CLONE) */}
      {showBadge && badgeText && (
        <span
          className="absolute -bottom-1 -right-1 text-[9px] font-bold text-white px-1.5 py-0.5 rounded-md shadow-md border border-white/20 uppercase tracking-wider"
          style={{ backgroundColor: badgeColor }}
        >
          {badgeText}
        </span>
      )}
    </div>
  );
};
