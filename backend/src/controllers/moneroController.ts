// backend/src/controllers/moneroController.ts
import { Response, NextFunction, Request } from 'express';
import moneroService from '../lib/monero.js';
import logger from '../lib/logger.js';

export const getBalance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // This is an admin-only function for now, for security.
    // In a real app, you'd want RBAC here.
    const balance = await moneroService.getBalance();
    logger.info('Fetched Monero balance');
    res.status(200).json(balance);
  } catch (error) {
    logger.error('Error fetching Monero balance:', error);
    next(error);
  }
};
