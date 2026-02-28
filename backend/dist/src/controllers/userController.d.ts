import { Request, Response, NextFunction } from 'express';
import { Request as AuthRequest } from '../middleware/authMiddleware';
export interface UserProfile {
    id: number;
    firebase_uid: string;
    email: string;
    username: string;
    reputation: number;
    role: string;
    warnings: number;
    is_banned: boolean;
    banned_until: Date | null;
    avatarUrl?: string;
    bannerUrl?: string;
    bio?: string;
    signature?: string;
    musicUrl?: string;
    musicAutoplay?: boolean;
    customCss?: string;
    postCount?: number;
    profileViews?: number;
    trustScore?: number;
    vouchCount?: number;
    inventory?: string[];
    createdAt?: Date;
    updatedAt?: Date;
}
export declare const initiateProfile: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getUserProfile: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateUserProfile: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getProfileComments: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const postProfileComment: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const deleteProfileComment: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const vouchUser: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const deleteUser: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=userController.d.ts.map