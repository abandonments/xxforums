export async function up(knex) {
    return knex.schema.createTable('user_warnings', function (table) {
        table.increments('id').primary();
        table.integer('warned_user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
        table.integer('moderator_user_id').unsigned().notNullable().references('id').inTable('users').onDelete('SET NULL');
        table.text('reason').notNullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());
    });
}
export async function down(knex) {
    return knex.schema.dropTable('user_warnings');
}
//# sourceMappingURL=20260221192600_create_user_warnings_table.js.map