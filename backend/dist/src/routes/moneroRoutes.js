import express from 'express';
import * as moneroController from '../controllers/moneroController.js';
import { authenticateFirebaseToken } from '../middleware/authMiddleware.js';
import { checkRole } from '../middleware/rbacMiddleware.js';
import { UserRole } from '../types/user.js';
const router = express.Router();
// @route   GET /api/monero/balance
// @desc    Get the balance of the Monero wallet (Admin only)
// @access  Private (Admin)
router.get('/balance', authenticateFirebaseToken, checkRole([UserRole.Admin, UserRole.Root]), moneroController.getBalance);
// Future routes for user-facing actions would go here, e.g.,
// router.post('/upgrade', authenticateFirebaseToken, moneroController.initiateUpgrade);
// router.get('/payment-status/:paymentId', authenticateFirebaseToken, moneroController.checkPaymentStatus);
export default router;
//# sourceMappingURL=moneroRoutes.js.map