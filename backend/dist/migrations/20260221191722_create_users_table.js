export async function up(knex) {
    return knex.schema.createTable('users', function (table) {
        table.increments('id').primary();
        table.string('firebase_uid').notNullable().unique();
        table.string('email').notNullable().unique();
        table.string('username').notNullable().unique();
        table.integer('reputation').defaultTo(0);
        table.string('role').defaultTo('user');
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
}
export async function down(knex) {
    return knex.schema.dropTable('users');
}
//# sourceMappingURL=20260221191722_create_users_table.js.map