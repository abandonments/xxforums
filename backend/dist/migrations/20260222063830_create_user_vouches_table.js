export async function up(knex) {
    await knex.schema.createTable('user_vouches', (table) => {
        table.increments('id').primary();
        table.integer('voter_user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
        table.integer('vouched_user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
        table.unique(['voter_user_id', 'vouched_user_id']); // Ensure one vouch per user pair
        table.timestamp('created_at').defaultTo(knex.fn.now());
    });
}
export async function down(knex) {
    await knex.schema.dropTable('user_vouches');
}
//# sourceMappingURL=20260222063830_create_user_vouches_table.js.map