import { Response, NextFunction } from 'express';
import { Request as AuthRequest } from '../middleware/authMiddleware.js';
export declare const uploadImage: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=uploadController.d.ts.map