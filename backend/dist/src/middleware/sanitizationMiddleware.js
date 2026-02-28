import { filterXSS } from 'xss';
import logger from '../lib/logger.js';
// Function to recursively sanitize an object's string properties
const sanitizeObject = (obj) => {
    if (typeof obj !== 'object' || obj === null) {
        return obj;
    }
    if (Array.isArray(obj)) {
        return obj.map((item) => sanitizeObject(item));
    }
    const sanitizedObj = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const value = obj[key];
            if (typeof value === 'string') {
                sanitizedObj[key] = filterXSS(value);
            }
            else if (typeof value === 'object') {
                sanitizedObj[key] = sanitizeObject(value);
            }
            else {
                sanitizedObj[key] = value;
            }
        }
    }
    return sanitizedObj;
};
export const sanitizeInput = (req, res, next) => {
    try {
        if (req.body) {
            req.body = sanitizeObject(req.body);
        }
        if (req.query) {
            req.query = sanitizeObject(req.query);
        }
        if (req.params) {
            req.params = sanitizeObject(req.params);
        }
        next();
    }
    catch (error) {
        logger.error('Error during input sanitization:', error);
        res.status(500).json({ message: 'Internal server error during input processing.' });
    }
};
//# sourceMappingURL=sanitizationMiddleware.js.map