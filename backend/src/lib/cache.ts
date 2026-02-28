// backend/src/lib/cache.ts
import NodeCache from 'node-cache';

const fiveMinutes = 5 * 60; // 5 minutes in seconds
const categoryCache = new NodeCache({ stdTTL: fiveMinutes });

export { categoryCache };
