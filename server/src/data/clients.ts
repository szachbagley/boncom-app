import { db } from './db.js';
import { mapClientRow } from './mappers.js';
import type { Client, ClientRow, CreateClientInput, UpdateClientInput } from './types.js';

/**
 * Client repository: pure data access over the `clients` table. No HTTP, no business
 * logic. FK violations (e.g. deleting a client that still has estimates — ON DELETE
 * RESTRICT) are not caught here; they propagate for the service layer to translate.
 */

export async function createClient(input: CreateClientInput): Promise<Client> {
  const [id] = await db<ClientRow>('clients').insert({ name: input.name });
  if (id === undefined) {
    throw new Error('createClient: insert did not return an id');
  }
  const created = await getClientById(id);
  if (!created) {
    throw new Error('createClient: inserted row not found');
  }
  return created;
}

export async function getClientById(id: number): Promise<Client | null> {
  const row = await db<ClientRow>('clients').where({ id }).first();
  return row ? mapClientRow(row) : null;
}

export async function listClients(): Promise<Client[]> {
  const rows = await db<ClientRow>('clients').orderBy('name', 'asc');
  return rows.map(mapClientRow);
}

export async function updateClient(
  id: number,
  patch: UpdateClientInput,
): Promise<Client | null> {
  if (patch.name !== undefined) {
    await db<ClientRow>('clients').where({ id }).update({ name: patch.name });
  }
  return getClientById(id);
}

export async function deleteClient(id: number): Promise<boolean> {
  const affected = await db<ClientRow>('clients').where({ id }).del();
  return affected > 0;
}
