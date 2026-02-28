import admin from 'firebase-admin';
import logger from '../lib/logger.js';
// Utility function to verify Firebase ID token
export const verifyFirebaseIdToken = async (idToken) => {
    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        return decodedToken;
    }
    catch (error) {
        logger.error('Error while verifying Firebase ID token:', error);
        throw new Error('Invalid or expired Firebase ID token.');
    }
};
export const authenticateFirebaseToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No Firebase ID token provided.' });
    }
    const idToken = authHeader.split('Bearer ')[1];
    try {
        const decodedToken = await verifyFirebaseIdToken(idToken);
        req.userId = decodedToken.uid;
        next();
    }
    catch (error) {
        return res.status(403).json({ message: `Unauthorized: ${error.message}` });
    }
};
// Middleware for Socket.IO authentication
export const socketAuthMiddleware = async (socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
        return next(new Error('Authentication error: No token provided.'));
    }
    try {
        const decodedToken = await verifyFirebaseIdToken(token);
        socket.userId = decodedToken.uid; // Attach userId to the socket object
        next();
    }
    catch (error) {
        logger.error('Socket.IO authentication error:', error);
        next(new Error(`Authentication error: ${error.message}`));
    }
};
//# sourceMappingURL=authMiddleware.js.map