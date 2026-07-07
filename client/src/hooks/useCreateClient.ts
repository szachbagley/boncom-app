import { useCallback, useState } from 'react';
import { createClient as createClientRequest } from '../api/clients.js';
import type { Client } from '../api/types.js';

export interface UseCreateClientResult {
  createClient: (name: string) => Promise<Client>;
  pending: boolean;
}

/** Wraps client creation for the Add New Client dialog; mirrors useDeleteEstimate's shape. */
export function useCreateClient(): UseCreateClientResult {
  const [pending, setPending] = useState(false);

  const createClient = useCallback(async (name: string): Promise<Client> => {
    setPending(true);
    try {
      return await createClientRequest({ name });
    } finally {
      setPending(false);
    }
  }, []);

  return { createClient, pending };
}
