import logger from '../lib/logger.js';
import { knexInstance } from '../../index.js';
export const checkRole = (roles) => {
    return async (req, res, next) => {
        if (!req.userId) {
            logger.warn(`[RBAC] User not found on request. Access denied.`);
            return res.status(403).json({ message: 'Forbidden: Access denied.' });
        }
        const user = await knexInstance('users').where({ firebase_uid: req.userId }).first();
        if (!user || !user.role) {
            logger.warn(`[RBAC] User not found in db or role is missing. Access denied.`);
            return res.status(403).json({ message: 'Forbidden: Access denied.' });
        }
        const userRole = user.role;
        if (!roles.includes(userRole)) {
            logger.warn(`[RBAC] User with role '${userRole}' tried to access a route restricted to roles: [${roles.join(', ')}]. Access denied.`);
            return res.status(403).json({ message: 'Forbidden: You do not have the required permissions.' });
        }
        logger.info(`[RBAC] User with role '${userRole}' granted access to a route restricted to roles: [${roles.join(', ')}].`);
        next();
    };
};
//# sourceMappingURL=rbacMiddleware.js.map