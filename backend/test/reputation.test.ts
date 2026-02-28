import * as chai from 'chai';
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

export type UserProfile = {
    id: number;
    firebase_uid: string;
    email: string;
    username: string;
    reputation: number;
    role: string;
    warnings: number;
    is_banned: boolean;
    banned_until: Date | null;
    avatarUrl?: string;
    bannerUrl?: string;
    bio?: string;
    signature?: string;
    musicUrl?: string;
    musicAutoplay?: boolean;
    customCss?: string;
    postCount?: number;
    profileViews?: number;
    trustScore?: number;
    vouchCount?: number;
    inventory?: string[];
    createdAt?: Date;
    updatedAt?: Date;
}

const knexInstance = knex(knexfile.development as any);

describe('Reputation API', () => {
  let voterUser: UserProfile, targetUser: UserProfile;

  before(async () => {
    await knexInstance.migrate.latest();
  });

  beforeEach(async () => {
    // Clean up all tables before each test
    await knexInstance('user_warnings').del();
    await knexInstance('reputation_votes').del();
    await knexInstance('users').del();

    // Stub the authentication middleware
    sinon.stub(authMiddleware, 'authenticateFirebaseToken').callsFake(mockAuthenticateFirebaseToken as any);

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
    sinon.restore(); // Restore all stubs after each test
    await knexInstance.migrate.rollback();
    await knexInstance.destroy();
  });

  describe('POST /api/reputation/vote', () => {
    it('should successfully give reputation to a user', async () => {
      const res = await request(app)
        .post('/api/reputation/vote')
        .send({
          voter_firebase_uid: voterUser.firebase_uid,
          target_user_firebase_uid: targetUser.firebase_uid,
          postId: 'post123',
          postType: 'thread',
          delta: 1,
        });

      expect(res.statusCode).to.equal(200);
      expect(res.body.message).to.equal('Reputation updated successfully');

      const updatedTargetUser = await knexInstance('users').where('id', targetUser.id).first();
      expect(updatedTargetUser.reputation).to.equal(1);

      const voteRecord = await knexInstance('reputation_votes')
        .where({
          voter_user_id: voterUser.id,
          post_id: 'post123',
          post_type: 'thread',
        })
        .first();
      expect(voteRecord).to.exist;
    });

    it('should prevent a user from voting on the same post twice', async () => {
      await request(app)
        .post('/api/reputation/vote')
        .send({
          voter_firebase_uid: voterUser.firebase_uid,
          target_user_firebase_uid: targetUser.firebase_uid,
          postId: 'post123',
          postType: 'thread',
          delta: 1,
        });

      const res = await request(app)
        .post('/api/reputation/vote')
        .send({
          voter_firebase_uid: voterUser.firebase_uid,
          target_user_firebase_uid: targetUser.firebase_uid,
          postId: 'post123',
          postType: 'thread',
          delta: 1,
        });

      expect(res.statusCode).to.equal(409);
      expect(res.body.message).to.equal('Conflict: User has already voted on this post.');

      const updatedTargetUser = await knexInstance('users').where('id', targetUser.id).first();
      expect(updatedTargetUser.reputation).to.equal(1);
    });

    it('should return 400 for invalid input', async () => {
      const res = await request(app)
        .post('/api/reputation/vote')
        .send({
          voter_firebase_uid: voterUser.firebase_uid,
          target_user_firebase_uid: targetUser.firebase_uid,
          postId: '',
          postType: 'invalid',
          delta: 2,
        });

      expect(res.statusCode).to.equal(400);
      expect(res.body).to.have.property('errors');
      expect(res.body.errors.length).to.be.greaterThan(0);
    });

    it('should return 404 if voter or target user not found', async () => {
      const res = await request(app)
        .post('/api/reputation/vote')
        .send({
          voter_firebase_uid: 'non_existent_voter',
          target_user_firebase_uid: targetUser.firebase_uid,
          postId: 'post123',
          postType: 'thread',
          delta: 1,
        });

      expect(res.statusCode).to.equal(404);
      expect(res.body.message).to.equal(`Voter user with UID non_existent_voter not found.`);
    });
  });
});
