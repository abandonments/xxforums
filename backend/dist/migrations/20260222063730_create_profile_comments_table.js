export async function up(knex) {
    await knex.schema.createTable('profile_comments', (table) => {
        table.increments('id').primary();
        table.integer('to_user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
        table.integer('from_user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
        table.text('content').notNullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());
    });
}
export async function down(knex) {
    await knex.schema.dropTable('profile_comments');
}
//# sourceMappingURL=20260222063730_create_profile_comments_table.js.map