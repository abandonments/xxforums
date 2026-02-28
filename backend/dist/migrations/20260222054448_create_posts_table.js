export async function up(knex) {
    return knex.schema.createTable('posts', (table) => {
        table.increments('id').primary();
        table.integer('thread_id').unsigned().notNullable().references('id').inTable('threads').onDelete('CASCADE');
        table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
        table.text('content').notNullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
}
export async function down(knex) {
    return knex.schema.dropTable('posts');
}
//# sourceMappingURL=20260222054448_create_posts_table.js.map