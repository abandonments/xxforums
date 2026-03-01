import { Response, NextFunction, Request } from 'express';
import { UserRole } from '../types/user.js';
export declare const checkRole: (roles: UserRole[]) => (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=rbacMiddleware.d.ts.map