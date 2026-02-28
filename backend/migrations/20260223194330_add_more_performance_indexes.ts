import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    await knex.schema.alterTable('users', (table) => {
        table.index('username');
    });

    await knex.schema.alterTable('shoutbox_messages', (table) => {
        table.index('created_at');
    });

    await knex.schema.alterTable('reputation_votes', (table) => {
        table.index('voter_user_id');
        table.index('target_user_id');
        table.index('created_at');
    });
}


export async function down(knex: Knex): Promise<void> {
    await knex.schema.alterTable('users', (table) => {
        table.dropIndex('username');
    });

    await knex.schema.alterTable('shoutbox_messages', (table) => {
        table.dropIndex('created_at');
    });

    await knex.schema.alterTable('reputation_votes', (table) => {
        table.dropIndex('voter_user_id');
        table.dropIndex('target_user_id');
        table.dropIndex('created_at');
    });
}