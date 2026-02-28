import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const knexfile: any = require('./knexfile.cjs');
import knex from 'knex';

const knexInstance = knex(knexfile.development as any);

async function checkUserStatus() {
  try {
    const user: { firebase_uid: string; warnings: number; is_banned: boolean; banned_until: Date | null } = await knexInstance('users').where({ firebase_uid: 'warn_target_uid_1' }).first();
    console.log('Warned User Status:', {
      firebase_uid: user.firebase_uid,
      warnings: user.warnings,
      is_banned: user.is_banned,
      banned_until: user.banned_until,
    });
  } catch (error) {
    console.error('Error checking user status:', error);
  } finally {
    await knexInstance.destroy();
  }
}

checkUserStatus();