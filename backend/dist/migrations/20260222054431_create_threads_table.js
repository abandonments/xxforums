export async function up(knex) {
    return knex.schema.createTable('threads', (table) => {
        table.increments('id').primary();
        table.integer('category_id').unsigned().notNullable().references('id').inTable('categories').onDelete('CASCADE');
        table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
        table.string('title').notNullable();
        table.text('content').notNullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
}
export async function down(knex) {
    return knex.schema.dropTable('threads');
}
//# sourceMappingURL=20260222054431_create_threads_table.js.map