
import React, { useState, useEffect } from 'react';
import { collection, query, limit, getDocs, orderBy, startAfter, where } from 'firebase/firestore';
import { db } from '../firebase';
import { UserRole } from '../types';
import { UserLink, RoleBadge, formatDate, UserAvatar } from '../components/UI';
import { useUI } from '../context/UIContext';
import { Link } from 'react-router-dom';

export const MemberList = () => {
    const { openProfileModal } = useUI();
    const [members, setMembers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchMembers = async () => {
            setLoading(true);
            try {
                // Client side search for simplicity due to firebase index constraints
                // We'll fetch last 100 users for now
                const q = query(collection(db, "users"), limit(100)); 
                const snap = await getDocs(q);
                const list = snap.docs.map(d => ({ uid: d.id, ...d.data() }));
                
                // Sort client side by ID if userId exists, else date
                list.sort((a: any, b: any) => (a.userId || 0) - (b.userId || 0));
                
                setMembers(list);
            } catch (e) { console.error(e); }
            setLoading(false);
        };
        fetchMembers();
    }, []);

    const filteredMembers = members.filter(m => 
        m.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="max-w-[950px] mx-auto p-2">
            <div className="text-xs text-textMuted mb-2">
                <Link to="/">xBOARD</Link> / Member List
            </div>

            <div className="mb-4 bg-trow1 border border-black p-2 flex justify-between items-center">
                <div className="text-xs font-bold text-white">Member List</div>
                <input 
                    placeholder="Search Username..." 
                    className="w-48"
                    value={searchTerm} 
                    onChange={e => setSearchTerm(e.target.value)} 
                />
            </div>

            <table cellSpacing="1" cellPadding="4">
                <thead>
                    <tr>
                        <th className="thead" width="50">Avatar</th>
                        <th className="thead">Username</th>
                        <th className="thead" width="100" align="center">Role</th>
                        <th className="thead" width="100" align="center">Posts</th>
                        <th className="thead" width="150" align="right">Joined</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        <tr><td colSpan={5} className="trow1 text-center p-4">Loading members...</td></tr>
                    ) : filteredMembers.map((m, i) => (
                        <tr key={m.uid}>
                            <td className={i%2===0 ? 'trow1' : 'trow2'} align="center">
                                <img src={m.avatarUrl || `https://ui-avatars.com/api/?name=${m.username}`} className="w-8 h-8 border border-black" />
                            </td>
                            <td className={i%2===0 ? 'trow1' : 'trow2'}>
                                <UserLink name={m.username} role={m.role} onClick={() => openProfileModal(m.uid)} className="text-[13px]" />
                            </td>
                            <td className={i%2===0 ? 'trow1' : 'trow2'} align="center">
                                <RoleBadge role={m.role} />
                            </td>
                            <td className={i%2===0 ? 'trow1' : 'trow2'} align="center">
                                {m.postCount || 0}
                            </td>
                            <td className={i%2===0 ? 'trow1' : 'trow2'} align="right">
                                <span className="text-[10px] text-textMuted">{formatDate(m.createdAt)}</span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
