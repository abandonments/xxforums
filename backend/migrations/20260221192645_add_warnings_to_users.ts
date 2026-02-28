import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.table('users', function(table) {
    table.integer('warnings').defaultTo(0);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.table('users', function(table) {
    table.dropColumn('warnings');
  });
}