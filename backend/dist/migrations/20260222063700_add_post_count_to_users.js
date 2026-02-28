export async function up(knex) {
    await knex.schema.alterTable('users', (table) => {
        table.integer('postCount').defaultTo(0).notNullable();
    });
}
export async function down(knex) {
    await knex.schema.alterTable('users', (table) => {
        table.dropColumn('postCount');
    });
}
//# sourceMappingURL=20260222063700_add_post_count_to_users.js.map