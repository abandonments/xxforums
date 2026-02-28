import * as admin from 'firebase-admin';
import { Request } from 'express';
import { UserProfile } from './user';

// This file augments the Express Request type to include the firebaseUser and user properties.
declare global {
  namespace Express {
    interface Request {
      firebaseUser?: admin.auth.DecodedIdToken;
      user?: UserProfile; // For storing the full user profile from DB
    }
  }
}

// A more specific request type for routes that have passed through auth middleware
export interface AuthenticatedRequest extends Request {
  firebaseUser: admin.auth.DecodedIdToken;
  user: UserProfile;
}