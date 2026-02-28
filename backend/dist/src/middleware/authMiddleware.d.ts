import { Request, Response, NextFunction } from 'express';
import admin from 'firebase-admin';
declare global {
    namespace Express {
        interface Request {
            firebaseUser?: admin.auth.DecodedIdToken;
        }
    }
}
export declare const authenticateFirebaseToken: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=authMiddleware.d.ts.map