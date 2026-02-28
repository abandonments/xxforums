import express from 'express';
import { getShoutboxMessages, postShoutboxMessage } from '../controllers/shoutboxController.ts';
import { authMiddleware } from '../middleware/authMiddleware.ts';
const router = express.Router();
router.get('/', authMiddleware, getShoutboxMessages);
router.post('/', authMiddleware, postShoutboxMessage);
export default router;
//# sourceMappingURL=shoutboxRoutes.js.map