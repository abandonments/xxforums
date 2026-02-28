import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('reputation_votes', function(table) {
    table.increments('id').primary();
    table.integer('voter_user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.integer('target_user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('post_id').notNullable();
    table.enum('post_type', ['thread', 'reply']).notNullable();
    table.integer('delta').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.unique(['voter_user_id', 'post_id', 'post_type']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('reputation_votes');
}