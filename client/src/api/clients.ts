import { request } from './http.js';
import type { Client, CreateClientInput } from './types.js';

export async function getClients(): Promise<Client[]> {
  return request<Client[]>('/api/clients');
}

export async function createClient(input: CreateClientInput): Promise<Client> {
  return request<Client>('/api/clients', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
