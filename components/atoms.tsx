
import React from 'react';
import { UserRole } from '../types';

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-panel border border-border shadow-sm rounded-sm ${className}`}>
    {children}
  </div>
);

export const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'danger' | 'ghost' }>(
  ({ className = '', variant = 'ghost', ...props }, ref) => {
    const base = "px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-sm transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";
    const variants = {
      primary: "bg-accent text-white hover:brightness-110 shadow-[0_0_10px_rgba(88,166,255,0.2)]",
      danger: "bg-red-900/20 text-red-400 border border-red-900/50 hover:bg-red-900/40",
      ghost: "bg-transparent text-textMuted hover:text-white hover:bg-white/5 border border-transparent hover:border-border"
    };
    
    return <button ref={ref} className={`${base} ${variants[variant]} ${className}`} {...props} />;
  }
);

export const RoleBadge = ({ role }: { role: UserRole }) => {
  const styles = {
    [UserRole.ROOT]: "text-white bg-red-600 px-1.5 py-0.5 shadow-[0_0_15px_rgba(220,38,38,0.6)] border border-red-400",
    [UserRole.ADMIN]: "text-red-400 border-red-900/50",
    [UserRole.MOD]: "text-green-400 border-green-900/50",
    [UserRole.ELITE]: "text-cyan-400 border-cyan-500 shadow-[0_0_10px_rgba(34,211,238,0.3)]",
    [UserRole.VIP]: "text-purple-400 border-purple-900/50",
    [UserRole.USER]: "text-gray-400 border-transparent",
    [UserRole.BANNED]: "text-gray-600 line-through decoration-red-500",
    [UserRole.RICH]: "text-yellow-400 border-yellow-900/50",
  };

  return (
    <span className={`text-[10px] font-black tracking-widest border rounded ${styles[role] || styles[UserRole.USER]}`}>
      {role.toUpperCase()}
    </span>
  );
};
