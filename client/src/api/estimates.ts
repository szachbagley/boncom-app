import { request } from './http.js';
import type {
  CreateEstimateInput,
  EstimateDetail,
  EstimateListFilter,
  EstimateStatus,
  EstimateSummary,
  UpdateEstimateInput,
} from './types.js';

function buildQuery(filter?: EstimateListFilter): string {
  if (!filter) return '';
  const params = new URLSearchParams();
  if (filter.clientId !== undefined) params.set('clientId', String(filter.clientId));
  if (filter.status !== undefined) params.set('status', filter.status);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export async function getEstimates(filter?: EstimateListFilter): Promise<EstimateSummary[]> {
  return request<EstimateSummary[]>(`/api/estimates${buildQuery(filter)}`);
}

export async function getEstimate(id: number): Promise<EstimateDetail> {
  return request<EstimateDetail>(`/api/estimates/${id}`);
}

export async function createEstimate(input: CreateEstimateInput): Promise<EstimateDetail> {
  return request<EstimateDetail>('/api/estimates', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateEstimate(
  id: number,
  input: UpdateEstimateInput,
): Promise<EstimateDetail> {
  return request<EstimateDetail>(`/api/estimates/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export async function patchEstimateStatus(
  id: number,
  status: EstimateStatus,
): Promise<EstimateDetail> {
  return request<EstimateDetail>(`/api/estimates/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function deleteEstimate(id: number): Promise<void> {
  return request<void>(`/api/estimates/${id}`, { method: 'DELETE' });
}
