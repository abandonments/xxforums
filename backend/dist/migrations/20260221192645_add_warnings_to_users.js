export async function up(knex) {
    return knex.schema.table('users', function (table) {
        table.integer('warnings').defaultTo(0);
    });
}
export async function down(knex) {
    return knex.schema.table('users', function (table) {
        table.dropColumn('warnings');
    });
}
//# sourceMappingURL=20260221192645_add_warnings_to_users.js.map