import express from 'express';
import { createBroadcast, getBroadcasts } from '../controllers/broadcastController';
import { authMiddleware } from '../middleware/authMiddleware';
const router = express.Router();
router.post('/', authMiddleware, createBroadcast);
router.get('/', authMiddleware, getBroadcasts);
export default router;
//# sourceMappingURL=broadcastRoutes.js.map