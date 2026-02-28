import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable('global_alerts', (table) => {
        table.increments('id').primary();
        table.text('message').notNullable();
        table.string('type').notNullable().defaultTo('info'); // e.g., 'info', 'warning', 'emergency'
        table.boolean('isActive').defaultTo(false);
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
}


export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists('global_alerts');
}