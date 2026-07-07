import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { AppHeader } from '../components/AppHeader.js';
import { Button } from '../components/Button.js';
import { ConfirmDialog } from '../components/ConfirmDialog.js';
import { ClientGroup } from '../components/dashboard/ClientGroup.js';
import { DashboardEmpty } from '../components/dashboard/DashboardEmpty.js';
import { DashboardError } from '../components/dashboard/DashboardError.js';
import { DashboardSkeleton } from '../components/dashboard/DashboardSkeleton.js';
import { FilterControl } from '../components/dashboard/FilterControl.js';
import { SortControl } from '../components/dashboard/SortControl.js';
import { ApiError } from '../api/http.js';
import { useDashboardData } from '../hooks/useDashboardData.js';
import { useDeleteEstimate } from '../hooks/useDeleteEstimate.js';
import { buildDashboardGroups, type DashboardSort } from '../utils/dashboardGrouping.js';
import type { EstimateStatus, EstimateSummary } from '../api/types.js';

const ALL_STATUSES: ReadonlySet<EstimateStatus> = new Set(['draft', 'sent']);

const SORT_LABEL: Record<DashboardSort, string> = {
  updated: 'date updated',
  created: 'date created',
  status: 'status',
  alpha: 'alphabetical',
};

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Unknown error';
}

export function DashboardView() {
  const navigate = useNavigate();
  const { state, refetch } = useDashboardData();
  const { deleteEstimate, pending: deletePending } = useDeleteEstimate();

  const [sort, setSort] = useState<DashboardSort>('updated');
  const [statuses, setStatuses] = useState<ReadonlySet<EstimateStatus>>(ALL_STATUSES);
  const [clientIds, setClientIds] = useState<ReadonlySet<number>>(new Set());
  const [pendingDelete, setPendingDelete] = useState<EstimateSummary | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function toggleStatus(status: EstimateStatus): void {
    setStatuses((prev) => {
      const next = new Set(prev);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next;
    });
  }

  function toggleClient(clientId: number): void {
    setClientIds((prev) => {
      const next = new Set(prev);
      if (next.has(clientId)) next.delete(clientId);
      else next.add(clientId);
      return next;
    });
  }

  const groups = useMemo(() => {
    if (state.status !== 'success') return [];
    return buildDashboardGroups(state.estimates, state.clients, { sort, statuses, clientIds });
  }, [state, sort, statuses, clientIds]);

  const isFiltered = statuses.size !== ALL_STATUSES.size || clientIds.size > 0;

  async function handleConfirmDelete(): Promise<void> {
    if (!pendingDelete) return;
    setDeleteError(null);
    try {
      await deleteEstimate(pendingDelete.id);
      setPendingDelete(null);
      refetch();
    } catch (error) {
      setDeleteError(errorMessage(error));
    }
  }

  const actions = (
    <>
      <Button
        variant="primary"
        iconLeft={<Plus size={16} className="text-white" />}
        onClick={() => navigate('/estimates/new')}
      >
        Add estimate
      </Button>
      <SortControl value={sort} onChange={setSort} />
      <FilterControl
        statuses={statuses}
        onToggleStatus={toggleStatus}
        clients={state.status === 'success' ? state.clients : []}
        selectedClientIds={clientIds}
        onToggleClient={toggleClient}
      />
    </>
  );

  return (
    <div>
      <AppHeader actions={actions} />
      <main className="mx-auto max-w-[1200px] px-[48px] py-[40px] pb-[80px]">
        <div className="mb-[34px] flex items-baseline gap-[14px]">
          <div className="text-[12px] font-bold uppercase tracking-[3px] text-[var(--text-secondary)]">
            Estimates
          </div>
          {state.status === 'loading' && (
            <div className="h-[12px] w-[120px] animate-pulse bg-neutral-100" />
          )}
          {state.status === 'success' && (
            <div className="text-[13px] text-[var(--color-mute)]">
              Sorted by {SORT_LABEL[sort]}
              {isFiltered ? ' · filtered' : ''}
            </div>
          )}
        </div>

        {state.status === 'loading' && <DashboardSkeleton />}

        {state.status === 'error' && (
          <DashboardError message={errorMessage(state.error)} onRetry={refetch} />
        )}

        {state.status === 'success' &&
          (groups.length === 0 ? (
            <DashboardEmpty
              variant={state.estimates.length === 0 ? 'no-estimates' : 'no-matches'}
              onAddEstimate={() => navigate('/estimates/new')}
            />
          ) : (
            groups.map((group) => (
              <ClientGroup key={group.clientId} group={group} onDeleteEstimate={setPendingDelete} />
            ))
          ))}
      </main>

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPendingDelete(null);
            setDeleteError(null);
          }
        }}
        title="Delete estimate"
        description={
          pendingDelete ? `Delete "${pendingDelete.projectName}"? This cannot be undone.` : ''
        }
        confirmLabel="Delete"
        danger
        pending={deletePending}
        error={deleteError}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
