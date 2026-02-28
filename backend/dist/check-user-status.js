import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const knexfile = require('./knexfile.cjs');
import knex from 'knex';
const knexInstance = knex(knexfile.development);
async function checkUserStatus() {
    try {
        const user = await knexInstance('users').where({ firebase_uid: 'warn_target_uid_1' }).first();
        console.log('Warned User Status:', {
            firebase_uid: user.firebase_uid,
            warnings: user.warnings,
            is_banned: user.is_banned,
            banned_until: user.banned_until,
        });
    }
    catch (error) {
        console.error('Error checking user status:', error);
    }
    finally {
        await knexInstance.destroy();
    }
}
checkUserStatus();
//# sourceMappingURL=check-user-status.js.map