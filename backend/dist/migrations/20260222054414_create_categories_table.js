export async function up(knex) {
    return knex.schema.createTable('categories', (table) => {
        table.increments('id').primary();
        table.string('name').notNullable().unique();
        table.string('description').nullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
}
export async function down(knex) {
    return knex.schema.dropTable('categories');
}
//# sourceMappingURL=20260222054414_create_categories_table.js.map