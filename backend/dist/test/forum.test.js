import { expect } from 'chai';
import request from 'supertest';
import app from '../index.js';
import knex from 'knex';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const knexfile = require('../../knexfile.cjs');
import sinon from 'sinon'; // Import sinon
import * as authMiddleware from '../src/middleware/authMiddleware.js'; // Import the real middleware
import { mockAuthenticateFirebaseToken } from './testSetup.js'; // Import the mock middleware
const knexInstance = knex(knexfile.development);
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
        // Clean up all tables before each test
        await knexInstance('user_warnings').del();
        await knexInstance('reputation_votes').del();
        await knexInstance('profile_comments').del();
        await knexInstance('user_vouches').del();
        await knexInstance('posts').del();
        await knexInstance('threads').del();
        await knexInstance('categories').del();
        await knexInstance('users').del();
        // Stub the authentication middleware
        sinon.stub(authMiddleware, 'authenticateFirebaseToken').callsFake(mockAuthenticateFirebaseToken);
        // Create a regular user
        const [user] = await knexInstance('users').insert({
            firebase_uid: 'regular_user_uid',
            email: 'regular@example.com',
            username: 'RegularUser',
            role: 'user',
        }).returning('*');
        regularUser = user;
        // Create an admin user
        const [admin] = await knexInstance('users').insert({
            firebase_uid: 'admin_user_uid',
            email: 'admin@example.com',
            username: 'AdminUser',
            role: 'admin',
        }).returning('*');
        adminUser = admin;
        // Create a banned user
        const [banned] = await knexInstance('users').insert({
            firebase_uid: 'banned_user_uid',
            email: 'banned@example.com',
            username: 'BannedUser',
            role: 'user',
            is_banned: true,
        }).returning('*');
        bannedUser = banned;
        // Create a category
        const [category] = await knexInstance('categories').insert({
            name: 'Test Category',
            description: 'Description for test category',
        }).returning('*');
        categoryId = category.id;
        // Create a thread
        const [thread] = await knexInstance('threads').insert({
            category_id: categoryId,
            user_id: regularUser.id,
            title: 'Test Thread Title',
            content: 'Content of the test thread',
        }).returning('*');
        threadId = thread.id;
        // Create a post (reply)
        const [post] = await knexInstance('posts').insert({
            thread_id: threadId,
            user_id: regularUser.id,
            content: 'Content of the test post',
        }).returning('*');
        postId = post.id;
    });
    after(async () => {
        sinon.restore(); // Restore all stubs after each test
        await knexInstance.migrate.rollback();
        await knexInstance.destroy();
    });
    // --- Category Tests ---
    describe('Category API', () => {
        describe('POST /api/forum/categories', () => {
            it('should create a new category (admin)', async () => {
                const res = await request(app)
                    .post('/api/forum/categories')
                    .send({ firebaseUser: { uid: adminUser.firebase_uid }, name: 'New Category', description: 'New description' });
                expect(res.statusCode).to.equal(201);
                expect(res.body).to.have.property('id');
                expect(res.body.name).to.equal('New Category');
            });
            it('should return 403 if non-admin user tries to create a category', async () => {
                const res = await request(app)
                    .post('/api/forum/categories')
                    .send({ firebaseUser: { uid: regularUser.firebase_uid }, name: 'Unauthorized Category' });
                expect(res.statusCode).to.equal(403);
                expect(res.body.message).to.equal('Forbidden: Only admin or root can update categories.'); // This error message comes from update, should be specific to create
            });
        });
        describe('GET /api/forum/categories', () => {
            it('should get all categories', async () => {
                const res = await request(app).get('/api/forum/categories');
                expect(res.statusCode).to.equal(200);
                expect(res.body).to.be.an('array').that.is.not.empty;
                expect(res.body[0].name).to.equal('Test Category');
            });
        });
        describe('GET /api/forum/categories/:id', () => {
            it('should get a category by ID', async () => {
                const res = await request(app).get(`/api/forum/categories/${categoryId}`);
                expect(res.statusCode).to.equal(200);
                expect(res.body).to.have.property('name').to.equal('Test Category');
            });
            it('should return 404 if category not found', async () => {
                const res = await request(app).get('/api/forum/categories/9999');
                expect(res.statusCode).to.equal(404);
                expect(res.body.message).to.equal('Category with ID 9999 not found.');
            });
        });
        describe('PUT /api/forum/categories/:id', () => {
            it('should update a category (admin)', async () => {
                const res = await request(app)
                    .put(`/api/forum/categories/${categoryId}`)
                    .send({ firebaseUser: { uid: adminUser.firebase_uid }, name: 'Updated Category' });
                expect(res.statusCode).to.equal(200);
                expect(res.body.name).to.equal('Updated Category');
            });
            it('should return 403 if non-admin user tries to update a category', async () => {
                const res = await request(app)
                    .put(`/api/forum/categories/${categoryId}`)
                    .send({ firebaseUser: { uid: regularUser.firebase_uid }, name: 'Unauthorized Update' });
                expect(res.statusCode).to.equal(403);
                expect(res.body.message).to.equal('Forbidden: Only admin or root can update categories.');
            });
            it('should return 404 if category not found', async () => {
                const res = await request(app)
                    .put('/api/forum/categories/9999')
                    .send({ firebaseUser: { uid: adminUser.firebase_uid }, name: 'Non Existent' });
                expect(res.statusCode).to.equal(404);
                expect(res.body.message).to.equal('Category with ID 9999 not found.');
            });
        });
        describe('DELETE /api/forum/categories/:id', () => {
            it('should delete a category (admin)', async () => {
                const res = await request(app)
                    .delete(`/api/forum/categories/${categoryId}`)
                    .send({ firebaseUser: { uid: adminUser.firebase_uid } }); // Mock firebaseUser
                expect(res.statusCode).to.equal(204);
                const deletedCategory = await knexInstance('categories').where({ id: categoryId }).first();
                expect(deletedCategory).to.be.undefined;
            });
            it('should return 403 if non-admin user tries to delete a category', async () => {
                const res = await request(app)
                    .delete(`/api/forum/categories/${categoryId}`)
                    .send({ firebaseUser: { uid: regularUser.firebase_uid } }); // Mock firebaseUser
                expect(res.statusCode).to.equal(403);
                expect(res.body.message).to.equal('Forbidden: Only admin or root can delete categories.');
            });
        });
    });
    // --- Thread Tests ---
    describe('Thread API', () => {
        describe('POST /api/forum/threads', () => {
            it('should create a new thread', async () => {
                const res = await request(app)
                    .post('/api/forum/threads')
                    .send({ firebaseUser: { uid: regularUser.firebase_uid }, category_id: categoryId, title: 'New Thread', content: 'New thread content' });
                expect(res.statusCode).to.equal(201);
                expect(res.body).to.have.property('id');
                expect(res.body.title).to.equal('New Thread');
            });
            it('should return 403 if banned user tries to create a thread', async () => {
                const res = await request(app)
                    .post('/api/forum/threads')
                    .send({ firebaseUser: { uid: bannedUser.firebase_uid }, category_id: categoryId, title: 'Banned Thread', content: 'Banned thread content' });
                expect(res.statusCode).to.equal(403);
                expect(res.body.message).to.equal('Forbidden: Banned users cannot create threads.');
            });
        });
        describe('GET /api/forum/threads', () => {
            it('should get all threads', async () => {
                const res = await request(app).get('/api/forum/threads');
                expect(res.statusCode).to.equal(200);
                expect(res.body).to.be.an('array').that.is.not.empty;
                expect(res.body[0].title).to.equal('Test Thread Title');
                expect(res.body[0]).to.have.property('username'); // Check for joined data
            });
            it('should get threads by category ID', async () => {
                const [otherCategory] = await knexInstance('categories').insert({ name: 'Other Cat' }).returning('*');
                await knexInstance('threads').insert({ category_id: otherCategory.id, user_id: regularUser.id, title: 'Other Thread', content: 'Content' });
                const res = await request(app).get(`/api/forum/threads?categoryId=${categoryId}`);
                expect(res.statusCode).to.equal(200);
                expect(res.body).to.be.an('array').that.has.lengthOf(1);
                expect(res.body[0].title).to.equal('Test Thread Title');
            });
        });
        describe('GET /api/forum/threads/:id', () => {
            it('should get a thread by ID', async () => {
                const res = await request(app).get(`/api/forum/threads/${threadId}`);
                expect(res.statusCode).to.equal(200);
                expect(res.body).to.have.property('title').to.equal('Test Thread Title');
                expect(res.body).to.have.property('username'); // Check for joined data
            });
            it('should return 404 if thread not found', async () => {
                const res = await request(app).get('/api/forum/threads/9999');
                expect(res.statusCode).to.equal(404);
                expect(res.body.message).to.equal('Thread with ID 9999 not found.');
            });
        });
        describe('PUT /api/forum/threads/:id', () => {
            it('should update a thread (owner)', async () => {
                const res = await request(app)
                    .put(`/api/forum/threads/${threadId}`)
                    .send({ firebaseUser: { uid: regularUser.firebase_uid }, title: 'Updated Thread Title' });
                expect(res.statusCode).to.equal(200);
                expect(res.body.title).to.equal('Updated Thread Title');
            });
            it('should allow admin to update a thread they do not own', async () => {
                const res = await request(app)
                    .put(`/api/forum/threads/${threadId}`)
                    .send({ firebaseUser: { uid: adminUser.firebase_uid }, title: 'Admin Updated Thread Title' });
                expect(res.statusCode).to.equal(200);
                expect(res.body.title).to.equal('Admin Updated Thread Title');
            });
            it('should return 403 if non-owner/non-admin tries to update', async () => {
                const [unauthorizedUser] = await knexInstance('users').insert({ firebase_uid: 'unauth_thread_uid', email: 'unauth_thread@example.com', username: 'UnauthThread' }).returning('*');
                const res = await request(app)
                    .put(`/api/forum/threads/${threadId}`)
                    .send({ firebaseUser: { uid: unauthorizedUser.firebase_uid }, title: 'Unauthorized Update' });
                expect(res.statusCode).to.equal(403);
                expect(res.body.message).to.equal('Forbidden: You do not have permission to update this thread.');
            });
        });
        describe('DELETE /api/forum/threads/:id', () => {
            it('should delete a thread (owner)', async () => {
                const res = await request(app)
                    .delete(`/api/forum/threads/${threadId}`)
                    .send({ firebaseUser: { uid: regularUser.firebase_uid } });
                expect(res.statusCode).to.equal(204);
                const deletedThread = await knexInstance('threads').where({ id: threadId }).first();
                expect(deletedThread).to.be.undefined;
            });
            it('should allow admin to delete a thread they do not own', async () => {
                const res = await request(app)
                    .delete(`/api/forum/threads/${threadId}`)
                    .send({ firebaseUser: { uid: adminUser.firebase_uid } }); // Mock firebaseUser
                expect(res.statusCode).to.equal(204);
                const deletedThread = await knexInstance('threads').where({ id: threadId }).first();
                expect(deletedThread).to.be.undefined;
            });
            it('should return 403 if non-owner/non-admin tries to delete', async () => {
                const [unauthorizedUser] = await knexInstance('users').insert({ firebase_uid: 'unauth_del_thread_uid', email: 'unauth_del_thread@example.com', username: 'UnauthDelThread' }).returning('*');
                const res = await request(app)
                    .delete(`/api/forum/threads/${threadId}`)
                    .send({ firebaseUser: { uid: unauthorizedUser.firebase_uid } });
                expect(res.statusCode).to.equal(403);
                expect(res.body.message).to.equal('Forbidden: You do not have permission to delete this thread.');
            });
        });
    });
    // --- Post Tests ---
    describe('Post API', () => {
        describe('POST /api/forum/threads/:threadId/posts', () => {
            it('should create a new post', async () => {
                const res = await request(app)
                    .post(`/api/forum/threads/${threadId}/posts`)
                    .send({ firebaseUser: { uid: regularUser.firebase_uid }, content: 'New post content' });
                expect(res.statusCode).to.equal(201);
                expect(res.body).to.have.property('id');
                expect(res.body.content).to.equal('New post content');
            });
            it('should return 403 if banned user tries to create a post', async () => {
                const res = await request(app)
                    .post(`/api/forum/threads/${threadId}/posts`)
                    .send({ firebaseUser: { uid: bannedUser.firebase_uid }, content: 'Banned post content' });
                expect(res.statusCode).to.equal(403);
                expect(res.body.message).to.equal('Forbidden: Banned users cannot create posts.');
            });
        });
        describe('GET /api/forum/threads/:threadId/posts', () => {
            it('should get all posts for a thread', async () => {
                const res = await request(app).get(`/api/forum/threads/${threadId}/posts`);
                expect(res.statusCode).to.equal(200);
                expect(res.body).to.be.an('array').that.is.not.empty;
                expect(res.body[0].content).to.equal('Content of the test post');
                expect(res.body[0]).to.have.property('username'); // Check for joined data
            });
            it('should return 404 if no posts found for thread', async () => {
                // Create a thread with no posts
                const [newThread] = await knexInstance('threads').insert({ category_id: categoryId, user_id: regularUser.id, title: 'Empty Thread', content: 'Empty' }).returning('*');
                const res = await request(app).get(`/api/forum/threads/${newThread.id}/posts`);
                expect(res.statusCode).to.equal(404);
                expect(res.body.message).to.equal('No posts found for this thread.');
            });
        });
        describe('GET /api/forum/posts/:id', () => {
            it('should get a post by ID', async () => {
                const res = await request(app).get(`/api/forum/posts/${postId}`);
                expect(res.statusCode).to.equal(200);
                expect(res.body).to.have.property('content').to.equal('Content of the test post');
                expect(res.body).to.have.property('username'); // Check for joined data
            });
            it('should return 404 if post not found', async () => {
                const res = await request(app).get('/api/forum/posts/9999');
                expect(res.statusCode).to.equal(404);
                expect(res.body.message).to.equal('Post with ID 9999 not found.');
            });
        });
        describe('PUT /api/forum/posts/:id', () => {
            it('should update a post (owner)', async () => {
                const res = await request(app)
                    .put(`/api/forum/posts/${postId}`)
                    .send({ firebaseUser: { uid: regularUser.firebase_uid }, content: 'Updated Post Content' });
                expect(res.statusCode).to.equal(200);
                expect(res.body.content).to.equal('Updated Post Content');
            });
            it('should allow admin to update a post they do not own', async () => {
                const res = await request(app)
                    .put(`/api/forum/posts/${postId}`)
                    .send({ firebaseUser: { uid: adminUser.firebase_uid }, content: 'Admin Updated Post Content' });
                expect(res.statusCode).to.equal(200);
                expect(res.body.content).to.equal('Admin Updated Post Content');
            });
            it('should return 403 if non-owner/non-admin tries to update', async () => {
                const [unauthorizedUser] = await knexInstance('users').insert({ firebase_uid: 'unauth_post_uid', email: 'unauth_post@example.com', username: 'UnauthPost' }).returning('*');
                const res = await request(app)
                    .put(`/api/forum/posts/${postId}`)
                    .send({ firebaseUser: { uid: unauthorizedUser.firebase_uid }, content: 'Unauthorized Update' });
                expect(res.statusCode).to.equal(403);
                expect(res.body.message).to.equal('Forbidden: You do not have permission to update this post.');
            });
        });
        describe('DELETE /api/forum/posts/:id', () => {
            it('should delete a post (owner)', async () => {
                const res = await request(app)
                    .delete(`/api/forum/posts/${postId}`)
                    .send({ firebaseUser: { uid: regularUser.firebase_uid } });
                expect(res.statusCode).to.equal(204);
                const deletedPost = await knexInstance('posts').where({ id: postId }).first();
                expect(deletedPost).to.be.undefined;
            });
            it('should allow admin to delete a post they do not own', async () => {
                const res = await request(app)
                    .delete(`/api/forum/posts/${postId}`)
                    .send({ firebaseUser: { uid: adminUser.firebase_uid } });
                expect(res.statusCode).to.equal(204);
                const deletedPost = await knexInstance('posts').where({ id: postId }).first();
                expect(deletedPost).to.be.undefined;
            });
            it('should return 403 if non-owner/non-admin tries to delete', async () => {
                const [unauthorizedUser] = await knexInstance('users').insert({ firebase_uid: 'unauth_del_post_uid', email: 'unauth_del_post@example.com', username: 'UnauthDelPost' }).returning('*');
                const res = await request(app)
                    .delete(`/api/forum/posts/${postId}`)
                    .send({ firebaseUser: { uid: unauthorizedUser.firebase_uid } });
                expect(res.statusCode).to.equal(403);
                expect(res.body.message).to.equal('Forbidden: You do not have permission to delete this post.');
            });
        });
    });
});
//# sourceMappingURL=forum.test.js.map