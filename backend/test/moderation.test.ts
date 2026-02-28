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

import { UserProfile } from '../src/types/user.js';

const knexInstance = knex(knexfile.development as any);

describe('Moderation API', () => {
  let moderatorUser: UserProfile, targetUser: UserProfile;
  const WARNING_THRESHOLD = 3;

  before(async () => {
    await knexInstance.migrate.latest();
  });

  beforeEach(async () => {
    // Clean up relevant tables before each test
    await knexInstance('user_warnings').del();
    await knexInstance('reputation_votes').del();
    await knexInstance('users').del();

    // Stub the authentication middleware
    sinon.stub(authMiddleware, 'authenticateFirebaseToken').callsFake(mockAuthenticateFirebaseToken as any);

    // Insert a target user
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

    // Insert a moderator user
    const [moderator] = await knexInstance('users').insert({
      firebase_uid: 'moderator_uid',
      email: 'moderator@example.com',
      username: 'ModeratorOne',
      reputation: 0,
      role: 'moderator', // Assign a moderator role
      warnings: 0,
      is_banned: false,
      banned_until: null,
    }).returning('*');
    moderatorUser = moderator;
  });

  after(async () => {
    sinon.restore(); // Restore all stubs after each test
    await knexInstance.migrate.rollback();
    await knexInstance.destroy();
  });


  describe('POST /api/moderation/warn', () => {
    it('should successfully warn a user and increment their warning count', async () => {
      const res = await request(app)
        .post('/api/moderation/warn')
        .send({
          target_user_firebase_uid: targetUser.firebase_uid,
          moderator_firebase_uid: moderatorUser.firebase_uid,
          reason: 'Test Warning 1',
        });

      expect(res.statusCode).to.equal(200);
      expect(res.body.message).to.equal('User warned successfully');

      const updatedTargetUser = await knexInstance('users').where('id', targetUser.id).first();
      expect(updatedTargetUser.warnings).to.equal(1);
      expect(updatedTargetUser.is_banned).to.be.false;

      const warningRecord = await knexInstance('user_warnings')
        .where({ warned_user_id: targetUser.id })
        .first();
      expect(warningRecord).to.exist;
      expect(warningRecord.reason).to.equal('Test Warning 1');
    });

    it('should ban a user after reaching the warning threshold', async () => {
      // Issue warnings up to (threshold - 1)
      for (let i = 0; i < WARNING_THRESHOLD - 1; i++) {
        await request(app)
          .post('/api/moderation/warn')
          .send({
            target_user_firebase_uid: targetUser.firebase_uid,
            moderator_firebase_uid: moderatorUser.firebase_uid,
            reason: `Pre-ban Warning ${i + 1}`,
          });
      }

      let updatedTargetUser = await knexInstance('users').where('id', targetUser.id).first();
      expect(updatedTargetUser.warnings).to.equal(WARNING_THRESHOLD - 1);
      expect(updatedTargetUser.is_banned).to.be.false;

      // Issue the final warning that should trigger a ban
      const res = await request(app)
        .post('/api/moderation/warn')
        .send({
          target_user_firebase_uid: targetUser.firebase_uid,
          moderator_firebase_uid: moderatorUser.firebase_uid,
          reason: 'Final Warning - Ban Trigger',
        });

      expect(res.statusCode).to.equal(200);
      expect(res.body.message).to.equal('User warned successfully');

      updatedTargetUser = await knexInstance('users').where('id', targetUser.id).first();
      expect(updatedTargetUser.warnings).to.equal(WARNING_THRESHOLD);
      expect(updatedTargetUser.is_banned).to.be.true;
      expect(updatedTargetUser.banned_until).to.not.be.null;
      // Ensure banned_until is in the future
      expect(new Date(updatedTargetUser.banned_until).getTime()).to.be.greaterThan(Date.now());
    });

    it('should return 400 for invalid input', async () => {
      const res = await request(app)
        .post('/api/moderation/warn')
        .send({
          target_user_firebase_uid: '', // Invalid
          moderator_firebase_uid: moderatorUser.firebase_uid,
          reason: '', // Invalid
        });

      expect(res.statusCode).to.equal(400);
      expect(res.body).to.have.property('errors');
      expect(res.body.errors.length).to.be.greaterThan(0);
    });

    it('should return 404 if target or moderator user not found', async () => {
      const res = await request(app)
        .post('/api/moderation/warn')
        .send({
          target_user_firebase_uid: 'non_existent_target', // Non-existent
          moderator_firebase_uid: moderatorUser.firebase_uid,
          reason: 'Some reason',
        });

      expect(res.statusCode).to.equal(404);
      expect(res.body.message).to.equal(`Target user with UID non_existent_target not found.`);
    });

    it('should return 403 if unauthorized user tries to warn', async () => {
      const [unauthorizedUser] = await knexInstance('users').insert({
        firebase_uid: 'unauthorized_uid',
        email: 'unauth@example.com',
        username: 'Unauthorized',
        role: 'user', // Not a moderator role
      }).returning('*');

      const res = await request(app)
        .post('/api/moderation/warn')
        .send({
          target_user_firebase_uid: targetUser.firebase_uid,
          moderator_firebase_uid: unauthorizedUser.firebase_uid,
          reason: 'Attempted unauthorized warn',
        });

      expect(res.statusCode).to.equal(403);
      expect(res.body.message).to.equal('Forbidden: Only designated moderators, admins, or root can issue warnings.');
    });

    it('should return 400 if a moderator tries to warn themselves', async () => {
        const res = await request(app)
            .post('/api/moderation/warn')
            .send({
                target_user_firebase_uid: moderatorUser.firebase_uid,
                moderator_firebase_uid: moderatorUser.firebase_uid,
                reason: 'Self-warning attempt',
            });
        
        expect(res.statusCode).to.equal(400);
        expect(res.body.message).to.equal('Forbidden: You cannot warn yourself.');
    });
  });
});