import { Request, Response, NextFunction } from 'express';
import { knexInstance } from '../../index.js';
import { validationResult } from 'express-validator';

import logger from '../lib/logger.js';

import { UserProfile } from '../types/user.js';

const userProfileSelect = [
    'id', 'firebase_uid', 'email', 'username', 'reputation', 'role',
    'warnings', 'is_banned', 'banned_until', 'avatarUrl', 'bannerUrl',
    'bio', 'signature', 'musicUrl', 'musicAutoplay', 'customCss',
    'postCount', 'profileViews', 'trustScore', 'vouchCount', 'inventory',
    'createdAt', 'updatedAt'
];

const getInternalUserId = async (firebase_uid: string): Promise<number | null> => {
    const user = await knexInstance('users').where({ firebase_uid }).select('id').first();
    return user ? user.id : null;
};

export const initiateProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        if (!req.userId || req.userId !== req.body.firebase_uid) {
            return res.status(403).json({ message: 'Unauthorized: Firebase UID mismatch.' });
        }

        const { firebase_uid, email, username } = req.body;

        let user = await knexInstance('users').where({ firebase_uid }).first();

        if (!user) {
            [user] = await knexInstance('users').insert({
                firebase_uid,
                email,
                username,
                reputation: 0,
                role: 'user',
                warnings: 0,
                is_banned: false,
                banned_until: null,
                postCount: 0,
                trustScore: 0,
                vouchCount: 0,
                createdAt: knexInstance.fn.now(),
                updatedAt: knexInstance.fn.now(),
            }).returning(userProfileSelect);
            logger.info('User profile created', { firebaseUid: firebase_uid });
            return res.status(201).json({ message: 'User profile created', user });
        }
        
        logger.info('User profile retrieved', { firebaseUid: firebase_uid });
        return res.status(200).json({ message: 'User profile retrieved', user });

    } catch (error) {
        logger.error('Error in initiate-profile:', error);
        next(error);
    }
};

export const getUserProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { firebase_uid } = req.params;
        const profile = await knexInstance('users')
            .where({ firebase_uid })
            .select(userProfileSelect)
            .first();

        if (!profile) {
            return res.status(404).json({ message: `User profile with UID ${firebase_uid} not found.` });
        }

        await knexInstance('users')
            .where({ firebase_uid })
            .increment('profileViews', 1);

        res.status(200).json(profile);
    } catch (error) {
        logger.error('Error in getUserProfile:', error);
        next(error);
    }
};

export const updateUserProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { firebase_uid } = req.params;
        const updates = req.body;

        if (!req.userId || req.userId !== firebase_uid) {
            const currentUser = await knexInstance('users').where({ firebase_uid: req.userId }).first();
            if (!currentUser || !['root', 'admin'].includes(currentUser.role)) {
                return res.status(403).json({ message: 'Forbidden: You can only update your own profile or must be an admin/root.' });
            }
        }

        const [updatedProfile] = await knexInstance('users')
            .where({ firebase_uid })
            .update({ ...updates, updatedAt: knexInstance.fn.now() })
            .returning(userProfileSelect);

        if (!updatedProfile) {
            return res.status(404).json({ message: `User profile with UID ${firebase_uid} not found for update.` });
        }

        res.status(200).json(updatedProfile);
    } catch (error) {
        logger.error('Error in updateUserProfile:', error);
        next(error);
    }
};

export const getProfileComments = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { firebase_uid } = req.params;
        if (!firebase_uid || Array.isArray(firebase_uid)) {
            return res.status(400).json({ message: 'Invalid user ID format.' });
        }
        const profileOwnerId = await getInternalUserId(firebase_uid);

        if (!profileOwnerId) {
            return res.status(404).json({ message: `User profile with UID ${firebase_uid} not found.` });
        }

        const comments = await knexInstance('profile_comments')
            .select(
                'profile_comments.id',
                'profile_comments.content',
                'profile_comments.created_at',
                'users.firebase_uid as fromUserId',
                'users.username as fromUsername'
            )
            .join('users', 'profile_comments.from_user_id', '=', 'users.id')
            .where('profile_comments.to_user_id', profileOwnerId)
            .orderBy('profile_comments.created_at', 'desc');

        res.status(200).json(comments);
    } catch (error) {
        logger.error('Error in getProfileComments:', error);
        next(error);
    }
};

export const postProfileComment = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { firebase_uid } = req.params;
        if (!firebase_uid || Array.isArray(firebase_uid)) {
            return res.status(400).json({ message: 'Invalid user ID format.' });
        }
        const { content } = req.body;

        if (!req.userId) {
            return res.status(401).json({ message: 'Unauthorized: User not authenticated.' });
        }
        const firebaseUserUid = req.userId;
        if (!firebaseUserUid || Array.isArray(firebaseUserUid)) {
            return res.status(400).json({ message: 'Invalid authenticated user ID format.' });
        }

        const profileOwnerId = await getInternalUserId(firebase_uid);
        const commenterId = await getInternalUserId(firebaseUserUid);

        if (!profileOwnerId) {
            return res.status(404).json({ message: `User profile with UID ${firebase_uid} not found.` });
        }
        if (!commenterId) {
            return res.status(404).json({ message: `Commenter user with UID ${req.userId} not found.` });
        }

        const commenterProfile = await knexInstance('users').where({ id: commenterId }).select('is_banned').first();
        if (commenterProfile?.is_banned) {
            return res.status(403).json({ message: 'Forbidden: Banned users cannot post comments.' });
        }

        const [newComment] = await knexInstance('profile_comments')
            .insert({
                to_user_id: profileOwnerId,
                from_user_id: commenterId,
                content,
            })
            .returning('*');
        
        const fromUser = await knexInstance('users').where({ id: commenterId }).select('username').first();
        if (!fromUser) {
          logger.error('Error: Commenter username not found after posting comment.', { commenterId });
          return res.status(500).json({ message: 'Error retrieving commenter username.' });
        }

        res.status(201).json({
            id: newComment.id,
            toUserId: firebase_uid,
            fromUserId: req.userId,
            fromUsername: fromUser.username,
            content: newComment.content,
            createdAt: newComment.created_at,
        });

    } catch (error) {
        logger.error('Error in postProfileComment:', error);
        next(error);
    }
};

export const deleteProfileComment = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { firebase_uid, commentId } = req.params;
        if (!firebase_uid || Array.isArray(firebase_uid)) {
            return res.status(400).json({ message: 'Invalid user ID format.' });
        }

        if (!req.userId) {
            return res.status(401).json({ message: 'Unauthorized: User not authenticated.' });
        }
        const firebaseUserUid = req.userId;
        if (!firebaseUserUid || Array.isArray(firebaseUserUid)) {
            return res.status(400).json({ message: 'Invalid authenticated user ID format.' });
        }

        const profileOwnerId = await getInternalUserId(firebase_uid);
        const currentUserInternalId = await getInternalUserId(firebaseUserUid);

        if (!profileOwnerId) {
            return res.status(404).json({ message: `User profile with UID ${firebase_uid} not found.` });
        }
        if (!currentUserInternalId) {
            return res.status(404).json({ message: `Current user with UID ${req.userId} not found.` });
        }

        const comment = await knexInstance('profile_comments')
            .where({ id: commentId, to_user_id: profileOwnerId })
            .first();

        if (!comment) {
            return res.status(404).json({ message: `Comment with ID ${commentId} not found on profile ${firebase_uid}.` });
        }
        
        const currentUser = await knexInstance('users').where({ id: currentUserInternalId }).select('role').first();

        if (comment.from_user_id !== currentUserInternalId &&
            comment.to_user_id !== currentUserInternalId &&
            !['root', 'admin'].includes(currentUser?.role || '')
        ) {
            return res.status(403).json({ message: 'Forbidden: You do not have permission to delete this comment.' });
        }

        const deletedCount = await knexInstance('profile_comments').where({ id: commentId }).del();

        if (deletedCount === 0) {
            logger.warn('Attempted to delete comment that no longer exists.', { commentId });
            return res.status(404).json({ message: `Comment with ID ${commentId} not found during deletion.` });
        }

        res.status(204).send();
    } catch (error) {
        logger.error('Error in deleteProfileComment:', error);
        next(error);
    }
};

export const vouchUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { firebase_uid } = req.params;
        const { voter_firebase_uid } = req.body;

        if (!firebase_uid || Array.isArray(firebase_uid)) {
            return res.status(400).json({ message: 'Invalid target user ID format.' });
        }
        if (!voter_firebase_uid || Array.isArray(voter_firebase_uid)) {
            return res.status(400).json({ message: 'Invalid voter user ID format.' });
        }
        if (!req.userId || req.userId !== voter_firebase_uid) {
            return res.status(403).json({ message: 'Unauthorized: Voter Firebase UID mismatch.' });
        }

        const targetUserInternalId = await getInternalUserId(firebase_uid);
        const voterInternalId = await getInternalUserId(voter_firebase_uid);

        if (!targetUserInternalId) {
            return res.status(404).json({ message: `Target user with UID ${firebase_uid} not found.` });
        }
        if (!voterInternalId) {
            return res.status(404).json({ message: `Voter user with UID ${voter_firebase_uid} not found.` });
        }

        if (targetUserInternalId === voterInternalId) {
            return res.status(400).json({ message: 'Forbidden: You cannot vouch for yourself.' });
        }

        const voterProfile = await knexInstance('users').where({ id: voterInternalId }).select('postCount').first();
        if ((voterProfile?.postCount || 0) < 20) {
            return res.status(403).json({ message: 'Forbidden: You need at least 20 posts to vouch for others.' });
        }

        const existingVouch = await knexInstance('user_vouches')
            .where({ voter_user_id: voterInternalId, vouched_user_id: targetUserInternalId })
            .first();

        if (existingVouch) {
            return res.status(409).json({ message: 'Conflict: You have already vouched for this user.' });
        }

        await knexInstance.transaction(async (trx) => {
            await trx('user_vouches').insert({
                voter_user_id: voterInternalId,
                vouched_user_id: targetUserInternalId,
            });

            await trx('users')
                .where({ id: targetUserInternalId })
                .increment('trustScore', 1)
                .increment('vouchCount', 1);
        });

        res.status(200).json({ message: 'Vouch successful!' });

    } catch (error) {
        logger.error('Error in vouchUser:', error);
        next(error);
    }
};

export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { firebase_uid } = req.params;
        if (!firebase_uid || Array.isArray(firebase_uid)) {
            return res.status(400).json({ message: 'Invalid user ID format.' });
        }

        if (!req.userId) {
            return res.status(401).json({ message: 'Unauthorized: User not authenticated.' });
        }

        const currentUser = await knexInstance('users').where({ firebase_uid: req.userId }).first();
        if (!currentUser || !['root', 'admin'].includes(currentUser.role)) {
            return res.status(403).json({ message: 'Forbidden: Only Root or Admin can delete users.' });
        }

        const deletedCount = await knexInstance('users').where({ firebase_uid }).del();

        if (deletedCount === 0) {
            return res.status(404).json({ message: `User with UID ${firebase_uid} not found for deletion.` });
        }

        res.status(204).send();
    } catch (error) {
        logger.error('Error in deleteUser:', error);
        next(error);
    }
};