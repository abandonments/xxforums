import sinon from 'sinon';
import { Response, NextFunction } from 'express';
import { Request as AuthRequest } from '../dist/src/middleware/authMiddleware.js';
declare const mockDecodeIdToken: sinon.SinonStub<any[], any>;
export declare const mockAuthenticateFirebaseToken: (req: AuthRequest, res: Response, next: NextFunction) => void;
export { mockDecodeIdToken };
//# sourceMappingURL=testSetup.d.ts.map