import { expect } from 'chai';
import request from 'supertest';
import { app } from '../index.js';
import { knexInstance } from './testUtils.js';
import sinon from 'sinon';
import * as authMiddleware from '../src/middleware/authMiddleware.js';
import { mockAuthenticateFirebaseToken } from './testSetup.js';
describe('Forum API', () => {
    let regularUser;
    let adminUser;
    let bannedUser;
    let categoryId;
    let threadId;
    let postId;
    before(async () => {
        await knexInstance.migrate.latest();
    });
    beforeEach(async () => {
        await knexInstance('user_warnings').del();
        await knexInstance('reputation_votes').del();
        await knexInstance('profile_comments').del();
        await knexInstance('user_vouches').del();
        await knexInstance('posts').del();
        await knexInstance('threads').del();
        await knexInstance('categories').del();
        await knexInstance('users').del();
        sinon.stub(authMiddleware, 'authenticateFirebaseToken').callsFake(mockAuthenticateFirebaseToken);
        const [user] = await knexInstance('users').insert({
            firebase_uid: 'regular_user_uid',
            email: 'regular@example.com',
            username: 'RegularUser',
            role: 'user',
        }).returning('*');
        regularUser = user;
        const [admin] = await knexInstance('users').insert({
            firebase_uid: 'admin_user_uid',
            email: 'admin@example.com',
            username: 'AdminUser',
            role: 'admin',
        }).returning('*');
        adminUser = admin;
        const [banned] = await knexInstance('users').insert({
            firebase_uid: 'banned_user_uid',
            email: 'banned@example.com',
            username: 'BannedUser',
            role: 'user',
            is_banned: true,
        }).returning('*');
        bannedUser = banned;
        const [category] = await knexInstance('categories').insert({
            name: 'Test Category',
            description: 'Description for test category',
        }).returning('*');
        categoryId = category.id;
        const [thread] = await knexInstance('threads').insert({
            category_id: categoryId,
            user_id: regularUser.id,
            title: 'Test Thread Title',
            content: 'Content of the test thread',
        }).returning('*');
        threadId = thread.id;
        const [post] = await knexInstance('posts').insert({
            thread_id: threadId,
            user_id: regularUser.id,
            content: 'Content of the test post',
        }).returning('*');
        postId = post.id;
    });
    after(async () => {
        sinon.restore();
        await knexInstance.migrate.rollback();
        await knexInstance.destroy();
    });
    describe('Category API', () => {
        describe('POST /api/forum/categories', () => {
            it('should create a new category (admin)', async () => {
                const res = await request(app)
                    .post('/api/forum/categories')
                    .set('Authorization', `Bearer mock_${adminUser.firebase_uid}_token`)
                    .send({ name: 'New Category', description: 'New description' });
                expect(res.statusCode).to.equal(201);
                expect(res.body).to.have.property('id');
                expect(res.body.name).to.equal('New Category');
            });
            it('should return 403 if non-admin user tries to create a category', async () => {
                const res = await request(app)
                    .post('/api/forum/categories')
                    .set('Authorization', `Bearer mock_${regularUser.firebase_uid}_token`)
                    .send({ name: 'Unauthorized Category' });
                expect(res.statusCode).to.equal(403);
            });
        });
        describe('GET /api/forum/categories', () => {
            it('should get all categories', async () => {
                const res = await request(app).get('/api/forum/categories').set('Authorization', `Bearer mock_${regularUser.firebase_uid}_token`);
                expect(res.statusCode).to.equal(200);
                expect(res.body).to.be.an('array').that.is.not.empty;
                expect(res.body[0].name).to.equal('Test Category');
            });
        });
        describe('GET /api/forum/categories/:id', () => {
            it('should get a category by ID', async () => {
                const res = await request(app).get(`/api/forum/categories/${categoryId}`).set('Authorization', `Bearer mock_${regularUser.firebase_uid}_token`);
                expect(res.statusCode).to.equal(200);
                expect(res.body).to.have.property('name').to.equal('Test Category');
            });
            it('should return 404 if category not found', async () => {
                const res = await request(app).get('/api/forum/categories/9999').set('Authorization', `Bearer mock_${regularUser.firebase_uid}_token`);
                expect(res.statusCode).to.equal(404);
            });
        });
        describe('PUT /api/forum/categories/:id', () => {
            it('should update a category (admin)', async () => {
                const res = await request(app)
                    .put(`/api/forum/categories/${categoryId}`)
                    .set('Authorization', `Bearer mock_${adminUser.firebase_uid}_token`)
                    .send({ name: 'Updated Category' });
                expect(res.statusCode).to.equal(200);
                expect(res.body.name).to.equal('Updated Category');
            });
            it('should return 403 if non-admin user tries to update a category', async () => {
                const res = await request(app)
                    .put(`/api/forum/categories/${categoryId}`)
                    .set('Authorization', `Bearer mock_${regularUser.firebase_uid}_token`)
                    .send({ name: 'Unauthorized Update' });
                expect(res.statusCode).to.equal(403);
            });
        });
        describe('DELETE /api/forum/categories/:id', () => {
            it('should delete a category (admin)', async () => {
                const res = await request(app)
                    .delete(`/api/forum/categories/${categoryId}`)
                    .set('Authorization', `Bearer mock_${adminUser.firebase_uid}_token`);
                expect(res.statusCode).to.equal(204);
            });
        });
    });
});
//# sourceMappingURL=forum.test.js.map