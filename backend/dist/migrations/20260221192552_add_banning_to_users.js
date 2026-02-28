export async function up(knex) {
    return knex.schema.table('users', function (table) {
        table.boolean('is_banned').defaultTo(false);
        table.timestamp('banned_until').nullable();
    });
}
export async function down(knex) {
    return knex.schema.table('users', function (table) {
        table.dropColumn('is_banned');
        table.dropColumn('banned_until');
    });
}
//# sourceMappingURL=20260221192552_add_banning_to_users.js.map