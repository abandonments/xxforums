export async function up(knex) {
    await knex.schema.alterTable('users', (table) => {
        table.integer('trustScore').defaultTo(0).notNullable();
        table.integer('vouchCount').defaultTo(0).notNullable();
    });
}
export async function down(knex) {
    await knex.schema.alterTable('users', (table) => {
        table.dropColumn('trustScore');
        table.dropColumn('vouchCount');
    });
}
//# sourceMappingURL=20260222063800_add_trust_score_and_vouches_to_users.js.map