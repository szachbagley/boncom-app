import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Pencil, Send, Trash2 } from 'lucide-react';
import { AppHeader } from '../components/AppHeader.js';
import { Badge } from '../components/Badge.js';
import { Button } from '../components/Button.js';
import { ConfirmDialog } from '../components/ConfirmDialog.js';
import { EstimateDetailError } from '../components/estimateDetail/EstimateDetailError.js';
import { EstimateDetailSkeleton } from '../components/estimateDetail/EstimateDetailSkeleton.js';
import { LineItemRow } from '../components/estimateDetail/LineItemRow.js';
import { TotalsBlock } from '../components/estimateDetail/TotalsBlock.js';
import { ApiError } from '../api/http.js';
import { useDeleteEstimate } from '../hooks/useDeleteEstimate.js';
import { useEstimateDetail } from '../hooks/useEstimateDetail.js';
import { useSendEstimate } from '../hooks/useSendEstimate.js';
import { pairLineItemsWithTotals } from '../utils/estimateDisplay.js';

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Unknown error';
}

export function EstimateDetailView() {
  const { id: idParam } = useParams();
  const id = Number(idParam);
  const navigate = useNavigate();

  const { state, refetch } = useEstimateDetail(id);
  const { deleteEstimate, pending: deletePending } = useDeleteEstimate();
  const { sendEstimate, pending: sendPending } = useSendEstimate();

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [sendOpen, setSendOpen] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  async function handleDelete(): Promise<void> {
    setDeleteError(null);
    try {
      await deleteEstimate(id);
      setDeleteOpen(false);
      navigate('/');
    } catch (error) {
      setDeleteError(errorMessage(error));
    }
  }

  async function handleSend(): Promise<void> {
    setSendError(null);
    try {
      await sendEstimate(id);
      setSendOpen(false);
      refetch();
    } catch (error) {
      setSendError(errorMessage(error));
    }
  }

  return (
    <div>
      <AppHeader backTo="/" />
      <main className="mx-auto max-w-[760px] px-[48px] py-[48px] pb-[80px]">
        {state.status === 'loading' && <EstimateDetailSkeleton />}

        {state.status === 'error' && (
          <EstimateDetailError message={errorMessage(state.error)} onRetry={refetch} />
        )}

        {state.status === 'success' && (
          <>
            <div className="flex items-start justify-between gap-6 border-b border-[var(--border-hairline)] pb-7">
              <div>
                <div className="mb-[10px] text-[14px] font-bold uppercase tracking-[2.3px] text-[var(--text-secondary)]">
                  {state.clientName}
                </div>
                <h1 className="m-0 text-[40px] font-light tracking-[-1.2px] text-navy">
                  {state.estimate.projectName}
                </h1>
              </div>
              <div className="pt-[6px]">
                <Badge status={state.estimate.status} />
              </div>
            </div>

            <div className="mt-10">
              <div className="mb-[6px] text-[12px] font-bold uppercase tracking-[3px] text-[var(--text-secondary)]">
                Line items
              </div>
              {pairLineItemsWithTotals(state.estimate).map((row, index, all) => (
                <LineItemRow
                  key={row.id}
                  description={row.description}
                  totalCents={row.totalCents}
                  last={index === all.length - 1}
                />
              ))}
            </div>

            <div className="ml-auto mt-10 max-w-[380px]">
              <TotalsBlock
                totals={state.estimate.totals}
                discount={state.estimate.discount}
                taxRateBasisPoints={state.estimate.taxRateBasisPoints}
              />
            </div>

            <div className="mt-12 flex items-center gap-3 border-t border-[var(--border-hairline)] pt-7">
              {state.estimate.status === 'draft' && (
                <>
                  <Button
                    variant="primary"
                    iconLeft={<Pencil size={15} className="text-white" />}
                    onClick={() => navigate(`/estimates/${id}/edit`)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="accent"
                    iconLeft={<Send size={15} className="text-navy" />}
                    onClick={() => setSendOpen(true)}
                  >
                    Send estimate
                  </Button>
                  <div className="flex-1" />
                </>
              )}
              <Button
                variant="danger"
                iconLeft={<Trash2 size={15} className="text-[var(--color-danger)]" />}
                onClick={() => setDeleteOpen(true)}
              >
                Delete estimate
              </Button>
            </div>
          </>
        )}
      </main>

      <ConfirmDialog
        open={sendOpen}
        onOpenChange={(open) => {
          setSendOpen(open);
          if (!open) setSendError(null);
        }}
        title="Send estimate"
        description="Sending marks this estimate Sent and it can no longer be edited. This cannot be undone."
        confirmLabel="Send"
        pending={sendPending}
        error={sendError}
        onConfirm={handleSend}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={(open) => {
          setDeleteOpen(open);
          if (!open) setDeleteError(null);
        }}
        title="Delete estimate"
        description={
          state.status === 'success'
            ? `Delete "${state.estimate.projectName}"? This cannot be undone.`
            : 'This cannot be undone.'
        }
        confirmLabel="Delete"
        danger
        pending={deletePending}
        error={deleteError}
        onConfirm={handleDelete}
      />
    </div>
  );
}
