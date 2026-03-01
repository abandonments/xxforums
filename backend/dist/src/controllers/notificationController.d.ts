import { Request, Response } from 'express';
export declare function createNotification(userId: number, type: string, message: string): Promise<void>;
export declare const createNotificationHandler: (req: Request, res: Response) => Promise<void>;
export declare const getNotifications: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=notificationController.d.ts.map