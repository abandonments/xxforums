import { Router } from 'express';
import { body } from 'express-validator';
import * as moderationController from '../controllers/moderationController.js';
import { authenticateFirebaseToken } from '../middleware/authMiddleware.js';

const router = Router();

// Reputation vote
router.post(
  '/reputation/vote',
  authenticateFirebaseToken,
  [
    body('voter_firebase_uid').isString().notEmpty().withMessage('Voter Firebase UID is required'),
    body('target_user_firebase_uid').isString().notEmpty().withMessage('Target User Firebase UID is required'),
    body('postId').isString().notEmpty().withMessage('Post ID is required'),
    body('postType').isIn(['thread', 'reply']).withMessage('Post Type must be "thread" or "reply"'),
    body('delta').isInt({ min: -1, max: 1 }).withMessage('Delta must be 1 or -1'),
  ],
  moderationController.reputationVote
);

// Warn user
router.post(
  '/warn',
  authenticateFirebaseToken,
  [
    body('target_user_firebase_uid').isString().notEmpty().withMessage('Target User Firebase UID is required'),
    body('moderator_firebase_uid').isString().notEmpty().withMessage('Moderator Firebase UID is required'),
    body('reason').isString().notEmpty().withMessage('Reason is required'),
  ],
  moderationController.warnUser
);

export default router;
