
import { useState } from 'react';
import { doc, runTransaction, serverTimestamp, collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

export const useEconomy = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);

    const handleTransaction = async (cost: number, description: string, relatedItemId?: string) => {
        if (!user) throw new Error("Not authenticated");
        setLoading(true);

        try {
            await runTransaction(db, async (transaction) => {
                const userRef = doc(db, "users", user.uid);
                const userDoc = await transaction.get(userRef);
                
                if (!userDoc.exists()) throw new Error("User does not exist");
                
                const currentCredits = userDoc.data().credits || 0;
                
                if (currentCredits < cost) {
                    throw new Error("Insufficient credits");
                }

                transaction.update(userRef, { credits: currentCredits - cost });
                
                // Log transaction
                const logRef = doc(collection(db, "users", user.uid, "transactions"));
                transaction.set(logRef, {
                    amount: -cost,
                    description,
                    relatedItemId,
                    createdAt: serverTimestamp()
                });

                if (relatedItemId) {
                     const purchaseRef = doc(collection(db, "users", user.uid, "purchased_content"), relatedItemId);
                     transaction.set(purchaseRef, {
                         purchasedAt: serverTimestamp(),
                         cost
                     });
                }
            });
            return true;
        } catch (error: any) {
            console.error("Transaction failed:", error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    return { handleTransaction, loading };
};
