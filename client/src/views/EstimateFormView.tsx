import { useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import { AppHeader } from '../components/AppHeader.js';
import { Button } from '../components/Button.js';
import { ConfirmDialog } from '../components/ConfirmDialog.js';
import { AddClientDialog } from '../components/AddClientDialog.js';
import { ClientSelect } from '../components/estimateForm/ClientSelect.js';
import { TextField } from '../components/estimateForm/TextField.js';
import { DiscountField } from '../components/estimateForm/DiscountField.js';
import { AdornedInput } from '../components/estimateForm/AdornedInput.js';
import { LineItemEditorRow } from '../components/estimateForm/LineItemEditorRow.js';
import { TotalsBlock } from '../components/estimateDetail/TotalsBlock.js';
import { calculateEstimate } from '../calculations/estimate.js';
import { ApiError } from '../api/http.js';
import { useEstimateFormData } from '../hooks/useEstimateFormData.js';
import { useSaveEstimate } from '../hooks/useSaveEstimate.js';
import { useDeleteEstimate } from '../hooks/useDeleteEstimate.js';
import {
  buildCalcInput,
  emptyFormState,
  formStateFromEstimate,
  validateForm,
  type EstimateFormState,
  type FormErrors,
} from '../utils/estimateForm.js';
import type { Client } from '../api/types.js';

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Unknown error';
}

export function EstimateFormView() {
  const { id: idParam } = useParams();
  const id = idParam === undefined ? undefined : Number(idParam);
  const [searchParams] = useSearchParams();
  const preselectedClientId = searchParams.get('clientId');
  const navigate = useNavigate();

  const { state, refetch } = useEstimateFormData(id);
  const { save, pending: savePending } = useSaveEstimate();
  const { deleteEstimate, pending: deletePending } = useDeleteEstimate();

  const [form, setForm] = useState<EstimateFormState | null>(null);
  const [initializedFor, setInitializedFor] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [addClientOpen, setAddClientOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [extraClients, setExtraClients] = useState<Client[]>([]);

  const stateKey = state.status === 'success' ? `${id ?? 'new'}` : null;
  if (state.status === 'success' && stateKey !== initializedFor) {
    if (state.estimate && state.estimate.status === 'sent') {
      navigate(`/estimates/${state.estimate.id}`, { replace: true });
    } else {
      setForm(
        state.estimate
          ? formStateFromEstimate(state.estimate)
          : emptyFormState(preselectedClientId ? Number(preselectedClientId) : undefined),
      );
      setInitializedFor(stateKey);
    }
  }

  const calcInput = useMemo(() => (form ? buildCalcInput(form) : null), [form]);
  const totals = useMemo(() => (calcInput ? calculateEstimate(calcInput) : null), [calcInput]);

  if (state.status === 'loading' || !form || !totals || !calcInput) {
    return (
      <div>
        <AppHeader backTo="/" />
        <main className="mx-auto max-w-[880px] px-[48px] py-[48px]">
          <p className="text-body-sm text-[var(--text-secondary)]">Loading…</p>
        </main>
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div>
        <AppHeader backTo="/" />
        <main className="mx-auto max-w-[880px] px-[48px] py-[48px]">
          <p className="text-body-sm text-[var(--color-danger)]">{errorMessage(state.error)}</p>
          <div className="mt-4">
            <Button variant="secondary" onClick={refetch}>
              Retry
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const clients = [...state.clients, ...extraClients];
  const isEdit = id !== undefined;

  function updateForm(patch: Partial<EstimateFormState>): void {
    setForm((prev) => (prev ? { ...prev, ...patch } : prev));
  }

  function addLineItem(): void {
    setForm((prev) =>
      prev
        ? {
            ...prev,
            lineItems: [
              ...prev.lineItems,
              { id: crypto.randomUUID(), description: '', quantity: '1', rateDollars: '' },
            ],
          }
        : prev,
    );
  }

  function removeLineItem(itemId: string): void {
    setForm((prev) =>
      prev ? { ...prev, lineItems: prev.lineItems.filter((item) => item.id !== itemId) } : prev,
    );
  }

  async function handleSave(): Promise<void> {
    if (!form) return;
    const result = validateForm(form);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors(null);
    setSaveError(null);
    try {
      const saved = await save(id, {
        clientId: result.clientId,
        projectName: result.projectName,
        taxRateBasisPoints: result.taxRateBasisPoints,
        discount: result.discount,
        lineItems: result.lineItems,
      });
      navigate(`/estimates/${saved.id}`);
    } catch (error) {
      setSaveError(errorMessage(error));
    }
  }

  async function handleDelete(): Promise<void> {
    if (id === undefined) return;
    setDeleteError(null);
    try {
      await deleteEstimate(id);
      setDeleteOpen(false);
      navigate('/');
    } catch (error) {
      setDeleteError(errorMessage(error));
    }
  }

  return (
    <div>
      <AppHeader backTo="/" />
      <main className="mx-auto max-w-[880px] px-[48px] py-[48px] pb-[80px]">
        <h1 className="m-0 mb-8 text-[32px] font-light tracking-[-0.8px] text-navy">
          {isEdit ? 'Editing estimate' : 'New estimate'}
          {form.projectName && (
            <span className="text-[var(--text-secondary)]"> — {form.projectName}</span>
          )}
        </h1>

        <section className="grid grid-cols-2 gap-6">
          <div>
            <label className="mb-2 block font-sans text-[13px] font-bold uppercase tracking-[2.3px] text-[var(--text-secondary)]">
              Client
            </label>
            <ClientSelect
              clients={clients}
              value={form.clientId}
              onChange={(clientId) => updateForm({ clientId })}
              error={errors?.client}
            />
            <div className="mt-2">
              <Button variant="ghost" size="sm" onClick={() => setAddClientOpen(true)}>
                Add new client
              </Button>
            </div>
          </div>
          <div>
            <label className="mb-2 block font-sans text-[13px] font-bold uppercase tracking-[2.3px] text-[var(--text-secondary)]">
              Project name
            </label>
            <TextField
              value={form.projectName}
              onChange={(e) => updateForm({ projectName: e.target.value })}
              placeholder="Project name"
              error={errors?.projectName}
            />
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-2 grid grid-cols-[1fr_96px_132px_104px_44px] gap-3 text-[12px] font-bold uppercase tracking-[2.3px] text-[var(--text-secondary)]">
            <span>Description</span>
            <span className="text-center">Qty</span>
            <span>Rate</span>
            <span className="text-right">Amount</span>
            <span />
          </div>
          {form.lineItems.length === 0 && (
            <p className="py-4 text-[14px] text-[var(--text-secondary)]">
              No line items yet. Add your first below.
            </p>
          )}
          {form.lineItems.map((item, index) => (
            <LineItemEditorRow
              key={item.id}
              item={item}
              totalCents={totals.lineTotalsCents[index] ?? 0}
              onChange={(next) =>
                setForm((prev) =>
                  prev
                    ? {
                        ...prev,
                        lineItems: prev.lineItems.map((li) => (li.id === next.id ? next : li)),
                      }
                    : prev,
                )
              }
              onRemove={() => removeLineItem(item.id)}
              canRemove={form.lineItems.length > 1}
              errors={errors?.lineItems[item.id]}
            />
          ))}
          <div className="mt-3">
            <Button variant="ghost" size="sm" iconLeft={<Plus size={15} />} onClick={addLineItem}>
              Add line item
            </Button>
          </div>
        </section>

        <section className="mt-10 grid grid-cols-2 gap-10">
          <div className="flex flex-col gap-6">
            <div>
              <label className="mb-2 block font-sans text-[13px] font-bold uppercase tracking-[2.3px] text-[var(--text-secondary)]">
                Discount
              </label>
              <DiscountField
                mode={form.discountMode}
                value={form.discountValue}
                onModeChange={(discountMode) => updateForm({ discountMode })}
                onValueChange={(discountValue) => updateForm({ discountValue })}
                error={errors?.discount}
              />
            </div>
            <div>
              <label className="mb-2 block font-sans text-[13px] font-bold uppercase tracking-[2.3px] text-[var(--text-secondary)]">
                Tax rate
              </label>
              <div className="w-[180px]">
                <AdornedInput
                  symbol="%"
                  symbolSide="right"
                  value={form.taxRate}
                  onChange={(taxRate) => updateForm({ taxRate })}
                  error={errors?.taxRate}
                />
              </div>
            </div>
          </div>
          <div className="border border-t-[3px] border-[var(--border-strong)] border-t-cyan p-6">
            <TotalsBlock
              totals={totals}
              discount={calcInput.discount}
              taxRateBasisPoints={calcInput.taxRateBasisPoints}
            />
          </div>
        </section>

        {saveError && <p className="mt-6 text-[14px] text-[var(--color-danger)]">{saveError}</p>}

        <section className="mt-12 flex items-center gap-3 border-t border-[var(--border-hairline)] pt-7">
          <Button variant="primary" onClick={handleSave} disabled={savePending}>
            {savePending ? 'Saving…' : 'Save as draft'}
          </Button>
          <Button variant="ghost" onClick={() => navigate('/')}>
            Cancel
          </Button>
          <div className="flex-1" />
          {isEdit && (
            <Button
              variant="danger"
              iconLeft={<Trash2 size={15} className="text-[var(--color-danger)]" />}
              onClick={() => setDeleteOpen(true)}
            >
              Delete estimate
            </Button>
          )}
        </section>
      </main>

      <AddClientDialog
        open={addClientOpen}
        onOpenChange={setAddClientOpen}
        onCreated={(client) => {
          setExtraClients((prev) => [...prev, client]);
          updateForm({ clientId: client.id });
        }}
      />

      {isEdit && (
        <ConfirmDialog
          open={deleteOpen}
          onOpenChange={(open) => {
            setDeleteOpen(open);
            if (!open) setDeleteError(null);
          }}
          title="Delete estimate"
          description={`Delete "${form.projectName || 'this estimate'}"? This cannot be undone.`}
          confirmLabel="Delete"
          danger
          pending={deletePending}
          error={deleteError}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
