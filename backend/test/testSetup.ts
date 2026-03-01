import knex from 'knex';
import knexConfig from '../knexfile.js';
import { UserRole } from '../src/types/user.js';
import { Request, Response, NextFunction } from 'express';

const db = knex(knexConfig.development);

before(async () => {
  console.log('Running global test setup...');
  try {
    await db.migrate.latest();
    console.log('Migrations complete.');

    await db('users').del();
    console.log('Cleared users table.');

    // Create a target user
    await db('users').insert({
      firebase_uid: 'test_user_uid',
      email: 'testuser@example.com',
      username: 'TestUser',
      role: UserRole.User,
    });
    console.log('Test User created.');

    // Create a moderator user
    await db('users').insert({
      firebase_uid: 'moderator_uid',
      email: 'moderator@example.com',
      username: 'Moderator',
      role: UserRole.Mod,
    });
    console.log('Moderator User created.');

    // Create an admin user
    await db('users').insert({
        firebase_uid: 'admin_uid',
        email: 'admin@example.com',
        username: 'Admin',
        role: UserRole.Admin,
    });
    console.log('Admin User created.');


  } catch (error) {
    console.error('Error during test setup:', error);
    process.exit(1);
  }
  console.log('Global test setup complete.');
});

after(async () => {
  console.log('Running global test teardown...');
  try {
    await db.destroy();
    console.log('Database connection closed.');
  } catch (error) {
    console.error('Error during test teardown:', error);
  }
  console.log('Global test teardown complete.');
});

export const mockAuthenticateFirebaseToken = (req: Request, res: Response, next: NextFunction) => {
    req.userId = 'test_user_uid';
    next();
};
