
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { UserLink } from './UI';
import { UserRole } from '../types';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export const Navbar = () => {
  const { user, userProfile, logout } = useAuth();
  const { openAuthModal, openProfileModal } = useUI();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
      if (!user) return;
      const q = query(collection(db, "notifications"), where("toUserId", "==", user.uid), where("read", "==", false));
      const unsub = onSnapshot(q, (snap) => {
          setUnreadCount(snap.size);
      });
      return () => unsub();
  }, [user]);

  return (
    <div className="w-full mb-6">
      {/* Top Meta Bar */}
      <div className="bg-panel border-b border-border px-4 py-1.5 text-xs text-textMuted flex justify-between items-center font-mono">
         <div>
            <span className="text-accent font-bold">xBOARD</span> System v2.1 // <span className="text-gray-500">Encrypted</span>
         </div>
         <div className="flex gap-4">
             <span>{new Date().toLocaleDateString()}</span>
             {user ? (
                 <span className="text-red-400 hover:text-red-300 cursor-pointer font-bold" onClick={logout}>[LOGOUT]</span>
             ) : (
                 <span className="text-accent hover:text-white cursor-pointer font-bold" onClick={openAuthModal}>[LOGIN]</span>
             )}
         </div>
      </div>

      {/* Main Header */}
      <div className="bg-panel p-6 flex items-end justify-between border-b border-border">
         <div className="flex items-end gap-2">
            <Link to="/" className="text-4xl font-black font-sans tracking-tighter text-white drop-shadow-[0_0_10px_rgba(103,232,249,0.1)]">
                x<span className="text-accent">BOARD</span>
            </Link>
         </div>
         
         <div className="bg-background border border-border p-3 text-xs flex gap-4 items-center min-w-[300px] justify-end shadow-sm">
            {user && userProfile ? (
              <>
                 <div className="flex items-center gap-3">
                    <img src={userProfile.avatarUrl || `https://ui-avatars.com/api/?name=${userProfile.username}`} className="w-8 h-8 border border-border bg-black" />
                    <div className="flex flex-col text-right">
                        <UserLink name={userProfile.username} role={userProfile.role} onClick={() => openProfileModal(userProfile.uid)} className="text-sm" />
                        <span className="text-[10px] text-textMuted uppercase tracking-wider flex items-center justify-end gap-2">
                            Inbox: 
                            <Link to="/inbox" className={`font-bold flex items-center gap-1 ${unreadCount > 0 ? 'text-white' : 'text-textMuted'}`}>
                                {unreadCount > 0 && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_5px_rgba(239,68,68,0.8)]"></span>}
                                {unreadCount}
                            </Link>
                        </span>
                    </div>
                 </div>
              </>
            ) : (
               <div className="text-xs text-right text-textMuted">
                  Welcome, Guest.<br/>
                  Please <button onClick={openAuthModal} className="text-accent font-bold hover:underline">Register</button> or <button onClick={openAuthModal} className="text-white hover:underline">Login</button>.
               </div>
            )}
         </div>
      </div>

      {/* Navigation Bar */}
      <div className="bg-panel border-y border-border border-b-accent/30 text-xs font-bold text-textMuted px-4 py-0 flex gap-0 shadow-[0_4px_15px_rgba(103,232,249,0.05)]">
          <Link to="/" className="px-4 py-3 hover:bg-accent/5 hover:text-accent transition-colors border-r border-border">HOME</Link>

          <Link to="/inbox" className="px-4 py-3 hover:bg-accent/5 hover:text-accent transition-colors border-r border-border relative">
              MESSAGES
              {unreadCount > 0 && <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>}
          </Link>
          <Link to="/search" className="px-4 py-3 hover:bg-accent/5 hover:text-accent transition-colors border-r border-border">SEARCH</Link>
          <Link to="/members" className="px-4 py-3 hover:bg-accent/5 hover:text-accent transition-colors border-r border-border">MEMBERS</Link>
          <Link to="/calendar" className="px-4 py-3 hover:bg-accent/5 hover:text-accent transition-colors border-r border-border">CALENDAR</Link>
          {(userProfile?.role === UserRole.ADMIN || userProfile?.role === UserRole.ROOT) && (
             <Link to="/admin" className="px-4 py-3 hover:bg-red-900/10 hover:text-red-400 transition-colors ml-auto border-l border-border">ADMIN CP</Link>
          )}
          {(userProfile?.role === UserRole.ADMIN || userProfile?.role === UserRole.ROOT || userProfile?.role === UserRole.MOD) && (
             <Link to="/modcp" className="px-4 py-3 hover:bg-green-900/10 hover:text-green-400 transition-colors border-l border-border">MOD QUEUE</Link>
          )}
      </div>
    </div>
  );
};
