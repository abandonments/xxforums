import { expect } from 'chai';
import request from 'supertest';
import { app } from '../index.js';
import { knexInstance, clearDatabase, stubAuthMiddleware, restoreAuthMiddleware, createTestUser } from './testUtils.js';
describe('Users API', () => {
    let testUser;
    before(async () => {
        await knexInstance.migrate.latest();
    });
    beforeEach(async () => {
        await clearDatabase();
        stubAuthMiddleware();
        testUser = await createTestUser({ postCount: 100 });
    });
    after(async () => {
        restoreAuthMiddleware();
        await knexInstance.migrate.rollback();
        await knexInstance.destroy();
    });
    describe('POST /api/users/initiate-profile', () => {
        it('should create a new user profile', async () => {
            const res = await request(app)
                .post('/api/users/initiate-profile')
                .set('Authorization', 'Bearer mock_new_uid_1_token')
                .send({ firebase_uid: 'new_uid_1', email: 'new1@example.com', username: 'newuser1' });
            expect(res.statusCode).to.equal(201);
            expect(res.body.user.firebase_uid).to.equal('new_uid_1');
        });
        it('should retrieve an existing user profile', async () => {
            const res = await request(app)
                .post('/api/users/initiate-profile')
                .set('Authorization', `Bearer mock_${testUser.firebase_uid}_token`)
                .send({ firebase_uid: testUser.firebase_uid, email: testUser.email, username: testUser.username });
            expect(res.statusCode).to.equal(200);
            expect(res.body.user.id).to.equal(testUser.id);
        });
    });
    describe('GET /api/users/:firebase_uid', () => {
        it('should get a user profile by firebase_uid', async () => {
            const res = await request(app).get(`/api/users/${testUser.firebase_uid}`);
            expect(res.statusCode).to.equal(200);
            expect(res.body.username).to.equal(testUser.username);
        });
    });
});
//# sourceMappingURL=users.test.js.map