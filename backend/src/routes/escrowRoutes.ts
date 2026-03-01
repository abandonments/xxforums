import express from 'express';
import { createEscrow, getBalance, getAddress, releaseEscrow, getEscrows, getEscrow } from '../controllers/escrowController.js';
import { authenticateFirebaseToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', authenticateFirebaseToken, getEscrows);
router.post('/', authenticateFirebaseToken, createEscrow);
router.get('/:id', authenticateFirebaseToken, getEscrow);
router.get('/:name/balance', authenticateFirebaseToken, getBalance);
router.get('/:name/address', authenticateFirebaseToken, getAddress);
router.post('/release', authenticateFirebaseToken, releaseEscrow);

export default router;
