export async function up(knex) {
    return knex.schema.createTable('reputation_votes', function (table) {
        table.increments('id').primary();
        table.integer('voter_user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
        table.integer('target_user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
        table.string('post_id').notNullable();
        table.enum('post_type', ['thread', 'reply']).notNullable();
        table.integer('delta').notNullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.unique(['voter_user_id', 'post_id', 'post_type']);
    });
}
export async function down(knex) {
    return knex.schema.dropTable('reputation_votes');
}
//# sourceMappingURL=20260221192505_create_reputation_votes_table.js.map