import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.table('users', function(table) {
    table.boolean('is_banned').defaultTo(false);
    table.timestamp('banned_until').nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.table('users', function(table) {
    table.dropColumn('is_banned');
    table.dropColumn('banned_until');
  });
}