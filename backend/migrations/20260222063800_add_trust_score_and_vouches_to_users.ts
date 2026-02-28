import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users', (table) => {
    table.integer('trustScore').defaultTo(0).notNullable();
    table.integer('vouchCount').defaultTo(0).notNullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('trustScore');
    table.dropColumn('vouchCount');
  });
}