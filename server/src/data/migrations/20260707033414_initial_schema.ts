import type { Knex } from 'knex';

/**
 * Initial schema: clients, estimates, line_items.
 * Built to server/docs/DATA-MODEL.md. Money is BIGINT integer cents, tax rate is
 * INT basis points, quantity is DECIMAL(12,3) — no FLOAT/DOUBLE anywhere.
 *
 * Tables are created in FK-dependency order (clients → estimates → line_items).
 * For each FK column, the explicit index is declared BEFORE the foreign key so
 * InnoDB reuses it rather than creating a second, redundant index.
 */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('clients', (table) => {
    table.engine('InnoDB');
    table.increments('id'); // INT UNSIGNED AUTO_INCREMENT PK
    table.string('name').notNullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table
      .timestamp('updated_at')
      .notNullable()
      .defaultTo(knex.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'));
  });

  await knex.schema.createTable('estimates', (table) => {
    table.engine('InnoDB');
    table.increments('id');

    table.integer('client_id').unsigned().notNullable();
    table.index('client_id'); // declared before the FK so InnoDB reuses it
    table
      .foreign('client_id')
      .references('id')
      .inTable('clients')
      .onDelete('RESTRICT'); // can't delete a client while estimates exist

    table.enu('status', ['draft', 'sent']).notNullable().defaultTo('draft');
    table.integer('tax_rate_basis_points').notNullable().defaultTo(0);

    // Discount is optional. When present, discount_type disambiguates the unit
    // of discount_value: 'percentage' → basis points, 'fixed' → integer cents.
    // The "both null or both set" invariant is enforced in the app layer (Zod).
    table.enu('discount_type', ['percentage', 'fixed']).nullable();
    table.bigInteger('discount_value').nullable();

    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table
      .timestamp('updated_at')
      .notNullable()
      .defaultTo(knex.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'));
  });

  await knex.schema.createTable('line_items', (table) => {
    table.engine('InnoDB');
    table.increments('id');

    table.integer('estimate_id').unsigned().notNullable();
    table.index('estimate_id'); // declared before the FK so InnoDB reuses it
    table
      .foreign('estimate_id')
      .references('id')
      .inTable('estimates')
      .onDelete('CASCADE'); // deleting an estimate deletes its line items

    table.string('description').notNullable();
    table.decimal('quantity', 12, 3).notNullable(); // fractional but exact; not money
    table.bigInteger('rate_cents').notNullable(); // integer cents; never a float
  });
}

/** Drop in reverse dependency order. */
export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('line_items');
  await knex.schema.dropTableIfExists('estimates');
  await knex.schema.dropTableIfExists('clients');
}
