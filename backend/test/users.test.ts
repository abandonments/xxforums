import * as chai from 'chai';
import { expect } from 'chai';
import request from 'supertest';
import app from '../index.js';
import { knexInstance, clearDatabase, stubAuthMiddleware, restoreAuthMiddleware, createTestUser } from './testUtils.js';
import { UserProfile } from '../src/types/user.js';

describe('Users API', () => {
  let testUser: UserProfile;

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
        .send({ firebase_uid: 'new_uid_1', email: 'new1@example.com', username: 'newuser1' });

      expect(res.statusCode).to.equal(201);
      expect(res.body).to.be.an('object');
      expect(res.body.message).to.equal('User profile created');
      expect(res.body.user).to.have.property('id').that.is.a('number');
      expect(res.body.user.firebase_uid).to.equal('new_uid_1');
      expect(res.body.user.email).to.equal('new1@example.com');
      expect(res.body.user.username).to.equal('newuser1');
      expect(res.body.user.reputation).to.equal(0);
      expect(res.body.user.role).to.equal('user');
      expect(res.body.user.warnings).to.equal(0);
      expect(res.body.user.is_banned).to.be.false;
      expect(res.body.user.banned_until).to.be.null;
      expect(res.body.user.postCount).to.equal(0);
      expect(res.body.user.trustScore).to.equal(0);
      expect(res.body.user.vouchCount).to.equal(0);
    });

    it('should retrieve an existing user profile', async () => {
      const res = await request(app)
        .post('/api/users/initiate-profile')
        .send({ firebase_uid: testUser.firebase_uid, email: testUser.email, username: testUser.username });

      expect(res.statusCode).to.equal(200);
      expect(res.body).to.be.an('object');
      expect(res.body.message).to.equal('User profile retrieved');
      expect(res.body.user.firebase_uid).to.equal(testUser.firebase_uid);
      expect(res.body.user.id).to.equal(testUser.id);
    });

    it('should return 400 for invalid input', async () => {
      const res = await request(app)
        .post('/api/users/initiate-profile')
        .send({ firebase_uid: 'invalid', email: 'not-an-email', username: '' });

      expect(res.statusCode).to.equal(400);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property('errors').that.is.an('array').with.lengthOf(2);
      expect(res.body.errors[0]).to.have.property('msg').that.includes('Valid email is required');
      expect(res.body.errors[1]).to.have.property('msg').that.includes('Username is required');
    });
  });

  describe('GET /api/users/:firebase_uid', () => {
    it('should get a user profile by firebase_uid', async () => {
      const res = await request(app).get(`/api/users/${testUser.firebase_uid}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body).to.be.an('object');
      expect(res.body.firebase_uid).to.equal(testUser.firebase_uid);
      expect(res.body.username).to.equal(testUser.username);
      expect(res.body.profileViews).to.equal(1);
    });

    it('should return 404 if user profile not found', async () => {
      const res = await request(app).get('/api/users/non_existent_uid');

      expect(res.statusCode).to.equal(404);
      expect(res.body.message).to.equal('User profile with UID non_existent_uid not found.');
    });
  });

  describe('PUT /api/users/:firebase_uid/profile', () => {
    it('should update a user\'s own profile', async () => {
      const res = await request(app)
        .put(`/api/users/${testUser.firebase_uid}/profile`)
        .set('Authorization', `Bearer mock_base_test_uid_token`)
        .send({ bio: 'Updated bio' });

      expect(res.statusCode).to.equal(200);
      expect(res.body).to.be.an('object');
      expect(res.body.bio).to.equal('Updated bio');
      expect(new Date(res.body.updatedAt).getTime()).to.be.greaterThan(new Date(testUser.updatedAt!).getTime());
    });

    it('should sanitize XSS input when updating user profile', async () => {
      const maliciousBio = '<script>alert("xss")</script>Evil Bio';
      const expectedBio = 'Evil Bio'; // filterXSS by default removes script tags

      const res = await request(app)
        .put(`/api/users/${testUser.firebase_uid}/profile`)
        .set('Authorization', `Bearer mock_base_test_uid_token`)
        .send({ bio: maliciousBio });

      expect(res.statusCode).to.equal(200);
      expect(res.body).to.be.an('object');
      expect(res.body.bio).to.equal(expectedBio);

      const updatedUserInDb = await knexInstance('users').where({ id: testUser.id }).first();
      expect(updatedUserInDb.bio).to.equal(expectedBio);
    });

    it('should allow admin to update another user\'s profile', async () => {
      const adminUser = (await knexInstance('users').insert({
        firebase_uid: 'adminUpdate_uid', email: 'admin_update@example.com', username: 'AdminUpdate', role: 'admin',
      }).returning('*'))[0];

      const res = await request(app)
        .put(`/api/users/${testUser.firebase_uid}/profile`)
        .set('Authorization', `Bearer mock_admin_update_token`)
        .send({ bio: 'Admin updated bio' });

      expect(res.statusCode).to.equal(200);
      expect(res.body).to.be.an('object');
      expect(res.body.bio).to.equal('Admin updated bio');
      expect(new Date(res.body.updatedAt).getTime()).to.be.greaterThan(new Date(testUser.updatedAt!).getTime());
    });

    it('should return 403 if unauthorized user tries to update profile', async () => {
      const [anotherUser] = await knexInstance('users').insert({
        firebase_uid: 'another_firebase_uid', email: 'another@example.com', username: 'AnotherUser',
      }).returning('*');

      const res = await request(app)
        .put(`/api/users/${testUser.firebase_uid}/profile`)
        .set('Authorization', `Bearer mock_another_uid_token`)
        .send({ bio: 'Unauthorized update' });

      expect(res.statusCode).to.equal(403);
      expect(res.body.message).to.equal('Forbidden: You can only update your own profile or must be an admin/root.');
    });

    it('should return 401 if no authentication token is provided', async () => {
      const res = await request(app)
        .put(`/api/users/${testUser.firebase_uid}/profile`)
        .send({ bio: 'Unauthorized update' });

      expect(res.statusCode).to.equal(401);
      expect(res.body.message).to.equal('Unauthorized: No token provided.');
    });

    it('should return 404 if user profile not found for update', async () => {
      const adminUser = (await knexInstance('users').insert({
        firebase_uid: 'adminUserNoExistUpdate_uid', email: 'admin_update_nonexistent@example.com', username: 'AdminUserNoExistUpdate', role: 'admin',
      }).returning('*'))[0];

      const res = await request(app)
        .put('/api/users/non_existent_uid_for_update/profile')
        .set('Authorization', `Bearer mock_admin_token`)
        .send({ bio: 'Admin updated bio' });

      expect(res.statusCode).to.equal(404);
      expect(res.body.message).to.equal('User profile with UID non_existent_uid_for_update not found for update.');
    });
  });

  describe('GET /api/users/:firebase_uid/comments', () => {
    it('should get profile comments for a user', async () => {
      const [commenter] = await knexInstance('users').insert({
        firebase_uid: 'commenter_uid', email: 'commenter@example.com', username: 'Commenter',
      }).returning('*');
      await knexInstance('profile_comments').insert({
        to_user_id: testUser.id, from_user_id: commenter.id, content: 'Nice profile!',
      });

      const res = await request(app).get(`/api/users/${testUser.firebase_uid}/comments`);

      expect(res.statusCode).to.equal(200);
      expect(res.body).to.be.an('array').with.lengthOf(1);
      expect(res.body[0].content).to.equal('Nice profile!');
      expect(res.body[0].fromUsername).to.equal('Commenter');
    });
  });

  describe('POST /api/users/:firebase_uid/comments', () => {
    it('should post a new comment to a user profile', async () => {
      const [commenter] = await knexInstance('users').insert({
        firebase_uid: 'commenter_uid', email: 'commenter@example.com', username: 'Commenter',
      }).returning('*');

      const res = await request(app)
        .post(`/api/users/${testUser.firebase_uid}/comments`)
        .send({ firebaseUser: { uid: commenter.firebase_uid }, content: 'Great profile!' });

      expect(res.statusCode).to.equal(201);
      expect(res.body.content).to.equal('Great profile!');
      expect(res.body.fromUsername).to.equal('Commenter');

      const comments = await knexInstance('profile_comments').where({ to_user_id: testUser.id });
      expect(comments).to.have.lengthOf(1);
    });

    it('should return 403 if banned user tries to comment', async () => {
      const [bannedUser] = await knexInstance('users').insert({
        firebase_uid: 'banned_uid', email: 'banned@example.com', username: 'Banned', is_banned: true,
      }).returning('*');

      const res = await request(app)
        .post(`/api/users/${testUser.firebase_uid}/comments`)
        .send({ firebaseUser: { uid: bannedUser.firebase_uid }, content: 'I am banned.' });

      expect(res.statusCode).to.equal(403);
      expect(res.body.message).to.equal('Forbidden: Banned users cannot post comments.');
    });

    it('should return 404 if target user not found for comment', async () => {
      const [commenter] = await knexInstance('users').insert({
        firebase_uid: 'commenter_no_target_uid', email: 'commenter_no_target@example.com', username: 'CommenterNoTarget',
      }).returning('*');

      const res = await request(app)
        .post('/api/users/non_existent_target_uid/comments')
        .send({ firebaseUser: { uid: commenter.firebase_uid }, content: 'Comment for non-existent user.' });

      expect(res.statusCode).to.equal(404);
      expect(res.body.message).to.equal('User profile with UID non_existent_target_uid not found.');
    });
  });

  describe('DELETE /api/users/:firebase_uid/comments/:commentId', () => {
    let commentId: number;
    let commenterUser: UserProfile;

    beforeEach(async () => {
      [commenterUser] = await knexInstance('users').insert({
        firebase_uid: 'commenterToDelete_uid', email: 'del_commenter@example.com', username: 'CommenterToDelete',
      }).returning('*');
      const [comment] = await knexInstance('profile_comments').insert({
        to_user_id: testUser.id, from_user_id: commenterUser.id, content: 'Comment to delete',
      }).returning('*');
      commentId = comment.id;
    });

    it('should allow comment owner to delete their comment', async () => {
      const res = await request(app)
        .delete(`/api/users/${testUser.firebase_uid}/comments/${commentId}`)
        .send({ firebaseUser: { uid: commenterUser.firebase_uid } });

      expect(res.statusCode).to.equal(204);

      const comments = await knexInstance('profile_comments').where({ id: commentId });
      expect(comments).to.have.lengthOf(0);
    });

    it('should allow profile owner to delete comments on their profile', async () => {
      const res = await request(app)
        .delete(`/api/users/${testUser.firebase_uid}/comments/${commentId}`)
        .send({ firebaseUser: { uid: testUser.firebase_uid } });

      expect(res.statusCode).to.equal(204);
    });

    it('should return 403 if unauthorized user tries to delete comment', async () => {
      const [unauthorizedUser] = await knexInstance('users').insert({
        firebase_uid: 'unauthorizedDeleteUser_uid', email: 'unauth_del@example.com', username: 'UnauthorizedDeleteUser',
      }).returning('*');

      const res = await request(app)
        .delete(`/api/users/${testUser.firebase_uid}/comments/${commentId}`)
        .send({ firebaseUser: { uid: unauthorizedUser.firebase_uid } });

      expect(res.statusCode).to.equal(403);
      expect(res.body.message).to.equal('Forbidden: You do not have permission to delete this comment.');
    });
  });

  describe('POST /api/users/:firebase_uid/vouch', () => {
    it('should allow a qualified user to vouch for another user', async () => {
      const [voter] = await knexInstance('users').insert({
        firebase_uid: 'voterForVouch_uid', email: 'voter_vouch@example.com', username: 'VoterForVouch', postCount: 50,
      }).returning('*');

      const res = await request(app)
        .post(`/api/users/${testUser.firebase_uid}/vouch`)
        .send({ firebaseUser: { uid: voter.firebase_uid }, voter_firebase_uid: voter.firebase_uid });

      expect(res.statusCode).to.equal(200);
      expect(res.body.message).to.equal('Vouch successful!');

      const updatedUser = await knexInstance('users').where({ id: testUser.id }).first();
      expect(updatedUser.trustScore).to.equal(1);
      expect(updatedUser.vouchCount).to.equal(1);

      const vouchRecord = await knexInstance('user_vouches').where({
        voter_user_id: voter.id, vouched_user_id: testUser.id,
      }).first();
      expect(vouchRecord).to.exist;
    });

    it('should return 400 if user tries to vouch for themselves', async () => {
      const res = await request(app)
        .post(`/api/users/${testUser.firebase_uid}/vouch`)
        .send({ firebaseUser: { uid: testUser.firebase_uid }, voter_firebase_uid: testUser.firebase_uid });

      expect(res.statusCode).to.equal(400);
      expect(res.body.message).to.equal('Forbidden: You cannot vouch for yourself.');
    });

    it('should return 403 if voter has insufficient postCount', async () => {
      const [unqualifiedVoter] = await knexInstance('users').insert({
        firebase_uid: 'unqualifiedVoter_uid', email: 'unqualified@example.com', username: 'UnqualifiedVoter', postCount: 10,
      }).returning('*');

      const res = await request(app)
        .post(`/api/users/${testUser.firebase_uid}/vouch`)
        .send({ firebaseUser: { uid: unqualifiedVoter.firebase_uid }, voter_firebase_uid: unqualifiedVoter.firebase_uid });

      expect(res.statusCode).to.equal(403);
      expect(res.body.message).to.equal('Forbidden: You need at least 20 posts to vouch for others.');
    });

    it('should return 409 if user already vouched', async () => {
      const [voter] = await knexInstance('users').insert({
        firebase_uid: 'voterForVouch2_uid', email: 'voter_vouch_2@example.com', username: 'VoterForVouch2', postCount: 50,
      }).returning('*');

      await request(app)
        .post(`/api/users/${testUser.firebase_uid}/vouch`)
        .send({ firebaseUser: { uid: voter.firebase_uid }, voter_firebase_uid: voter.firebase_uid });

      const res = await request(app)
        .post(`/api/users/${testUser.firebase_uid}/vouch`)
        .send({ firebaseUser: { uid: voter.firebase_uid }, voter_firebase_uid: voter.firebase_uid });

      expect(res.statusCode).to.equal(409);
      expect(res.body.message).to.equal('Conflict: You have already vouched for this user.');
    });
  });

  describe('DELETE /api/users/:firebase_uid', () => {
    let adminUser: UserProfile;

    beforeEach(async () => {
      [adminUser] = await knexInstance('users').insert({
        firebase_uid: 'admin_delete_uid', email: 'admin_del@example.com', username: 'AdminDel', role: 'admin',
      }).returning('*');
    });

    it('should allow admin to delete a user', async () => {
      const res = await request(app)
        .delete(`/api/users/${testUser.firebase_uid}`)
        .send({ firebaseUser: { uid: adminUser.firebase_uid } }); // Mock firebaseUser

      expect(res.statusCode).to.equal(204);

      const deletedUser = await knexInstance('users').where({ id: testUser.id }).first();
      expect(deletedUser).to.be.undefined;
    });

    it('should return 403 if non-admin user tries to delete a user', async () => {
      const [normalUser] = await knexInstance('users').insert({
        firebase_uid: 'normal_del_uid', email: 'normal_del@example.com', username: 'NormalDel', role: 'user',
      }).returning('*');

      const res = await request(app)
        .delete(`/api/users/${testUser.firebase_uid}`)
        .send({ firebaseUser: { uid: normalUser.firebase_uid } }); // Mock firebaseUser

      expect(res.statusCode).to.equal(403);
      expect(res.body.message).to.equal('Forbidden: Only Root or Admin can delete users.');
    });

    it('should return 404 if user to delete not found', async () => {
      const res = await request(app)
        .delete('/api/users/non_existent_delete_uid')
        .send({ firebaseUser: { uid: adminUser.firebase_uid } }); // Mock firebaseUser

      expect(res.statusCode).to.equal(404);
      expect(res.body.message).to.equal('User with UID non_existent_delete_uid not found for deletion.');
    });
  });
});