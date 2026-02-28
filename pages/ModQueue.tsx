
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, orderBy, limit, onSnapshot, doc, updateDoc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { UserRole } from '../types';
import { Button, Panel, UserLink, formatDate } from '../components/UI';
import { Link } from 'react-router-dom';
import { useUserActions } from '../hooks/useUserActions';

export const ModQueue = () => {
    const { userProfile } = useAuth();
    const { warnUser } = useUserActions();
    const [reports, setReports] = useState<any[]>([]);
    
    useEffect(() => {
        if (!userProfile || ![UserRole.MOD, UserRole.ADMIN, UserRole.ROOT].includes(userProfile.role)) return;

        const q = query(collection(db, "reports"), orderBy("createdAt", "desc"), limit(50));
        const unsub = onSnapshot(q, (snap) => {
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setReports(list);
        });
        return () => unsub();
    }, [userProfile]);

    const handleDismiss = async (report: any) => {
        if (!confirm("Dismiss this report?")) return;
        try {
            // Move to resolved
            await addDoc(collection(db, "resolved_reports"), { ...report, resolvedBy: userProfile.uid, resolvedAt: serverTimestamp() });
            await deleteDoc(doc(db, "reports", report.id));
        } catch(e) { console.error(e); }
    };

    const handleDeleteContent = async (report: any) => {
        if (!confirm("Delete the reported content? This is irreversible.")) return;
        try {
            const collectionName = report.targetType === 'thread' ? 'threads' : 'replies';
            await deleteDoc(doc(db, collectionName, report.targetId));
            await handleDismiss(report); // Auto dismiss after action
            alert("Content deleted.");
        } catch(e) { alert("Failed to delete content. It may already be gone."); }
    };

    const handleWarnReporter = async (report: any) => {
        const reason = prompt("Enter warning reason for the reported user:");
        if (!reason) return;
        // In a real app we would fetch the target content to get the author ID. 
        // For this UI, we assume manual action or checking the link first.
        alert("Please verify the content via the link first, then warn the user from their profile.");
    };

    if (!userProfile || ![UserRole.MOD, UserRole.ADMIN, UserRole.ROOT].includes(userProfile.role)) {
        return <div className="p-10 text-center text-red-500 font-bold">ACCESS DENIED</div>;
    }

    const randomIP = () => Array(4).fill(0).map(() => Math.floor(Math.random() * 255)).join('.');

    return (
        <div className="max-w-6xl mx-auto p-4">
             <div className="text-xs text-textMuted mb-2">
                <Link to="/">xBOARD</Link> / <Link to="/admin">Admin CP</Link> / Staff Command Center
            </div>

            <div className="mb-6 flex justify-between items-end bg-panel border border-border p-4">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-1">Mod Queue</h1>
                    <p className="text-xs text-textMuted">Pending reports and flagged content requiring attention.</p>
                </div>
                <div className="text-right text-xs">
                    <div className="font-bold text-green-500">System Status: ONLINE</div>
                    <div className="text-textMuted">{reports.length} pending reports</div>
                </div>
            </div>

            <Panel title="Report Feed">
                <table className="w-full text-xs">
                    <thead>
                        <tr className="bg-thead-grad text-white font-bold border-b border-black">
                            <th className="p-2 text-left">Reported Item</th>
                            <th className="p-2 text-left">Reason</th>
                            <th className="p-2 text-left">Reporter</th>
                            <th className="p-2 text-right">Simulated IP (Audit)</th>
                            <th className="p-2 text-right">Date</th>
                            <th className="p-2 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reports.length === 0 ? (
                            <tr><td colSpan={6} className="p-6 text-center text-textMuted italic">Queue is clear. Good job!</td></tr>
                        ) : reports.map((r, i) => (
                            <tr key={r.id} className={`${i%2===0 ? 'bg-trow1' : 'bg-trow2'} hover:bg-[#333]`}>
                                <td className="p-2">
                                    <div className="font-bold text-white uppercase text-[10px]">{r.targetType}</div>
                                    <Link to={`/${r.targetType === 'thread' ? 'thread' : 'thread'}/${r.targetType === 'thread' ? r.targetId : 'unknown'}`} className="text-accent hover:underline block truncate max-w-[150px]">
                                        View Content &raquo;
                                    </Link>
                                </td>
                                <td className="p-2 text-textMain max-w-xs break-words">{r.reason}</td>
                                <td className="p-2">
                                    <UserLink name={r.reporterName || 'Unknown'} role={UserRole.USER} />
                                </td>
                                <td className="p-2 text-right font-mono text-textMuted opacity-50">
                                    {randomIP()}
                                </td>
                                <td className="p-2 text-right text-textMuted">
                                    {formatDate(r.createdAt)}
                                </td>
                                <td className="p-2 text-right">
                                    <div className="flex justify-end gap-1">
                                        <button onClick={() => handleDeleteContent(r)} className="bg-red-900/20 text-red-500 border border-red-900/50 px-2 py-0.5 hover:bg-red-900/40">DEL</button>
                                        <button onClick={() => handleDismiss(r)} className="bg-green-900/20 text-green-500 border border-green-900/50 px-2 py-0.5 hover:bg-green-900/40">OK</button>
                                        <button onClick={() => handleWarnReporter(r)} className="bg-yellow-900/20 text-yellow-500 border border-yellow-900/50 px-2 py-0.5 hover:bg-yellow-900/40">WARN</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Panel>
        </div>
    );
};
