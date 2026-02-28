import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable('escrows', (table) => {
        table.increments('id').primary();
        table.string('name').notNullable().unique();
        table.string('address').notNullable().unique();
        table.integer('buyer_id').unsigned().notNullable();
        table.foreign('buyer_id').references('id').inTable('users');
        table.integer('seller_id').unsigned().notNullable();
        table.foreign('seller_id').references('id').inTable('users');
        table.integer('post_id').unsigned().notNullable();
        table.foreign('post_id').references('id').inTable('posts');
        table.string('status').notNullable().defaultTo('funded');
        table.timestamps(true, true);
    });
}


export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTable('escrows');
}

