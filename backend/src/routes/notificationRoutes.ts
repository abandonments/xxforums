import express from 'express';
import { createNotificationHandler, getNotifications } from '../controllers/notificationController.js';
import { authenticateFirebaseToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', authenticateFirebaseToken, createNotificationHandler);
router.get('/:userId', authenticateFirebaseToken, getNotifications);

export default router;
