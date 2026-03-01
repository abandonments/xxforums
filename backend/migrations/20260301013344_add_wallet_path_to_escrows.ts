import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    await knex.schema.alterTable('escrows', (table) => {
        table.string('wallet_path').notNullable();
        table.string('wallet_password').notNullable();
    });
}


export async function down(knex: Knex): Promise<void> {
    await knex.schema.alterTable('escrows', (table) => {
        table.dropColumn('wallet_path');
        table.dropColumn('wallet_password');
    });
}
