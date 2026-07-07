import { useCallback, useState } from 'react';
import { patchEstimateStatus } from '../api/estimates.js';

/** Wraps the status-patch call for the Send action; mirrors useDeleteEstimate's shape. */
export interface UseSendEstimateResult {
  sendEstimate: (id: number) => Promise<void>;
  pending: boolean;
}

export function useSendEstimate(): UseSendEstimateResult {
  const [pending, setPending] = useState(false);

  const sendEstimate = useCallback(async (id: number): Promise<void> => {
    setPending(true);
    try {
      await patchEstimateStatus(id, 'sent');
    } finally {
      setPending(false);
    }
  }, []);

  return { sendEstimate, pending };
}
