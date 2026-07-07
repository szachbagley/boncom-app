import type { Knex } from 'knex';

/**
 * Adds project_name to estimates so a client's multiple estimates are
 * distinguishable. NOT NULL DEFAULT '' so this ALTER TABLE is safe against
 * existing rows (they backfill to empty string). Non-empty enforcement is an
 * app-layer (Zod) concern, not a DB constraint — see server/docs/DATA-MODEL.md.
 */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('estimates', (table) => {
    table.string('project_name').notNullable().defaultTo('').after('client_id');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('estimates', (table) => {
    table.dropColumn('project_name');
  });
}
