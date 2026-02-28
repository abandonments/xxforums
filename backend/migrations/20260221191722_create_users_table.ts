import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('users', function(table) {
    table.increments('id').primary();
    table.string('firebase_uid').notNullable().unique();
    table.string('email').notNullable().unique();
    table.string('username').notNullable().unique();
    table.integer('reputation').defaultTo(0);
    table.string('role').defaultTo('user');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('users');
}