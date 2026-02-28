// backend/src/controllers/broadcastController.ts
import { Response, NextFunction, Request } from 'express';
import { knexInstance, io } from '../../index.ts'; // This will be changed to .ts
import logger from '../lib/logger.ts'; // This will be changed to .ts

export const setGlobalBroadcast = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.firebaseUser) {
      return res.status(401).json({ message: 'Unauthorized: User not authenticated.' });
    }

    const user = await knexInstance('users').where({ firebase_uid: req.firebaseUser.uid }).first();
    if (!user || !['admin', 'root'].includes(user.role)) {
      return res.status(403).json({ message: 'Forbidden: Insufficient permissions.' });
    }

    const { message, type } = req.body;

    // Deactivate all other broadcasts
    await knexInstance('global_alerts').update({ isActive: false });

    const [newBroadcast] = await knexInstance('global_alerts').insert({
      message,
      type,
      isActive: true,
    }).returning('*');

    io.emit('globalBroadcast', newBroadcast);
    logger.info(`Global broadcast set by ${user.username}: ${message}`);
    res.status(201).json(newBroadcast);
  } catch (error) {
    next(error);
  }
};

export const clearGlobalBroadcast = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.firebaseUser) {
      return res.status(401).json({ message: 'Unauthorized: User not authenticated.' });
    }

    const user = await knexInstance('users').where({ firebase_uid: req.firebaseUser.uid }).first();
    if (!user || !['admin', 'root'].includes(user.role)) {
      return res.status(403).json({ message: 'Forbidden: Insufficient permissions.' });
    }

    await knexInstance('global_alerts').update({ isActive: false });

    io.emit('globalBroadcast', null); // Send null to clear the broadcast on the frontend
    logger.info(`Global broadcast cleared by ${user.username}`);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
