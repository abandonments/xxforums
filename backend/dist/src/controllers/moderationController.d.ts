import { Response, NextFunction } from 'express';
import { Request as AuthRequest } from '../middleware/authMiddleware.js';
export declare const reputationVote: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const warnUser: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=moderationController.d.ts.map