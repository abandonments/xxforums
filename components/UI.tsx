
import React, { memo } from 'react';
import { UserRole } from '../types';
import { formatDate as formatDt } from '../utils/formatter';
import { BADGE_INFO } from '../lib/constants';

export const formatDate = (date: any) => formatDt(date);

export const Button = memo(({ className = '', variant = 'default', children, ...props }: any) => {
  let variantStyles = 'bg-panel text-textMain border-border hover:bg-[#27272a] hover:text-white';
  
  if (variant === 'primary') {
    variantStyles = 'bg-accent text-background font-bold border-accent hover:bg-white hover:text-black hover:border-white shadow-[0_0_15px_rgba(103,232,249,0.2)]';
  } else if (variant === 'danger') {
    variantStyles = 'bg-red-900/10 border-red-900/50 text-red-400 hover:bg-red-900/20';
  }

  return (
    <button
      className={`px-3 py-1.5 text-xs uppercase tracking-wide border transition-all duration-200 cursor-pointer active:translate-y-[1px] disabled:opacity-50 disabled:cursor-not-allowed ${variantStyles} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
});

export const RoleBadge = memo(({ role, className = '' }: { role: UserRole; className?: string }) => {
  if (role === UserRole.ROOT) return <span className={`text-red-500 font-bold drop-shadow-[0_0_5px_rgba(239,68,68,0.4)] ${className}`}>ROOT</span>;
  if (role === UserRole.ADMIN) return <span className={`text-red-400 font-bold ${className}`}>ADMIN</span>;
  if (role === UserRole.MOD) return <span className={`text-green-400 font-bold ${className}`}>MOD</span>;
  if (role === UserRole.ELITE) return <span className={`text-accent font-bold border border-accent/30 px-1 shadow-[0_0_8px_rgba(103,232,249,0.2)] bg-accent/5 ${className}`}>ELITE</span>;
  if (role === UserRole.VIP) return <span className={`text-purple-400 font-bold ${className}`}>VIP</span>;
  if (role === UserRole.BANNED) return <span className={`text-textMuted line-through ${className}`}>BANNED</span>;
  return <span className={`text-textMuted font-bold ${className}`}>{role}</span>;
});

export const RankBadge = memo(({ postCount = 0 }: { postCount?: number }) => {
  let stars = 1;
  if (postCount > 50) stars = 2;
  if (postCount > 150) stars = 3;
  if (postCount > 500) stars = 4;
  if (postCount > 1000) stars = 5;

  return (
      <div className="mt-1">
          <div className="text-[9px] text-textMuted font-mono">{postCount > 1000 ? 'GODLIKE' : 'Member'}</div>
          <div className="text-accent text-[8px] tracking-widest opacity-80">{'★'.repeat(stars)}</div>
      </div>
  );
});

export const UserAvatar = memo(({ url, name, lastActive, className = '' }: any) => {
    return (
        <div className={`p-[1px] bg-border border border-background inline-block ${className}`}>
             <img src={url || `https://ui-avatars.com/api/?name=${name}&background=18181b&color=e4e4e7`} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-300" alt="Avatar" />
        </div>
    );
});

export const Inventory = memo(({ items }: { items?: string[] }) => {
    if (!items || items.length === 0) return null;
    return (
        <div className="flex flex-wrap gap-1 mt-1 px-1">
            {items.map((item, i) => {
                 const info = BADGE_INFO[item] || { icon: 'https://cdn.jsdelivr.net/gh/famfamfam/silk-icons/icons/help.png', name: item };
                 return (
                     <img 
                        key={i} 
                        src={info.icon} 
                        alt={info.name} 
                        title={info.name}
                        className="w-4 h-4 opacity-75 hover:opacity-100 transition-opacity cursor-help" 
                     />
                 );
            })}
        </div>
    );
});

export const OnlineStatus = memo(({ lastActive }: { lastActive: any }) => {
    const isOnline = lastActive && (Date.now() - (lastActive.toMillis ? lastActive.toMillis() : new Date(lastActive).getTime()) < 5 * 60 * 1000);
    return isOnline ? <span className="text-green-500 font-bold text-[16px] leading-none">•</span> : <span className="text-gray-600 font-bold text-[16px] leading-none">•</span>;
});

export const Skeleton = memo(({ className = '' }: { className?: string }) => (
    <div className={`bg-trow1 border border-border ${className}`}></div>
));

export const UserLink = memo(({ name, role = UserRole.USER, onClick, className = '' }: any) => {
  let color = 'text-[#999]';
  if (role === UserRole.ROOT) color = 'text-red-500 font-bold drop-shadow-[0_0_3px_rgba(239,68,68,0.3)]';
  else if (role === UserRole.ADMIN) color = 'text-red-400 font-bold';
  else if (role === UserRole.MOD) color = 'text-green-400 font-bold';
  else if (role === UserRole.ELITE) color = 'text-accent font-bold drop-shadow-[0_0_3px_rgba(103,232,249,0.3)]';
  else if (role === UserRole.VIP) color = 'text-purple-400 font-bold';
  else if (role === UserRole.RICH) color = 'text-yellow-400 font-bold';
  else if (role === UserRole.BANNED) color = 'text-textMuted line-through';

  return (
    <span
      className={`${color} cursor-pointer hover:text-white transition-colors ${className}`}
      onClick={onClick}
    >
      {name}
    </span>
  );
});

// Emulates a MyBB "Table Border" container, updated for Icy Dark Theme
export const Panel = memo(({ children, title, className = '' }: { children?: React.ReactNode; title?: string; className?: string }) => (
  <div className={`w-full mb-6 ${className}`}>
    <div className="bg-panel border border-border shadow-sm">
        {title && (
        <div className="bg-panel text-accent font-bold px-3 py-2 text-xs border-b border-border uppercase tracking-wide flex items-center gap-2">
            <span className="w-1 h-3 bg-accent inline-block shadow-[0_0_8px_rgba(103,232,249,0.6)]"></span>
            {title}
        </div>
        )}
        <div className="bg-background">
            {children}
        </div>
    </div>
  </div>
));
