
import React, { useEffect, useState } from 'react';
import { Panel, UserLink, RankBadge, RoleBadge, formatDate } from './UI';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { UserRole } from '../types';
import { formatRelativeTime } from '../utils/formatter';

export const Sidebar = () => {
    const { user, userProfile } = useAuth();
    const [staffOnline, setStaffOnline] = useState<any[]>([]);
    const [recentActivity, setRecentActivity] = useState<any[]>([]);
    
    useEffect(() => {
        const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);
        
        const qStaff = query(
            collection(db, "users"), 
            where("role", "in", ["Root", "Admin", "Mod"])
        );

        const unsubStaff = onSnapshot(qStaff, (snap) => {
            const list = snap.docs.map(d => ({ uid: d.id, ...d.data() }));
            
            const online = list.filter((u: any) => {
                if (!u.lastActive) return false;
                const time = u.lastActive.toMillis ? u.lastActive.toMillis() : new Date(u.lastActive).getTime();
                return time > fiveMinsAgo.getTime();
            });

            online.sort((a: any, b: any) => {
                const timeA = a.lastActive?.toMillis ? a.lastActive.toMillis() : new Date(a.lastActive || 0).getTime();
                const timeB = b.lastActive?.toMillis ? b.lastActive.toMillis() : new Date(b.lastActive || 0).getTime();
                return timeB - timeA;
            });

            setStaffOnline(online.slice(0, 10));
        });

        const qAct = query(collection(db, "replies"), orderBy("createdAt", "desc"), limit(5));
        const unsubAct = onSnapshot(qAct, (snap) => {
            setRecentActivity(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        return () => { unsubStaff(); unsubAct(); };
    }, []);

    return (
        <div className="w-[220px] shrink-0 flex flex-col gap-4">
            {/* User Stats Panel */}
            {user && (
                <Panel title="My Stats">
                    <div className="p-3 text-xs">
                        <div className="flex items-center gap-3 mb-3 border-b border-border pb-3">
                            <img src={userProfile?.avatarUrl || `https://ui-avatars.com/api/?name=${userProfile?.username}`} className="w-10 h-10 border border-border" />
                            <div>
                                <div className="font-bold text-white">{userProfile?.username}</div>
                                <RoleBadge role={userProfile?.role || UserRole.USER} />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <div className="flex justify-between">
                                <span className="text-textMuted">Credits:</span>
                                <span className="text-accent font-bold font-mono">{userProfile?.credits || 0}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-textMuted">Reputation:</span>
                                <span className={userProfile?.reputation >= 0 ? "text-green-500 font-bold" : "text-red-500 font-bold"}>{userProfile?.reputation || 0}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-textMuted">Posts:</span>
                                <span>{userProfile?.postCount || 0}</span>
                            </div>
                        </div>
                    </div>
                </Panel>
            )}

            {/* Staff Online */}
            <Panel title="Staff Online">
                <div className="p-2">
                    {staffOnline.length === 0 ? (
                        <div className="text-[10px] text-textMuted italic text-center py-2">No staff online.</div>
                    ) : (
                        <div className="flex flex-col gap-1">
                            {staffOnline.map(s => (
                                <div key={s.uid} className="flex justify-between items-center bg-[#151515] px-2 py-1 border border-border">
                                    <UserLink name={s.username} role={s.role} />
                                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </Panel>

            {/* Recent Activity */}
            <Panel title="Recent Activity">
                <table className="w-full">
                    <tbody>
                        {recentActivity.map((a, i) => (
                            <tr key={a.id} className={i%2===0 ? 'bg-trow1' : 'bg-trow2'}>
                                <td className="p-2 border-b border-[#222]">
                                    <div className="text-[10px] truncate max-w-[180px]">
                                        <UserLink name={a.authorName} /> posted...
                                    </div>
                                    <div className="text-[9px] text-textMuted text-right">{formatRelativeTime(a.createdAt)}</div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Panel>
        </div>
    );
};
