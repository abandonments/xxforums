import logger from '../lib/logger';
export const checkRole = (roles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            logger.warn(`[RBAC] User not found on request or role is missing. Access denied.`);
            return res.status(403).json({ message: 'Forbidden: Access denied.' });
        }
        const userRole = req.user.role;
        if (!roles.includes(userRole)) {
            logger.warn(`[RBAC] User with role '${userRole}' tried to access a route restricted to roles: [${roles.join(', ')}]. Access denied.`);
            return res.status(403).json({ message: 'Forbidden: You do not have the required permissions.' });
        }
        logger.info(`[RBAC] User with role '${userRole}' granted access to a route restricted to roles: [${roles.join(', ')}].`);
        next();
    };
};
//# sourceMappingURL=rbacMiddleware.js.map