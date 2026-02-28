import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('user_warnings', function(table) {
    table.increments('id').primary();
    table.integer('warned_user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.integer('moderator_user_id').unsigned().notNullable().references('id').inTable('users').onDelete('SET NULL');
    table.text('reason').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('user_warnings');
}