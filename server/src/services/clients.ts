import {
  createClient as createClientRow,
  listClients as listClientRows,
} from '../data/clients.js';
import type { Client, CreateClientInput } from '../data/types.js';

/**
 * Client service. Thin for now (no business logic yet); it exists so routes never call
 * the data layer directly, per the routes -> services -> data boundary. This is the seam
 * where client-level business rules would live if added later.
 */

export async function listClients(): Promise<Client[]> {
  return listClientRows();
}

export async function createClient(input: CreateClientInput): Promise<Client> {
  return createClientRow(input);
}
