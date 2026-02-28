
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, getDocs, getDoc, doc, updateDoc, query, orderBy, limit, onSnapshot, addDoc, serverTimestamp, writeBatch, deleteDoc, runTransaction, where, arrayUnion, arrayRemove, getCountFromServer, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { UserRole } from '../types';
import { CATEGORIES } from '../lib/constants';
import { Link } from 'react-router-dom';
import { formatDate } from '../components/UI';

// --- Theme & Style Definitions ---
const getStyles = () => ({
    // Containers
    pageBg: 'bg-background',
    sidebarBg: 'bg-panel border-r border-border',
    contentBg: 'bg-background',
    panelBg: 'bg-panel',
    
    // Headers
    headerBg: 'bg-trow2',
    subHeaderBg: 'bg-trow1',
    textHeader: 'text-accent font-bold uppercase tracking-wider',
    
    // Borders & Text
    border: 'border-border',
    borderSubtle: 'border-[#27272a]',
    textMain: 'text-textMain',
    textMuted: 'text-textMuted',
    
    // Tables
    tableRow1: 'bg-trow1',
    tableRow2: 'bg-trow2',
    
    // Inputs & Buttons
    input: 'bg-background border-border text-white focus:border-accent',
    button: 'bg-panel border-border text-textMuted hover:bg-trow2 hover:text-white',
});

// --- Helper: Log Action ---
const logSystemAction = async (action: string, details: string, user: any) => {
    try {
        await addDoc(collection(db, "logs"), {
            action,
            details,
            adminId: user.uid,
            adminName: user.username,
            createdAt: serverTimestamp()
        });
    } catch(e) { console.error("Logging failed", e); }
};

// --- Components ---

const ACPDashboard = ({ theme }: { theme: any }) => {
    const { userProfile } = useAuth();
    const [stats, setStats] = useState({ users: 0, threads: 0, replies: 0, size: '0 MB' });
    const [broadcastMsg, setBroadcastMsg] = useState('');
    const [broadcastType, setBroadcastType] = useState('info');
    const [broadcastActive, setBroadcastActive] = useState(false);

    useEffect(() => {
        const load = async () => {
            const u = await getCountFromServer(collection(db, "users"));
            const t = await getCountFromServer(collection(db, "threads"));
            const r = await getCountFromServer(collection(db, "replies"));
            setStats({
                users: u.data().count,
                threads: t.data().count,
                replies: r.data().count,
                size: '2.4 MB'
            });

            // Load existing broadcast
            const b = await getDoc(doc(db, "settings", "global_alert"));
            if (b.exists()) {
                const d = b.data();
                setBroadcastMsg(d.message);
                setBroadcastType(d.type);
                setBroadcastActive(d.isActive);
            }
        };
        load();
    }, []);

    const handleUpdateBroadcast = async () => {
        await setDoc(doc(db, "settings", "global_alert"), {
            message: broadcastMsg,
            type: broadcastType,
            isActive: broadcastActive,
            updatedBy: userProfile.uid,
            updatedAt: serverTimestamp()
        });
        await logSystemAction('BROADCAST_UPDATE', `Updated broadcast: ${broadcastMsg} (${broadcastActive})`, userProfile);
        alert("Broadcast updated.");
    };

    return (
        <div>
            <div className={`${theme.headerBg} ${theme.textHeader} text-sm px-3 py-2 border ${theme.border} mb-4 flex items-center gap-2`}>
                <span className="w-2 h-2 bg-accent rounded-full shadow-[0_0_8px_rgba(103,232,249,0.5)]"></span> Dashboard
            </div>
            <div className={`${theme.panelBg} border ${theme.border} p-6 text-xs ${theme.textMain}`}>
                                <p className="mb-6 font-mono text-accent">&gt; Welcome to the <strong>xBOARD Control Panel</strong>.</p>
                
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-6">
                        <table className={`w-full border-collapse border ${theme.border} text-xs`}>
                            <thead><tr><th colSpan={2} className={`${theme.headerBg} ${theme.textHeader} p-2 text-left`}>Statistics</th></tr></thead>
                            <tbody>
                                <tr><td className={`${theme.tableRow1} p-2 border ${theme.borderSubtle}`} width="50%"><strong>Total Users</strong></td><td className={`${theme.tableRow1} p-2 border ${theme.borderSubtle}`}>{stats.users}</td></tr>
                                <tr><td className={`${theme.tableRow2} p-2 border ${theme.borderSubtle}`}><strong>Total Threads</strong></td><td className={`${theme.tableRow2} p-2 border ${theme.borderSubtle}`}>{stats.threads}</td></tr>
                                <tr><td className={`${theme.tableRow1} p-2 border ${theme.borderSubtle}`}><strong>Total Posts</strong></td><td className={`${theme.tableRow1} p-2 border ${theme.borderSubtle}`}>{stats.replies}</td></tr>
                            </tbody>
                        </table>

                        <div className={`${theme.panelBg} border ${theme.border} p-4`}>
                            <div className="font-bold border-b border-border mb-3 pb-2 text-red-400">Global Broadcast System</div>
                            <div className="space-y-3">
                                <div>
                                    <label className="block mb-1 text-textMuted text-[10px] uppercase font-bold">Message</label>
                                    <input className={`${theme.input} w-full`} value={broadcastMsg} onChange={e => setBroadcastMsg(e.target.value)} />
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <label className="block mb-1 text-textMuted text-[10px] uppercase font-bold">Type</label>
                                        <select className={`${theme.input} w-full`} value={broadcastType} onChange={e => setBroadcastType(e.target.value)}>
                                            <option value="info">Info (Blue)</option>
                                            <option value="warning">Warning (Yellow)</option>
                                            <option value="emergency">Emergency (Red Pulse)</option>
                                        </select>
                                    </div>
                                    <div className="flex items-end">
                                        <label className="flex items-center gap-2 cursor-pointer select-none">
                                            <input type="checkbox" checked={broadcastActive} onChange={e => setBroadcastActive(e.target.checked)} />
                                            <span className={`font-bold ${broadcastActive ? 'text-green-500' : 'text-textMuted'}`}>Active</span>
                                        </label>
                                    </div>
                                </div>
                                <button onClick={handleUpdateBroadcast} className="w-full bg-red-900/20 border border-red-900 text-red-400 font-bold py-2 hover:bg-red-900/30">PUSH BROADCAST</button>
                            </div>
                        </div>
                    </div>

                    <div className={`${theme.panelBg} border ${theme.border} p-4`}>
                        <div className="font-bold border-b border-border mb-3 pb-2 text-accent">Admin Notes</div>
                        <textarea className={`w-full h-32 ${theme.input} resize-none font-mono text-xs`} placeholder="// Write secure notes..."></textarea>
                        <button className={`mt-3 w-full ${theme.button} py-2 font-bold`}>SAVE NOTES</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const UpgradeManager = ({ theme }: { theme: any }) => {
    // ... existing UpgradeManager code (kept as is for brevity in XML unless changed, but I must return full file if I change it. Since I am replacing the file content, I must include all)
    const { userProfile } = useAuth();
    const [payments, setPayments] = useState<any[]>([]);
    const [processingId, setProcessingId] = useState<string | null>(null);
    
    useEffect(() => {
        const q = query(collection(db, "payments"), orderBy("createdAt", "desc"));
        const unsub = onSnapshot(q, (snap) => {
            setPayments(snap.docs.map(d => ({id: d.id, ...d.data()})));
        });
        return () => unsub();
    }, []);

    const handleAcceptPayment = async (e: React.MouseEvent, payment: any) => {
        e.preventDefault(); 
        if(!window.confirm(`Confirm payment for ${payment.username}? This will verify the TXID and upgrade the user.`)) return;
        
        setProcessingId(payment.id);
        try {
            await runTransaction(db, async (transaction) => {
                const paymentRef = doc(db, "payments", payment.id);
                const paymentDoc = await transaction.get(paymentRef);
                if (!paymentDoc.exists()) throw new Error("Payment document does not exist!");

                const userRef = doc(db, "users", payment.userId);
                const userDoc = await transaction.get(userRef);
                if (!userDoc.exists()) throw new Error("User document does not exist!");

                transaction.update(paymentRef, {
                    status: 'confirmed',
                    confirmedAt: serverTimestamp(),
                    confirmedBy: userProfile.uid
                });

                transaction.update(userRef, { role: payment.plan });

                const notifRef = doc(collection(db, "notifications"));
                transaction.set(notifRef, {
                     toUserId: payment.userId,
                     type: "system",
                     message: `Your upgrade to ${payment.plan} has been approved!`,
                     read: false,
                     createdAt: serverTimestamp()
                });
                
                const modLogRef = doc(collection(db, "mod_logs"));
                transaction.set(modLogRef, {
                    action: 'payment_accept',
                    targetId: payment.userId,
                    targetType: 'user',
                    moderatorId: userProfile.uid,
                    moderatorName: userProfile.username,
                    reason: `Payment ${payment.id} accepted. Upgraded to ${payment.plan}.`,
                    createdAt: serverTimestamp()
                });
            });

        } catch(e: any) {
            console.error(e);
            alert("Error processing payment: " + e.message);
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (e: React.MouseEvent, payment: any) => {
        e.preventDefault();
        if(!window.confirm("Reject this payment?")) return;
        
        setProcessingId(payment.id);
        try {
            await updateDoc(doc(db, "payments", payment.id), { status: 'rejected' });
            await logSystemAction('UPGRADE_REJECT', `Rejected payment for ${payment.username}`, userProfile);
        } catch (e: any) {
            alert("Error: " + e.message);
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div>
            <div className={`${theme.headerBg} ${theme.textHeader} text-sm px-3 py-2 border ${theme.border} mb-4`}>Monero Verifications</div>
            <div className={`${theme.panelBg} border ${theme.border} p-0`}>
                <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className={`${theme.subHeaderBg} text-white`}>
                                <th className="p-2 text-left">User</th>
                                <th className="p-2 text-left">Plan</th>
                                <th className="p-2 text-right">Amount</th>
                                <th className="p-2 text-left">TXID</th>
                                <th className="p-2 text-center">Status</th>
                                <th className="p-2 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payments.length === 0 ? <tr><td colSpan={6} className="p-8 text-center italic text-textMuted">No pending transactions.</td></tr> :
                            payments.map((p, i) => (
                                <tr key={p.id} className={i%2===0 ? theme.tableRow1 : theme.tableRow2}>
                                    <td className={`p-2 font-bold ${theme.textMain}`}>{p.username}</td>
                                    <td className="p-2"><span className={`px-1 text-[10px] font-bold border-b border-dashed ${p.plan === 'Elite' ? 'text-accent border-accent' : p.plan === 'Rich' ? 'text-yellow-400 border-yellow-400' : 'text-purple-400 border-purple-400'}`}>{p.plan.toUpperCase()}</span></td>
                                    <td className={`p-2 text-right ${theme.textMain}`}>{p.amount} {p.currency}</td>
                                    <td className="p-2 font-mono text-[9px] text-textMuted max-w-[150px] truncate block hover:text-white cursor-help" title={p.txHash}>{p.txHash}</td>
                                    <td className="p-2 text-center">
                                        <span className={`text-[9px] font-bold uppercase ${p.status === 'confirmed' ? 'text-green-500' : p.status === 'pending' ? 'text-yellow-500 animate-pulse' : 'text-red-500'}`}>
                                            {p.status}
                                        </span>
                                    </td>
                                    <td className="p-2 text-right">
                                        {p.status === 'pending' && (
                                            <div className="flex justify-end gap-2">
                                                <button 
                                                    onClick={(e) => handleAcceptPayment(e, p)} 
                                                    disabled={processingId === p.id}
                                                    className="text-green-500 hover:text-green-300 font-bold border border-green-900 bg-green-900/20 px-2 py-0.5 disabled:opacity-50"
                                                >
                                                    {processingId === p.id ? 'Processing...' : 'ACCEPT'}
                                                </button>
                                                <button 
                                                    onClick={(e) => handleReject(e, p)} 
                                                    disabled={processingId === p.id}
                                                    className="text-red-500 hover:text-red-300 font-bold border border-red-900 bg-red-900/20 px-2 py-0.5 disabled:opacity-50"
                                                >
                                                    {processingId === p.id ? 'Processing...' : 'DENY'}
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const ShoutboxManager = ({ theme }: { theme: any }) => {
    // ... kept as is
    const { userProfile } = useAuth();
    const [clearing, setClearing] = useState(false);
    const [shoutCount, setShoutCount] = useState(0);

    useEffect(() => {
        const loadCount = async () => {
            const coll = collection(db, "shoutbox");
            const snap = await getCountFromServer(coll);
            setShoutCount(snap.data().count);
        };
        loadCount();
    }, [clearing]); 

    const handleClearShoutbox = async () => {
        if (userProfile?.role !== UserRole.ROOT) {
            alert("Access Denied: Only ROOT users can clear the shoutbox.");
            return;
        }

        if (!confirm(`WARNING: This will delete the last 100 shouts from the database.\n\nAre you sure you want to proceed?`)) return;

        setClearing(true);
        try {
            const q = query(collection(db, "shoutbox"), orderBy("createdAt", "desc"), limit(100));
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                alert("Shoutbox is already empty.");
                setClearing(false);
                return;
            }

            const batch = writeBatch(db);
            snapshot.docs.forEach((doc) => {
                batch.delete(doc.ref);
            });

            await batch.commit();
            await logSystemAction('SHOUTBOX_CLEAR', 'Cleared 100 shouts from history', userProfile);
            alert("Shoutbox cleared successfully.");
        } catch (error: any) {
            console.error("Clear error:", error);
            alert("Failed to clear shoutbox: " + error.message);
        } finally {
            setClearing(false);
        }
    };

    return (
        <div>
            <div className={`${theme.headerBg} ${theme.textHeader} text-sm px-3 py-2 border ${theme.border} mb-4`}>Shoutbox Management</div>
            <div className={`${theme.panelBg} border ${theme.border} p-6`}>
                <div className="flex justify-between items-center">
                    <div>
                        <div className="font-bold text-white mb-1">Total Shouts (Approx): {shoutCount}</div>
                        <div className="text-xs text-textMuted">Managing the public chat feed.</div>
                    </div>
                    <div>
                        {userProfile?.role === UserRole.ROOT ? (
                             <button 
                                onClick={handleClearShoutbox} 
                                disabled={clearing}
                                className="bg-red-900/20 border border-red-900 text-red-400 font-bold px-4 py-2 hover:bg-red-900/40 disabled:opacity-50 transition-colors"
                             >
                                {clearing ? 'PURGING...' : 'CLEAR SHOUTBOX'}
                             </button>
                        ) : (
                            <div className="text-xs text-textMuted italic border border-border p-2 bg-black/20">
                                Requires ROOT Access
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const UserManager = ({ theme }: { theme: any }) => {
    // ... kept as is
    const { userProfile } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [users, setUsers] = useState<any[]>([]);
    const [editingUser, setEditingUser] = useState<any>(null);
    const [newItem, setNewItem] = useState('');
    const [msg, setMsg] = useState('');
    
    const searchUsers = async (e: React.FormEvent) => {
        e.preventDefault();
        const q = query(collection(db, "users"), limit(20));
        const snap = await getDocs(q);
        const list = snap.docs.map(d => ({uid: d.id, ...d.data()}) as any);
        setUsers(list.filter(u => u.username.toLowerCase().includes(searchTerm.toLowerCase())));
        setEditingUser(null);
        setMsg('');
    };

    const handleEdit = (u: any) => setEditingUser(u);

    const handleUpdateRole = async (role: string) => {
        if(!editingUser) return;
        await updateDoc(doc(db, "users", editingUser.uid), { role });
        await logSystemAction('USER_ROLE_CHANGE', `Changed ${editingUser.username} role to ${role}`, userProfile);
        setEditingUser({...editingUser, role});
        setMsg(`Role updated to ${role}`);
    };

    const handleBan = async () => {
        if(!editingUser) return;
        if(confirm(`Are you sure you want to BAN ${editingUser.username}?`)) {
            await updateDoc(doc(db, "users", editingUser.uid), { role: UserRole.BANNED });
            await logSystemAction('USER_BAN', `Banned user ${editingUser.username}`, userProfile);
            setEditingUser({...editingUser, role: UserRole.BANNED});
            setMsg(`User ${editingUser.username} has been BANNED.`);
        }
    };

    const handleAddItem = async () => {
        if(!editingUser || !newItem) return;
        // This is now "Grant Award" per requirements
        await updateDoc(doc(db, "users", editingUser.uid), { inventory: arrayUnion(newItem) });
        await logSystemAction('INVENTORY_ADD', `Gave ${newItem} to ${editingUser.username}`, userProfile);
        setEditingUser({...editingUser, inventory: [...(editingUser.inventory || []), newItem]});
        setNewItem('');
        setMsg(`Awarded ${newItem} to user.`);
    };

    const handleRemoveItem = async (item: string) => {
        if(!editingUser) return;
        await updateDoc(doc(db, "users", editingUser.uid), { inventory: arrayRemove(item) });
        await logSystemAction('INVENTORY_REMOVE', `Removed ${item} from ${editingUser.username}`, userProfile);
        setEditingUser({...editingUser, inventory: editingUser.inventory.filter((i: string) => i !== item)});
    };

    return (
        <div>
            <div className={`${theme.headerBg} ${theme.textHeader} text-sm px-3 py-2 border ${theme.border} mb-4`}>User Management</div>
            <div className={`${theme.panelBg} border ${theme.border} p-4`}>
                {!editingUser ? (
                    <>
                        <div className="bg-trow1 p-3 border border-border mb-4">
                            <form onSubmit={searchUsers} className="flex gap-2">
                                <input className={`${theme.input} flex-1`} placeholder="Search username, email..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                                <button className={`${theme.button} px-4 font-bold border-l border-border`}>SEARCH</button>
                            </form>
                        </div>
                        <table className="w-full text-xs">
                            <thead>
                                <tr className={`${theme.subHeaderBg} text-white`}>
                                    <th className="p-2 text-left">Username</th>
                                    <th className="p-2 text-center">Role</th>
                                    <th className="p-2 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.length === 0 ? <tr><td colSpan={3} className="p-8 text-center italic text-textMuted">No users found.</td></tr> :
                                users.map((u, i) => (
                                     <tr key={u.uid} className={i%2===0 ? theme.tableRow1 : theme.tableRow2}>
                                         <td className={`p-2 ${theme.textMain}`}>
                                             <strong>{u.username}</strong>
                                             <div className="text-[9px] opacity-50 font-mono">{u.email}</div>
                                         </td>
                                         <td className={`p-2 text-center font-bold ${theme.textMain}`}>{u.role}</td>
                                         <td className="p-2 text-right"><button onClick={() => handleEdit(u)} className={`${theme.button} px-3 py-1 text-[10px]`}>EDIT</button></td>
                                     </tr>
                                ))}
                            </tbody>
                        </table>
                    </>
                ) : (
                    <div>
                        <div className="flex justify-between items-center mb-6 border-b border-border pb-4">
                            <h3 className={`font-bold ${theme.textMain} text-sm`}>Editing: <span className="text-accent">{editingUser.username}</span></h3>
                            <button onClick={() => setEditingUser(null)} className={theme.button}>&laquo; RETURN</button>
                        </div>
                        
                        {msg && <div className="bg-accent/10 text-accent border border-accent/20 p-3 text-center mb-6 font-bold">{msg}</div>}

                        <div className="grid grid-cols-2 gap-6">
                            {/* Left Col: Role & Ban */}
                            <div className={`border ${theme.borderSubtle} p-0 bg-background`}>
                                <div className={`${theme.subHeaderBg} text-textMuted px-3 py-2 font-bold uppercase text-[10px] tracking-widest`}>Access Level</div>
                                <div className="p-4">
                                    <select className={`${theme.input} w-full mb-6`} value={editingUser.role} onChange={e => handleUpdateRole(e.target.value)}>
                                        {Object.values(UserRole).map(r => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                    
                                    <div className="border-t border-dashed border-border pt-4">
                                        {editingUser.role === UserRole.BANNED ? (
                                             <button onClick={() => handleUpdateRole(UserRole.USER)} className="w-full bg-green-900/20 text-green-500 border border-green-900 py-2 text-xs font-bold hover:bg-green-900/40">LIFT BAN</button>
                                        ) : (
                                             <button onClick={handleBan} className="w-full bg-red-900/20 text-red-500 border border-red-900 py-2 text-xs font-bold hover:bg-red-900/40">BAN USER</button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Right Col: Awards/Inventory */}
                            <div className={`border ${theme.borderSubtle} p-0 bg-background`}>
                                <div className={`${theme.subHeaderBg} text-textMuted px-3 py-2 font-bold uppercase text-[10px] tracking-widest`}>Awards & Medals</div>
                                <div className="p-4">
                                    <div className="flex gap-2 mb-4">
                                        <input className={`${theme.input} flex-1`} placeholder="Medal ID (e.g. early_bird)" value={newItem} onChange={e => setNewItem(e.target.value)} />
                                        <button onClick={handleAddItem} className={theme.button}>GRANT</button>
                                    </div>
                                    <div className="bg-trow1 p-2 border border-border min-h-[100px] flex flex-wrap gap-2 content-start">
                                        {!editingUser.inventory?.length ? <div className="text-[10px] italic text-textMuted w-full text-center mt-8">No Awards</div> :
                                            editingUser.inventory?.map((item: string, i: number) => (
                                                <div key={i} className={`text-[10px] px-2 py-1 border border-border bg-background text-textMain flex items-center gap-2`}>
                                                    {item}
                                                    <span onClick={() => handleRemoveItem(item)} className="text-red-500 cursor-pointer font-bold hover:text-white">x</span>
                                                </div>
                                            ))
                                        }
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const ForumManager = ({ theme }: { theme: any }) => {
    // ... kept as is
    const [forums, setForums] = useState<any[]>([]);
    
    useEffect(() => {
        const unsub = onSnapshot(collection(db, "categories"), (snap) => {
            setForums(snap.docs.map(d => ({id: d.id, ...d.data()})));
        });
        return () => unsub();
    }, []);

    return (
        <div>
             <div className={`${theme.headerBg} ${theme.textHeader} text-sm px-3 py-2 border ${theme.border} mb-4`}>Forum Nodes</div>
             <div className={`${theme.panelBg} border ${theme.border} p-0`}>
                 <table className="w-full text-xs">
                     <thead>
                         <tr className={`${theme.subHeaderBg} text-white`}>
                             <th className="p-2 text-center">Icon</th>
                             <th className="p-2 text-left">Node Title</th>
                             <th className="p-2 text-right">Settings</th>
                         </tr>
                     </thead>
                     <tbody>
                         {[...CATEGORIES, ...forums].map((f, i) => (
                             <tr key={f.id} className={i%2===0 ? theme.tableRow1 : theme.tableRow2}>
                                 <td className="p-2 text-center text-lg">{f.icon}</td>
                                 <td className="p-2">
                                     <div className={`font-bold ${theme.textMain}`}>{f.title}</div>
                                     <div className={`text-[10px] ${theme.textMuted}`}>{f.description}</div>
                                 </td>
                                 <td className="p-2 text-right">
                                     <button className={`${theme.button} px-2 py-1 text-[10px]`}>CONFIGURE</button>
                                 </td>
                             </tr>
                         ))}
                     </tbody>
                 </table>
             </div>
        </div>
    );
};

const SettingsManager = ({ theme }: { theme: any }) => {
    // ... kept as is
    const { userProfile } = useAuth();
    
    const handleSave = async () => {
        await logSystemAction('SETTINGS_UPDATE', 'Updated global board configurations', userProfile);
        alert("Configuration saved.");
    };

    return (
        <div>
            <div className={`${theme.headerBg} ${theme.textHeader} text-sm px-3 py-2 border ${theme.border} mb-4`}>Board Configuration</div>
            <div className={`${theme.panelBg} border ${theme.border} p-6`}>
                <div className="grid grid-cols-1 gap-6">
                    <div className="border border-border p-6 relative">
                        <div className="absolute -top-3 left-3 bg-panel px-2 text-xs font-bold text-accent">Core Settings</div>
                        <div className="grid grid-cols-2 gap-4 items-center mb-4">
                            <label className={`font-bold text-xs ${theme.textMain}`}>Board Name</label>
                            <input className={theme.input} defaultValue="xBOARD" />
                        </div>
                        <div className="grid grid-cols-2 gap-4 items-center">
                            <label className={`font-bold text-xs ${theme.textMain}`}>Maintenance Mode</label>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 text-textMain"><input type="radio" name="maint" /> On</label>
                                <label className="flex items-center gap-2 text-textMain"><input type="radio" name="maint" defaultChecked /> Off</label>
                            </div>
                        </div>
                    </div>

                    <div className="text-right">
                        <button onClick={handleSave} className={`${theme.button} px-6 py-2 font-bold bg-accent text-background border-accent hover:bg-white`}>SAVE CHANGES</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const LogManager = ({ theme }: { theme: any }) => {
    // ... kept as is
    const [logs, setLogs] = useState<any[]>([]);

    useEffect(() => {
        const q = query(collection(db, "logs"), orderBy("createdAt", "desc"), limit(100));
        const unsub = onSnapshot(q, (snap) => {
            setLogs(snap.docs.map(d => ({id: d.id, ...d.data()})));
        });
        return () => unsub();
    }, []);

    const handleDelete = async (id: string) => {
        if(!confirm("Delete this log entry?")) return;
        await deleteDoc(doc(db, "logs", id));
    };

    const handleClearAll = async () => {
        if(!confirm("DANGER: WIPE ALL SYSTEM LOGS? This cannot be undone.")) return;
        try {
            const batch = writeBatch(db);
            const q = query(collection(db, "logs"), limit(50)); 
            const snapshot = await getDocs(q);
            
            if (snapshot.empty) {
                alert("Logs are already empty.");
                return;
            }

            snapshot.docs.forEach((doc) => {
                batch.delete(doc.ref);
            });
            await batch.commit();
            alert("Batch wipe successful (first 50 logs).");
        } catch(e: any) {
            console.error(e);
            alert("Error wiping logs: " + e.message);
        }
    };

    return (
        <div>
            <div className={`${theme.headerBg} ${theme.textHeader} text-sm px-3 py-2 border ${theme.border} mb-4 flex justify-between items-center`}>
                <span>System Logs</span>
                <button onClick={handleClearAll} className="text-red-500 text-[10px] border border-red-900 px-2 py-0.5 hover:bg-red-900/20">WIPE LOGS</button>
            </div>
            <div className={`${theme.panelBg} border ${theme.border} p-0 overflow-hidden`}>
                <table className="w-full text-xs">
                    <thead>
                        <tr className={`${theme.subHeaderBg} text-white`}>
                            <th className="p-2 text-left">Action</th>
                            <th className="p-2 text-left">Details</th>
                            <th className="p-2 text-left">Admin</th>
                            <th className="p-2 text-right">Date</th>
                            <th className="p-2 text-right"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.length === 0 ? <tr><td colSpan={5} className="p-8 text-center opacity-50">Log is empty.</td></tr> :
                        logs.map((l, i) => (
                            <tr key={l.id} className={i%2===0 ? theme.tableRow1 : theme.tableRow2}>
                                <td className="p-2 font-mono font-bold text-[10px] text-accent">{l.action}</td>
                                <td className="p-2 text-textMain">{l.details}</td>
                                <td className="p-2 text-[10px] text-textMuted">{l.adminName}</td>
                                <td className="p-2 text-right text-[10px] text-textMuted font-mono">{formatDate(l.createdAt)}</td>
                                <td className="p-2 text-right">
                                    <button onClick={() => handleDelete(l.id)} className="text-red-500 font-bold hover:text-white px-2">x</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export const Admin = () => {
    // ... kept as is
    const { userProfile, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('home');

    const isAdmin = userProfile?.role === UserRole.ROOT || userProfile?.role === UserRole.ADMIN;
    
    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="bg-red-900/10 border border-red-900 text-red-500 p-8 font-mono tracking-widest text-center">
                    <h1 className="text-3xl font-black mb-2">RESTRICTED</h1>
                    <p>UNAUTHORIZED ACCESS ATTEMPT LOGGED.</p>
                </div>
            </div>
        );
    }

    const theme = getStyles();

    const NavGroup = ({ title, children }: any) => (
        <div className="mb-6">
            <div className={`text-textMuted text-[10px] font-bold uppercase tracking-widest px-3 mb-2`}>{title}</div>
            <div className="space-y-1">{children}</div>
        </div>
    );

    const NavItem = ({ id, label }: any) => (
        <a onClick={() => setActiveTab(id)} className={`block text-[11px] px-3 py-2 cursor-pointer border-l-2 transition-all ${activeTab === id ? `border-accent text-white bg-trow1` : `border-transparent text-textMuted hover:text-textMain hover:border-border`}`}>
            {label}
        </a>
    );

    return (
        <div className={`min-h-screen font-sans text-xs ${theme.pageBg} text-textMain flex flex-col`}>
            <div className="h-14 bg-panel border-b border-border flex items-center justify-between px-6 shrink-0 z-10">
                <div className="flex items-center gap-4">
                     <Link to="/" className="text-2xl font-black text-white tracking-tighter">
                         x<span className="text-accent">BOARD</span> <span className="text-[10px] font-mono font-normal opacity-50 bg-background px-1 rounded border border-border">ADMIN</span>
                     </Link>
                </div>
                <div className="flex items-center gap-6 text-[10px] font-bold tracking-wide">
                    <span className="text-textMuted">{userProfile.username}</span>
                    <Link to="/" className="text-accent hover:text-white">RETURN TO FORUM</Link>
                    <button onClick={logout} className="text-red-500 hover:text-white">LOGOUT</button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                <div className={`w-64 ${theme.sidebarBg} flex flex-col pt-6 overflow-y-auto`}>
                    <NavGroup title="Main">
                        <NavItem id="home" label="Dashboard" />
                        <NavItem id="logs" label="System Logs" />
                        <NavItem id="shoutbox" label="Shoutbox Manager" />
                    </NavGroup>
                    
                    <NavGroup title="Commerce">
                        <NavItem id="upgrades" label="Upgrade Requests" />
                    </NavGroup>
                    
                    <NavGroup title="Community">
                        <NavItem id="users" label="Users & Roles" />
                        <NavItem id="forums" label="Nodes & Categories" />
                    </NavGroup>

                    <NavGroup title="Configuration">
                        <NavItem id="settings" label="Global Settings" />
                    </NavGroup>
                </div>

                <div className={`flex-1 ${theme.contentBg} p-8 overflow-y-auto custom-scrollbar`}>
                    <div className="max-w-5xl mx-auto animate-in fade-in duration-300">
                        {activeTab === 'home' && <ACPDashboard theme={theme} />}
                        {activeTab === 'users' && <UserManager theme={theme} />}
                        {activeTab === 'forums' && <ForumManager theme={theme} />}
                        {activeTab === 'settings' && <SettingsManager theme={theme} />}
                        {activeTab === 'logs' && <LogManager theme={theme} />}
                        {activeTab === 'upgrades' && <UpgradeManager theme={theme} />}
                        {activeTab === 'shoutbox' && <ShoutboxManager theme={theme} />}
                    </div>
                </div>
            </div>
        </div>
    );
};
