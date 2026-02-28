import express from 'express';
import * as moneroController from '../controllers/moneroController';
import { authMiddleware } from '../middleware/authMiddleware';
import { checkRole } from '../middleware/rbacMiddleware'; // Assuming you have this
import { UserRole } from '../types/user';
const router = express.Router();
// @route   GET /api/monero/balance
// @desc    Get the balance of the Monero wallet (Admin only)
// @access  Private (Admin)
router.get('/balance', authMiddleware, checkRole([UserRole.Admin, UserRole.Root]), moneroController.getBalance);
// Future routes for user-facing actions would go here, e.g.,
// router.post('/upgrade', authMiddleware, moneroController.initiateUpgrade);
// router.get('/payment-status/:paymentId', authMiddleware, moneroController.checkPaymentStatus);
export default router;
//# sourceMappingURL=moneroRoutes.js.map