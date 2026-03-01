import { Response, NextFunction, Request } from 'express';
import { knexInstance } from '../../index.js';
import { validationResult } from 'express-validator';

import logger from '../lib/logger.js';

// POST /api/reputation/vote
export const reputationVote = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { voter_firebase_uid, target_user_firebase_uid, postId, postType, delta } = req.body;

        if (!req.userId || req.userId !== voter_firebase_uid) {
            return res.status(403).json({ message: 'Unauthorized: Voter Firebase UID mismatch.' });
        }

        const voterUser = await knexInstance('users').where({ firebase_uid: voter_firebase_uid }).first();
        const targetUser = await knexInstance('users').where({ firebase_uid: target_user_firebase_uid }).first();

        if (!voterUser) {
            return res.status(404).json({ message: `Voter user with UID ${voter_firebase_uid} not found.` });
        }
        if (!targetUser) {
            return res.status(404).json({ message: `Target user with UID ${target_user_firebase_uid} not found.` });
        }

        const existingVote = await knexInstance('reputation_votes')
            .where({
                voter_user_id: voterUser.id,
                post_id: postId,
                post_type: postType
            })
            .first();

        if (existingVote) {
            return res.status(409).json({ message: 'Conflict: User has already voted on this post.' });
        }

        await knexInstance.transaction(async (trx) => {
            await trx('reputation_votes').insert({
                voter_user_id: voterUser.id,
                target_user_id: targetUser.id,
                post_id: postId,
                post_type: postType,
                delta: delta,
            });

            await trx('users')
                .where({ id: targetUser.id })
                .increment('reputation', delta);
        });

        res.status(200).json({ message: 'Reputation updated successfully' });
        logger.info('Reputation updated', { voterUid: voter_firebase_uid, targetUid: target_user_firebase_uid, postId: postId, delta: delta });

    } catch (error: any) {
        logger.error('Error in reputation/vote:', error);
        next(error);
    }
};

// POST /api/moderation/warn
export const warnUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { target_user_firebase_uid, moderator_firebase_uid, reason } = req.body;
        const WARNING_THRESHOLD = 3;
        const BAN_DURATION_HOURS = 24;
        const MODERATOR_ROLES = ['moderator', 'admin', 'root']; // Define allowed moderator roles

        if (!req.userId || req.userId !== moderator_firebase_uid) {
            return res.status(403).json({ message: 'Unauthorized: Moderator Firebase UID mismatch.' });
        }

        const targetUser = await knexInstance('users').where({ firebase_uid: target_user_firebase_uid }).first();
        const moderatorUser = await knexInstance('users').where({ firebase_uid: moderator_firebase_uid }).first();

        if (!targetUser) {
            return res.status(404).json({ message: `Target user with UID ${target_user_firebase_uid} not found.` });
        }
        if (!moderatorUser) {
            return res.status(404).json({ message: `Moderator user with UID ${moderator_firebase_uid} not found.` });
        }

        if (!moderatorUser.role || !MODERATOR_ROLES.includes(moderatorUser.role)) {
            return res.status(403).json({ message: 'Forbidden: Only designated moderators, admins, or root can issue warnings.' });
        }
        if (targetUser.firebase_uid === moderatorUser.firebase_uid) {
             return res.status(400).json({ message: 'Forbidden: You cannot warn yourself.' });
        }

        await knexInstance.transaction(async (trx) => {
            await trx('users')
                .where({ id: targetUser.id })
                .increment('warnings', 1);

            await trx('user_warnings').insert({
                warned_user_id: targetUser.id,
                moderator_user_id: moderatorUser.id,
                reason: reason,
            });

            const updatedTargetUser = await trx('users').where({ id: targetUser.id }).first();

            if (updatedTargetUser && updatedTargetUser.warnings >= WARNING_THRESHOLD) {
                const bannedUntil = new Date();
                bannedUntil.setHours(bannedUntil.getHours() + BAN_DURATION_HOURS);

                await trx('users')
                    .where({ id: targetUser.id })
                    .update({
                        is_banned: true,
                        banned_until: bannedUntil,
                    });
            }
        });

        res.status(200).json({ message: 'User warned successfully' });
        logger.info('User warned', { targetUid: target_user_firebase_uid, moderatorUid: moderator_firebase_uid, reason: reason });

    } catch (error: any) {
        logger.error('Error in moderation/warn:', error);
        next(error);
    }
};