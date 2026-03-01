import { expect } from 'chai';
import request from 'supertest';
import { app } from '../index.js';
import { knexInstance } from './testUtils.js';
import sinon from 'sinon';
import * as authMiddleware from '../src/middleware/authMiddleware.js';
import { mockAuthenticateFirebaseToken } from './testSetup.js';
describe('Reputation API', () => {
    let voterUser, targetUser;
    before(async () => {
        await knexInstance.migrate.latest();
    });
    beforeEach(async () => {
        await knexInstance('user_warnings').del();
        await knexInstance('reputation_votes').del();
        await knexInstance('users').del();
        sinon.stub(authMiddleware, 'authenticateFirebaseToken').callsFake(mockAuthenticateFirebaseToken);
        const [voter] = await knexInstance('users').insert({
            firebase_uid: 'voter_uid_test',
            email: 'voter_test@example.com',
            username: 'VoterTest',
            reputation: 0,
            role: 'user',
            warnings: 0,
            is_banned: false,
            banned_until: null,
        }).returning('*');
        voterUser = voter;
        const [target] = await knexInstance('users').insert({
            firebase_uid: 'target_uid_test',
            email: 'target_test@example.com',
            username: 'TargetTest',
            reputation: 0,
            role: 'user',
            warnings: 0,
            is_banned: false,
            banned_until: null,
        }).returning('*');
        targetUser = target;
    });
    after(async () => {
        sinon.restore();
        await knexInstance.migrate.rollback();
        await knexInstance.destroy();
    });
    describe('POST /api/reputation/vote', () => {
        it('should successfully give reputation to a user', async () => {
            const res = await request(app)
                .post('/api/reputation/vote')
                .set('Authorization', `Bearer mock_${voterUser.firebase_uid}_token`)
                .send({
                voter_firebase_uid: voterUser.firebase_uid,
                target_user_firebase_uid: targetUser.firebase_uid,
                postId: 'post123',
                postType: 'thread',
                delta: 1,
            });
            expect(res.statusCode).to.equal(200);
            expect(res.body.message).to.equal('Reputation updated successfully');
        });
    });
});
//# sourceMappingURL=reputation.test.js.map