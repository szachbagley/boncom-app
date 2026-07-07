import { useCallback, useState } from 'react';
import { createEstimate, updateEstimate } from '../api/estimates.js';
import type { Discount, EstimateDetail, LineItemInput } from '../api/types.js';

export interface SaveEstimatePayload {
  clientId: number;
  projectName: string;
  taxRateBasisPoints: number;
  discount?: Discount;
  lineItems: LineItemInput[];
}

export interface UseSaveEstimateResult {
  /** Creates (POST) when `id` is omitted, or fully replaces (PUT) when `id` is given.
   *  The form only ever saves drafts — sending is the detail view's job. */
  save: (id: number | undefined, payload: SaveEstimatePayload) => Promise<EstimateDetail>;
  pending: boolean;
}

export function useSaveEstimate(): UseSaveEstimateResult {
  const [pending, setPending] = useState(false);

  const save = useCallback(
    async (id: number | undefined, payload: SaveEstimatePayload): Promise<EstimateDetail> => {
      setPending(true);
      try {
        if (id === undefined) {
          return await createEstimate({
            clientId: payload.clientId,
            projectName: payload.projectName,
            taxRateBasisPoints: payload.taxRateBasisPoints,
            discount: payload.discount,
            lineItems: payload.lineItems,
          });
        }
        return await updateEstimate(id, {
          projectName: payload.projectName,
          status: 'draft',
          taxRateBasisPoints: payload.taxRateBasisPoints,
          discount: payload.discount,
          lineItems: payload.lineItems,
        });
      } finally {
        setPending(false);
      }
    },
    [],
  );

  return { save, pending };
}
