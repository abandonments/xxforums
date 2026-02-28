
import express from 'express';
import { createNotification, getNotifications } from '../controllers/notificationController.ts';
import { authMiddleware } from '../middleware/authMiddleware.ts';

const router = express.Router();

router.post('/', authMiddleware, createNotification);
router.get('/:userId', authMiddleware, getNotifications);

export default router;
