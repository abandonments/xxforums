
import React, { useState } from 'react';
import { Button, Panel } from './UI';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

interface ReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    targetId: string;
    targetType: 'thread' | 'reply';
}

export const ReportModal = ({ isOpen, onClose, targetId, targetType }: ReportModalProps) => {
    const { user } = useAuth();
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setLoading(true);
        try {
            await addDoc(collection(db, "reports"), {
                targetId,
                targetType,
                reporterId: user.uid,
                reason,
                status: 'open',
                createdAt: serverTimestamp()
            });
            alert("Report submitted.");
            onClose();
        } catch (e) {
            console.error(e);
            alert("Failed to report.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-panel border border-red-900/50 w-full max-w-md shadow-2xl relative">
                <Panel title={`Report ${targetType}`}>
                    <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4">
                        <div className="bg-red-900/10 border border-red-900/30 p-2 text-xs text-red-200 mb-2">
                            Please provide a valid reason. Abuse of the report system may result in a ban.
                        </div>
                        <textarea
                            className="w-full h-32 bg-black border border-border p-2 text-white"
                            placeholder="Reason for report..."
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                            required
                        />
                        <div className="flex justify-end gap-2">
                            <Button type="button" onClick={onClose}>Cancel</Button>
                            <Button type="submit" variant="danger" disabled={loading}>Submit Report</Button>
                        </div>
                    </form>
                </Panel>
            </div>
        </div>
    );
};
