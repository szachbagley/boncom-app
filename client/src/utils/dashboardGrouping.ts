import type { Client, EstimateStatus, EstimateSummary } from '../api/types';

/**
 * Pure grouping/sort/filter logic for the Dashboard. Ported from the Claude Design
 * bundle's Dashboard.html reference implementation (sortEstimates/groupRecency), made
 * total and typed. No I/O; same inputs always produce the same outputs.
 */

export type DashboardSort = 'updated' | 'created' | 'status' | 'alpha';

export interface DashboardFilters {
  sort: DashboardSort;
  /** Only estimates with a status in this set are shown. Empty set shows nothing. */
  statuses: ReadonlySet<EstimateStatus>;
  /** Only clients with an id in this set are shown. Empty set means "all clients". */
  clientIds: ReadonlySet<number>;
}

export interface DashboardGroup {
  clientId: number;
  clientName: string;
  estimates: EstimateSummary[];
}

function sortWithinGroup(estimates: EstimateSummary[], sort: DashboardSort): EstimateSummary[] {
  const sorted = [...estimates];
  switch (sort) {
    case 'updated':
      sorted.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      break;
    case 'created':
      sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      break;
    case 'status':
      sorted.sort((a, b) => {
        if (a.status === b.status) return 0;
        return a.status === 'draft' ? -1 : 1;
      });
      break;
    case 'alpha':
      sorted.sort((a, b) => a.projectName.localeCompare(b.projectName));
      break;
  }
  return sorted;
}

/** Most recent date (ISO string) among a group's estimates, for group ordering. */
function groupRecency(estimates: EstimateSummary[], sort: DashboardSort): string {
  if (estimates.length === 0) return '';
  const key = sort === 'created' ? 'createdAt' : 'updatedAt';
  return estimates.reduce((max, e) => (e[key] > max ? e[key] : max), estimates[0]![key]);
}

/**
 * Groups estimates by client (joining clientId -> client name), filters by status and
 * client, sorts within each group per `filters.sort`, drops clients left with zero
 * estimates, and orders the groups themselves (alphabetically by client name for the
 * 'alpha' sort, otherwise by each group's most recent date, descending).
 */
export function buildDashboardGroups(
  estimates: EstimateSummary[],
  clients: Client[],
  filters: DashboardFilters,
): DashboardGroup[] {
  const clientsById = new Map(clients.map((c) => [c.id, c]));

  const byClient = new Map<number, EstimateSummary[]>();
  for (const estimate of estimates) {
    if (!filters.statuses.has(estimate.status)) continue;
    if (!clientsById.has(estimate.clientId)) continue; // unknown client — skip defensively
    if (filters.clientIds.size > 0 && !filters.clientIds.has(estimate.clientId)) continue;

    const existing = byClient.get(estimate.clientId);
    if (existing) {
      existing.push(estimate);
    } else {
      byClient.set(estimate.clientId, [estimate]);
    }
  }

  const groups: DashboardGroup[] = [];
  for (const [clientId, clientEstimates] of byClient) {
    if (clientEstimates.length === 0) continue;
    const client = clientsById.get(clientId)!;
    groups.push({
      clientId,
      clientName: client.name,
      estimates: sortWithinGroup(clientEstimates, filters.sort),
    });
  }

  if (filters.sort === 'alpha') {
    groups.sort((a, b) => a.clientName.localeCompare(b.clientName));
  } else {
    groups.sort((a, b) =>
      groupRecency(b.estimates, filters.sort).localeCompare(groupRecency(a.estimates, filters.sort)),
    );
  }

  return groups;
}
