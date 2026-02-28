import { useState } from 'react';
// Removed all Firestore imports
// import { doc, updateDoc, increment, collection, addDoc, serverTimestamp } from 'firebase/firestore';
// import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
// import { UserRole } from '../types'; // UserRole still used for checks, but not directly for DB ops
import api from '../lib/api'; // Import the configured Axios instance

export const useUserActions = () => {

    const { currentUser, getIdToken } = useAuth();

    const [loading, setLoading] = useState(false);



    // This function needs a new backend endpoint to update user profiles

    const updateProfile = async (firebase_uid: string, data: any) => {

        if (!currentUser || currentUser.uid !== firebase_uid) {

            throw new Error('Unauthorized: Cannot update another user\'s profile.');

        }

        setLoading(true);

        try {

            const idToken = await getIdToken();

            if (!idToken) throw new Error('Not authenticated.');



            // Assuming a backend endpoint for profile updates: /api/users/:firebase_uid/profile

            const response = await api.put(`/api/users/${firebase_uid}/profile`, data);

            

            // Backend should handle any necessary updates to userProfile, or we might refetch after update

            // For now, returning the response data

            return response.data;

        } catch (error: any) {

            console.error("Profile update error:", error);

            throw new Error(error.response?.data?.message || 'Failed to update profile via backend');

        } finally {

            setLoading(false);

        }

    };



    const giveReputation = async (targetUserFirebaseUid: string, postId: number, postType: 'thread' | 'reply', delta: number) => {

        // Renamed targetUserId to targetUserFirebaseUid for clarity with backend

        if (!currentUser || !currentUser.firebase_uid) {

            throw new Error('Authentication required for reputation actions.');

        }

        setLoading(true);

        try {

            // ID token is automatically attached by the api interceptor

            const response = await api.post('/api/reputation/vote', {

                voter_firebase_uid: currentUser.uid,

                target_user_firebase_uid: targetUserFirebaseUid,

                postId,

                postType,

                delta,

            });



            // Backend is now responsible for any notifications or other side effects

            return response.data;



        } catch (error: any) {

-           console.error("Reputation error:", error);

-           throw new Error(error.response?.data?.message || 'Failed to update reputation via backend');

        } finally {

            setLoading(false);

        }

    };



    // Removed logModAction as it's intended to be handled by backend.

    // The previous implementation was a client-side Firestore log which is no longer needed.

    // Backend moderation endpoints should log actions internally.

    const logModAction = async (action: string, targetId: string, targetType: string, reason: string) => {

        console.warn("logModAction is deprecated client-side. Backend should handle moderation logging.");

        // This function will eventually be fully removed if not called directly anywhere else

    };





    const warnUser = async (targetUserFirebaseUid: string, reason: string) => {

        if (!currentUser || !currentUser.firebase_uid || !currentUser.role) {

            throw new Error('Authentication and appropriate role required for warning users.');

        }

        setLoading(true);

        try {

            // ID token is automatically attached by the api interceptor

            const response = await api.post('/api/moderation/warn', {

                target_user_firebase_uid: targetUserFirebaseUid,

                moderator_firebase_uid: currentUser.uid,

                reason,

            });



            // Backend is now responsible for any notifications or other side effects

            return response.data;



        } catch (error: any) {

            console.error("Warn error:", error);

            throw new Error(error.response?.data?.message || 'Failed to warn user via backend');

        } finally {

            setLoading(false);

        }

    };

    

    return { updateProfile, giveReputation, warnUser, logModAction, loading };

};