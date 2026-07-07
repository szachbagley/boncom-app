import knexFactory from 'knex';
import knexConfig from './knexfile.js';

/**
 * Shared runtime Knex instance (manages its own mysql2 connection pool). Reuses the
 * knexfile config so the app and the migrate/seed CLI resolve the connection identically.
 * Repositories import this single instance; do not create additional Knex/mysql2 pools.
 */
export const db = knexFactory(knexConfig);
