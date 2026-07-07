import { useCallback, useEffect, useState } from 'react';
import { getClients } from '../api/clients.js';
import { getEstimate } from '../api/estimates.js';
import type { Client, EstimateDetail } from '../api/types.js';

/**
 * Fetches everything the form needs: clients always, and the estimate too when an id is
 * given (edit mode). Create mode (`id` undefined) never fetches an estimate.
 */
export type EstimateFormDataState =
  | { status: 'loading' }
  | { status: 'error'; error: unknown }
  | { status: 'success'; clients: Client[]; estimate?: EstimateDetail };

export interface UseEstimateFormDataResult {
  state: EstimateFormDataState;
  refetch: () => void;
}

export function useEstimateFormData(id?: number): UseEstimateFormDataResult {
  const [state, setState] = useState<EstimateFormDataState>({ status: 'loading' });
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });

    async function load(): Promise<void> {
      try {
        const [clients, estimate] = await Promise.all([
          getClients(),
          id === undefined ? Promise.resolve(undefined) : getEstimate(id),
        ]);
        if (cancelled) return;
        setState({ status: 'success', clients, estimate });
      } catch (error) {
        if (!cancelled) setState({ status: 'error', error });
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [id, reloadToken]);

  const refetch = useCallback(() => setReloadToken((token) => token + 1), []);
  return { state, refetch };
}
