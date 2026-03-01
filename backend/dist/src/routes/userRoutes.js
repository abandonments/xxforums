import { Router } from 'express';
import { body } from 'express-validator';
import * as userController from '../controllers/userController.js';
import { authenticateFirebaseToken } from '../middleware/authMiddleware.js';
import { sanitizeInput } from '../middleware/sanitizationMiddleware.js';
const router = Router();
// Initiate user profile (create if not exists, retrieve if exists)
router.post('/initiate-profile', authenticateFirebaseToken, sanitizeInput, // Apply sanitization before validation
[
    body('firebase_uid').isString().notEmpty().withMessage('Firebase UID is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('username').isString().notEmpty().withMessage('Username is required'),
], userController.initiateProfile);
// Get user profile by firebase_uid
router.get('/:firebase_uid', userController.getUserProfile);
// Update user profile
router.put('/:firebase_uid/profile', authenticateFirebaseToken, sanitizeInput, // Apply sanitization to all update fields
[
    body('bio').optional().isString().trim(),
    body('signature').optional().isString().trim(),
    body('musicUrl').optional().isURL().withMessage('Invalid music URL'),
    body('musicAutoplay').optional().isBoolean(),
    body('customCss').optional().isString().trim(),
    body('bannerUrl').optional().isURL().withMessage('Invalid banner URL'),
    body('avatarUrl').optional().isURL().withMessage('Invalid avatar URL'),
], userController.updateUserProfile);
// Get profile comments
router.get('/:firebase_uid/comments', userController.getProfileComments);
// Post a profile comment
router.post('/:firebase_uid/comments', authenticateFirebaseToken, sanitizeInput, // Apply sanitization before validation
[
    body('content').isString().trim().notEmpty().withMessage('Comment content cannot be empty'),
], userController.postProfileComment);
// Delete a profile comment
router.delete('/:firebase_uid/comments/:commentId', authenticateFirebaseToken, userController.deleteProfileComment);
// Vouch for a user
router.post('/:firebase_uid/vouch', authenticateFirebaseToken, userController.vouchUser);
// Delete a user (Admin/Root only)
router.delete('/:firebase_uid', authenticateFirebaseToken, userController.deleteUser);
export default router;
//# sourceMappingURL=userRoutes.js.map