import { useCallback, useEffect, useState } from 'react';
import { getClients } from '../api/clients.js';
import { getEstimate } from '../api/estimates.js';
import type { EstimateDetail } from '../api/types.js';

/**
 * Fetches the estimate + clients (to resolve the client name, since EstimateDetail only
 * carries clientId) in parallel, exposing the four-state shape the view renders from.
 */
export type EstimateDetailState =
  | { status: 'loading' }
  | { status: 'error'; error: unknown }
  | { status: 'success'; estimate: EstimateDetail; clientName: string };

export interface UseEstimateDetailResult {
  state: EstimateDetailState;
  refetch: () => void;
}

export function useEstimateDetail(id: number): UseEstimateDetailResult {
  const [state, setState] = useState<EstimateDetailState>({ status: 'loading' });
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });

    async function load(): Promise<void> {
      try {
        const [estimate, clients] = await Promise.all([getEstimate(id), getClients()]);
        if (cancelled) return;
        const client = clients.find((c) => c.id === estimate.clientId);
        setState({ status: 'success', estimate, clientName: client?.name ?? 'Unknown client' });
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
