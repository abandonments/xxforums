import express from 'express';
import { setGlobalBroadcast, clearGlobalBroadcast } from '../controllers/broadcastController.js';
import { authenticateFirebaseToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', authenticateFirebaseToken, setGlobalBroadcast);
router.delete('/', authenticateFirebaseToken, clearGlobalBroadcast);

export default router;
