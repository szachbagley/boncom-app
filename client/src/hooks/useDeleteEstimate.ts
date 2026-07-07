import { useCallback, useState } from 'react';
import { deleteEstimate as deleteEstimateRequest } from '../api/estimates.js';

/**
 * Wraps the delete-estimate api call with a pending flag. Errors propagate to the
 * caller (the view decides how to present them, e.g. keep a confirm dialog open with
 * an inline message) — this hook does not swallow them.
 */
export interface UseDeleteEstimateResult {
  deleteEstimate: (id: number) => Promise<void>;
  pending: boolean;
}

export function useDeleteEstimate(): UseDeleteEstimateResult {
  const [pending, setPending] = useState(false);

  const deleteEstimate = useCallback(async (id: number): Promise<void> => {
    setPending(true);
    try {
      await deleteEstimateRequest(id);
    } finally {
      setPending(false);
    }
  }, []);

  return { deleteEstimate, pending };
}
