import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users', (table) => {
    table.index('role');
  });

  await knex.schema.alterTable('threads', (table) => {
    table.index('category_id');
    table.index('user_id');
    table.index('created_at');
  });

  await knex.schema.alterTable('posts', (table) => {
    table.index('thread_id');
    table.index('user_id');
    table.index('created_at');
  });

  await knex.schema.alterTable('profile_comments', (table) => {
    table.index('to_user_id');
    table.index('from_user_id');
    table.index('created_at');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users', (table) => {
    table.dropIndex('role');
  });

  await knex.schema.alterTable('threads', (table) => {
    table.dropIndex('category_id');
    table.dropIndex('user_id');
    table.dropIndex('created_at');
  });

  await knex.schema.alterTable('posts', (table) => {
    table.dropIndex('thread_id');
    table.dropIndex('user_id');
    table.dropIndex('created_at');
  });

  await knex.schema.alterTable('profile_comments', (table) => {
    table.dropIndex('to_user_id');
    table.dropIndex('from_user_id');
    table.dropIndex('created_at');
  });
}