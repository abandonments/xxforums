import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('user_vouches', (table) => {
    table.increments('id').primary();
    table.integer('voter_user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.integer('vouched_user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.unique(['voter_user_id', 'vouched_user_id']); // Ensure one vouch per user pair
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('user_vouches');
}