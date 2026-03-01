import express from 'express';
import { getShoutboxMessages, postShoutboxMessage } from '../controllers/shoutboxController.js';
import { authenticateFirebaseToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', authenticateFirebaseToken, getShoutboxMessages);
router.post('/', authenticateFirebaseToken, postShoutboxMessage);

export default router;
