import { expect } from 'chai';
import request from 'supertest';
import { app } from '../index.js';
import { knexInstance } from './testUtils.js';
import sinon from 'sinon';
import * as authMiddleware from '../src/middleware/authMiddleware.js';
import { mockAuthenticateFirebaseToken } from './testSetup.js';
describe('Moderation API', () => {
    let moderatorUser, targetUser;
    const WARNING_THRESHOLD = 3;
    before(async () => {
        await knexInstance.migrate.latest();
    });
    beforeEach(async () => {
        await knexInstance('user_warnings').del();
        await knexInstance('reputation_votes').del();
        await knexInstance('users').del();
        sinon.stub(authMiddleware, 'authenticateFirebaseToken').callsFake(mockAuthenticateFirebaseToken);
        const [target] = await knexInstance('users').insert({
            firebase_uid: 'warn_target_uid',
            email: 'warntarget@example.com',
            username: 'WarnTarget',
            reputation: 0,
            role: 'user',
            warnings: 0,
            is_banned: false,
            banned_until: null,
        }).returning('*');
        targetUser = target;
        const [moderator] = await knexInstance('users').insert({
            firebase_uid: 'moderator_uid',
            email: 'moderator@example.com',
            username: 'ModeratorOne',
            reputation: 0,
            role: 'moderator',
            warnings: 0,
            is_banned: false,
            banned_until: null,
        }).returning('*');
        moderatorUser = moderator;
    });
    after(async () => {
        sinon.restore();
        await knexInstance.migrate.rollback();
        await knexInstance.destroy();
    });
    describe('POST /api/moderation/warn', () => {
        it('should successfully warn a user and increment their warning count', async () => {
            const res = await request(app)
                .post('/api/moderation/warn')
                .set('Authorization', `Bearer mock_${moderatorUser.firebase_uid}_token`)
                .send({
                target_user_firebase_uid: targetUser.firebase_uid,
                moderator_firebase_uid: moderatorUser.firebase_uid,
                reason: 'Test Warning 1',
            });
            expect(res.statusCode).to.equal(200);
            expect(res.body.message).to.equal('User warned successfully');
        });
    });
});
//# sourceMappingURL=moderation.test.js.map