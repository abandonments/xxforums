import knex from 'knex';
import knexConfig from '../knexfile.js';
import sinon from 'sinon';
import * as authMiddleware from '../src/middleware/authMiddleware.js';
import { mockAuthenticateFirebaseToken } from './testSetup.js';
import { UserProfile } from '../src/types/user.js';

export const knexInstance = knex(knexConfig.development);

export async function clearDatabase() {
    await knexInstance('user_warnings').del();
    await knexInstance('reputation_votes').del();
    await knexInstance('user_vouches').del();
    await knexInstance('profile_comments').del();
    await knexInstance('users').del();
}

export function stubAuthMiddleware() {
    sinon.stub(authMiddleware, 'authenticateFirebaseToken').callsFake(mockAuthenticateFirebaseToken as any);
}

export function restoreAuthMiddleware() {
    sinon.restore();
}

export async function createTestUser(overrides?: Partial<UserProfile>): Promise<UserProfile> {
    const [user] = await knexInstance('users').insert({
        firebase_uid: 'base_test_uid',
        email: 'base_test@example.com',
        username: 'BaseTestUser',
        reputation: 0,
        role: 'user',
        warnings: 0,
        is_banned: false,
        banned_until: null,
        postCount: 0,
        trustScore: 0,
        vouchCount: 0,
        ...overrides,
    }).returning('*');
    return user;
}
