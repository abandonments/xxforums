
import express from 'express';
import { createEscrow, getBalance, getAddress, releaseEscrow, getEscrows } from '../controllers/escrowController.ts';
import { authMiddleware } = '../middleware/authMiddleware.ts';

const router = express.Router();

router.get('/', authMiddleware, getEscrows);
router.post('/', authMiddleware, createEscrow);
router.get('/:id', authMiddleware, getEscrow);
router.get('/:name/balance', authMiddleware, getBalance);
router.get('/:name/address', authMiddleware, getAddress);
router.post('/release', authMiddleware, releaseEscrow);

export default router;
