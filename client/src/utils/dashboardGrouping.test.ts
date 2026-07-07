import { describe, it, expect } from 'vitest';
import type { Client, EstimateSummary } from '../api/types';
import { buildDashboardGroups, type DashboardFilters } from './dashboardGrouping.js';

const clients: Client[] = [
  { id: 1, name: 'Northwind Studios', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 2, name: 'Cascade Public Health', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 3, name: 'Meridian Museum', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
];

function est(overrides: Partial<EstimateSummary> & Pick<EstimateSummary, 'id' | 'clientId' | 'projectName'>): EstimateSummary {
  return {
    status: 'draft',
    taxRateBasisPoints: 0,
    createdAt: '2026-06-01T00:00:00.000Z',
    updatedAt: '2026-06-01T00:00:00.000Z',
    ...overrides,
  };
}

// Northwind Studios (client 1)
const e1 = est({ id: 1, clientId: 1, projectName: 'Spring Brand Refresh', status: 'draft', createdAt: '2026-06-30T00:00:00.000Z', updatedAt: '2026-07-07T00:00:00.000Z' });
const e2 = est({ id: 2, clientId: 1, projectName: 'Q3 Product Launch Video', status: 'sent', createdAt: '2026-06-18T00:00:00.000Z', updatedAt: '2026-07-05T00:00:00.000Z' });
const e3 = est({ id: 3, clientId: 1, projectName: 'Holiday Campaign (Print)', status: 'draft', createdAt: '2026-07-02T00:00:00.000Z', updatedAt: '2026-07-02T00:00:00.000Z' });

// Cascade Public Health (client 2)
const e4 = est({ id: 4, clientId: 2, projectName: 'Wellness Awareness Billboards', status: 'draft', createdAt: '2026-06-22T00:00:00.000Z', updatedAt: '2026-07-06T00:00:00.000Z' });
const e5 = est({ id: 5, clientId: 2, projectName: 'Landing Page Design', status: 'sent', createdAt: '2026-06-10T00:00:00.000Z', updatedAt: '2026-06-28T00:00:00.000Z' });

const allEstimates = [e1, e2, e3, e4, e5];

function filters(overrides: Partial<DashboardFilters> = {}): DashboardFilters {
  return {
    sort: 'updated',
    statuses: new Set(['draft', 'sent']),
    clientIds: new Set(),
    ...overrides,
  };
}

describe('buildDashboardGroups', () => {
  it('groups estimates by client and hides clients with zero estimates', () => {
    const groups = buildDashboardGroups(allEstimates, clients, filters());
    expect(groups).toHaveLength(2); // Meridian Museum (client 3) has none — not shown
    expect(groups.map((g) => g.clientId).sort()).toEqual([1, 2]);
  });

  it('returns an empty array for no estimates', () => {
    expect(buildDashboardGroups([], clients, filters())).toEqual([]);
  });

  it('returns an empty array when no client matches (estimates reference an unknown client)', () => {
    const orphan = est({ id: 99, clientId: 999, projectName: 'Orphaned' });
    expect(buildDashboardGroups([orphan], clients, filters())).toEqual([]);
  });

  it('returns an empty array when the clients list is empty', () => {
    expect(buildDashboardGroups(allEstimates, [], filters())).toEqual([]);
  });

  describe('within-group sort', () => {
    it('sorts by date updated, descending (default)', () => {
      const groups = buildDashboardGroups(allEstimates, clients, filters({ sort: 'updated' }));
      const northwind = groups.find((g) => g.clientId === 1)!;
      expect(northwind.estimates.map((e) => e.id)).toEqual([1, 2, 3]); // e1(07-07), e2(07-05), e3(07-02)
    });

    it('sorts by date created, descending', () => {
      const groups = buildDashboardGroups(allEstimates, clients, filters({ sort: 'created' }));
      const northwind = groups.find((g) => g.clientId === 1)!;
      expect(northwind.estimates.map((e) => e.id)).toEqual([3, 1, 2]); // e3(07-02), e1(06-30), e2(06-18)
    });

    it('sorts by status, drafts before sent', () => {
      const groups = buildDashboardGroups(allEstimates, clients, filters({ sort: 'status' }));
      const northwind = groups.find((g) => g.clientId === 1)!;
      expect(northwind.estimates.map((e) => e.id)).toEqual([1, 3, 2]); // drafts e1,e3 then sent e2
    });

    it('sorts alphabetically by project name', () => {
      const groups = buildDashboardGroups(allEstimates, clients, filters({ sort: 'alpha' }));
      const northwind = groups.find((g) => g.clientId === 1)!;
      // Holiday Campaign < Q3 Product Launch < Spring Brand Refresh
      expect(northwind.estimates.map((e) => e.id)).toEqual([3, 2, 1]);
    });
  });

  describe('group order', () => {
    it('orders groups alphabetically by client name for the alpha sort', () => {
      const groups = buildDashboardGroups(allEstimates, clients, filters({ sort: 'alpha' }));
      expect(groups.map((g) => g.clientName)).toEqual(['Cascade Public Health', 'Northwind Studios']);
    });

    it('orders groups by most recent updatedAt, descending, for the updated sort', () => {
      const groups = buildDashboardGroups(allEstimates, clients, filters({ sort: 'updated' }));
      // Northwind's most recent update is 07-07; Cascade's is 07-06
      expect(groups.map((g) => g.clientId)).toEqual([1, 2]);
    });

    it('orders groups by most recent createdAt, descending, for the created sort', () => {
      const groups = buildDashboardGroups(allEstimates, clients, filters({ sort: 'created' }));
      // Northwind's most recent creation is 07-02; Cascade's is 06-22
      expect(groups.map((g) => g.clientId)).toEqual([1, 2]);
    });

    it('orders groups by most recent updatedAt (not status) for the status sort', () => {
      const groups = buildDashboardGroups(allEstimates, clients, filters({ sort: 'status' }));
      expect(groups.map((g) => g.clientId)).toEqual([1, 2]);
    });
  });

  describe('status filter', () => {
    it('shows only estimates whose status is in the set', () => {
      const groups = buildDashboardGroups(allEstimates, clients, filters({ statuses: new Set(['draft']) }));
      const northwind = groups.find((g) => g.clientId === 1)!;
      expect(northwind.estimates.map((e) => e.id).sort()).toEqual([1, 3]); // e2 (sent) excluded
      const cascade = groups.find((g) => g.clientId === 2)!;
      expect(cascade.estimates.map((e) => e.id)).toEqual([4]); // e5 (sent) excluded
    });

    it('shows nothing when the status set is empty (empty means none, not all)', () => {
      const groups = buildDashboardGroups(allEstimates, clients, filters({ statuses: new Set() }));
      expect(groups).toEqual([]);
    });
  });

  describe('client filter', () => {
    it('shows only the selected clients when the set is non-empty', () => {
      const groups = buildDashboardGroups(allEstimates, clients, filters({ clientIds: new Set([1]) }));
      expect(groups.map((g) => g.clientId)).toEqual([1]);
    });

    it('shows all clients when the set is empty', () => {
      const groups = buildDashboardGroups(allEstimates, clients, filters({ clientIds: new Set() }));
      expect(groups.map((g) => g.clientId).sort()).toEqual([1, 2]);
    });
  });
});
