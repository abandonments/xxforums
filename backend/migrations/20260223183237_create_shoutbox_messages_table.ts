import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable('shoutbox_messages', (table) => {
        table.increments('id').primary();
        table.string('user_id').notNullable().references('firebase_uid').inTable('users').onDelete('CASCADE');
        table.text('message').notNullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());
    });
}


export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTableIfExists('shoutbox_messages');
}

