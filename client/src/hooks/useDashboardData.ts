import { useCallback, useEffect, useState } from 'react';
import { getClients } from '../api/clients.js';
import { getEstimates } from '../api/estimates.js';
import type { Client, EstimateSummary } from '../api/types.js';

/**
 * Fetches everything the Dashboard needs (estimates + clients, in parallel) and exposes
 * the four-state shape components render from. Components never fetch directly — this
 * hook is the only thing that calls the api layer for the Dashboard.
 */
export type DashboardDataState =
  | { status: 'loading' }
  | { status: 'error'; error: unknown }
  | { status: 'success'; estimates: EstimateSummary[]; clients: Client[] };

export interface UseDashboardDataResult {
  state: DashboardDataState;
  refetch: () => void;
}

export function useDashboardData(): UseDashboardDataResult {
  const [state, setState] = useState<DashboardDataState>({ status: 'loading' });
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });

    async function load(): Promise<void> {
      try {
        const [estimates, clients] = await Promise.all([getEstimates(), getClients()]);
        if (!cancelled) {
          setState({ status: 'success', estimates, clients });
        }
      } catch (error) {
        if (!cancelled) {
          setState({ status: 'error', error });
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  const refetch = useCallback(() => {
    setReloadToken((token) => token + 1);
  }, []);

  return { state, refetch };
}
