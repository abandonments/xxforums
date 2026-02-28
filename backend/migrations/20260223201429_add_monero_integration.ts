import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    await knex.schema.alterTable('users', (table) => {
        table.string('monero_payment_address').nullable();
        table.string('monero_integrated_address').nullable();
    });

    await knex.schema.createTable('monero_payments', (table) => {
        table.increments('id').primary();
        table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
        table.bigInteger('amount').unsigned().notNullable(); // Store amount in atomic units (piconeros)
        table.string('tx_hash').notNullable().unique();
        table.string('status').notNullable().defaultTo('pending'); // e.g., pending, confirmed, failed
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
}


export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists('monero_payments');
    await knex.schema.alterTable('users', (table) => {
        table.dropColumn('monero_payment_address');
        table.dropColumn('monero_integrated_address');
    });
}