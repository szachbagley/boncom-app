import {
  basisPointsToInputString,
  centsToInputString,
  dollarsToCents,
  parseQuantity,
  percentToBasisPoints,
} from './money.js';
import type { Discount, EstimateCalcInput } from '../calculations/estimate.js';
import type { EstimateDetail, LineItemInput } from '../api/types.js';

/**
 * Pure form-state <-> domain-type mapping and validation for the estimate create/edit
 * form. Two purposes kept deliberately separate:
 *  - buildCalcInput: LENIENT (blank/invalid -> 0), drives the live totals preview via
 *    the shared calc module on every keystroke.
 *  - validateForm: STRICT, mirrors the server's Zod, only called on Save.
 */

export interface LineItemFormState {
  /** Local id for React keys / edit targeting — NOT the DB id (new rows have none). */
  id: string;
  description: string;
  quantity: string;
  rateDollars: string;
}

export type DiscountMode = 'percent' | 'fixed';

export interface EstimateFormState {
  clientId: number | null;
  projectName: string;
  lineItems: LineItemFormState[];
  discountMode: DiscountMode;
  discountValue: string;
  taxRate: string;
}

export interface LineItemFieldErrors {
  description?: string;
  quantity?: string;
  rate?: string;
}

export interface FormErrors {
  client?: string;
  projectName?: string;
  taxRate?: string;
  discount?: string;
  lineItems: Record<string, LineItemFieldErrors>;
}

export interface ValidEstimateForm {
  ok: true;
  clientId: number;
  projectName: string;
  taxRateBasisPoints: number;
  discount?: Discount;
  lineItems: LineItemInput[];
}

export interface InvalidEstimateForm {
  ok: false;
  errors: FormErrors;
}

function newLocalId(): string {
  return crypto.randomUUID();
}

function blankLineItem(): LineItemFormState {
  return { id: newLocalId(), description: '', quantity: '1', rateDollars: '' };
}

/** A blank form, optionally with a client pre-selected (the Dashboard "+" flow). */
export function emptyFormState(clientId?: number): EstimateFormState {
  return {
    clientId: clientId ?? null,
    projectName: '',
    lineItems: [blankLineItem()],
    discountMode: 'percent',
    discountValue: '',
    taxRate: '',
  };
}

/** Prefills form state from an existing estimate, for edit mode. */
export function formStateFromEstimate(estimate: EstimateDetail): EstimateFormState {
  const discount = estimate.discount;
  return {
    clientId: estimate.clientId,
    projectName: estimate.projectName,
    lineItems: estimate.lineItems.map((item) => ({
      id: String(item.id),
      description: item.description,
      quantity: String(item.quantity),
      rateDollars: centsToInputString(item.rateCents),
    })),
    discountMode: discount?.type === 'fixed' ? 'fixed' : 'percent',
    discountValue:
      discount === undefined
        ? ''
        : discount.type === 'percentage'
          ? basisPointsToInputString(discount.valueBasisPoints)
          : centsToInputString(discount.amountCents),
    taxRate:
      estimate.taxRateBasisPoints === 0 ? '' : basisPointsToInputString(estimate.taxRateBasisPoints),
  };
}

/** Builds the Discount union from the form's mode + raw value string, or undefined if blank. */
function buildDiscount(form: EstimateFormState, lenient: boolean): Discount | undefined {
  const raw = form.discountValue.trim();
  if (raw === '') return undefined;

  if (form.discountMode === 'percent') {
    const bp = percentToBasisPoints(raw);
    return { type: 'percentage', valueBasisPoints: lenient ? (bp ?? 0) : (bp as number) };
  }
  const cents = dollarsToCents(raw);
  return { type: 'fixed', amountCents: lenient ? (cents ?? 0) : (cents as number) };
}

/** Lenient: blank/invalid fields become 0. Drives the live preview. Never throws. */
export function buildCalcInput(form: EstimateFormState): EstimateCalcInput {
  return {
    lineItems: form.lineItems.map((item) => ({
      quantity: parseQuantity(item.quantity) ?? 0,
      rateCents: dollarsToCents(item.rateDollars) ?? 0,
    })),
    discount: buildDiscount(form, true),
    taxRateBasisPoints: form.taxRate.trim() === '' ? 0 : (percentToBasisPoints(form.taxRate) ?? 0),
  };
}

/** Strict: field-level errors, or a ready-to-send payload. Mirrors the server's Zod. */
export function validateForm(form: EstimateFormState): ValidEstimateForm | InvalidEstimateForm {
  const errors: FormErrors = { lineItems: {} };

  if (form.clientId === null) {
    errors.client = 'Select a client.';
  }

  const projectName = form.projectName.trim();
  if (projectName === '') {
    errors.projectName = 'Project name is required.';
  }

  let taxRateBasisPoints = 0;
  if (form.taxRate.trim() !== '') {
    const bp = percentToBasisPoints(form.taxRate);
    if (bp === null) {
      errors.taxRate = 'Enter a valid tax rate.';
    } else {
      taxRateBasisPoints = bp;
    }
  }

  let discount: Discount | undefined;
  if (form.discountValue.trim() !== '') {
    if (form.discountMode === 'percent') {
      const bp = percentToBasisPoints(form.discountValue);
      if (bp === null) {
        errors.discount = 'Enter a valid discount percentage.';
      } else {
        discount = { type: 'percentage', valueBasisPoints: bp };
      }
    } else {
      const cents = dollarsToCents(form.discountValue);
      if (cents === null) {
        errors.discount = 'Enter a valid discount amount.';
      } else {
        discount = { type: 'fixed', amountCents: cents };
      }
    }
  }

  const lineItems: LineItemInput[] = [];
  for (const item of form.lineItems) {
    const fieldErrors: LineItemFieldErrors = {};
    const description = item.description.trim();
    if (description === '') {
      fieldErrors.description = 'Description is required.';
    }
    const quantity = parseQuantity(item.quantity);
    if (quantity === null) {
      fieldErrors.quantity = 'Enter a valid quantity (up to 3 decimals).';
    }
    const rateCents = dollarsToCents(item.rateDollars);
    if (rateCents === null) {
      fieldErrors.rate = 'Enter a valid rate.';
    }
    if (Object.keys(fieldErrors).length > 0) {
      errors.lineItems[item.id] = fieldErrors;
    } else {
      lineItems.push({ description, quantity: quantity as number, rateCents: rateCents as number });
    }
  }

  const hasErrors =
    errors.client !== undefined ||
    errors.projectName !== undefined ||
    errors.taxRate !== undefined ||
    errors.discount !== undefined ||
    Object.keys(errors.lineItems).length > 0;

  if (hasErrors) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    clientId: form.clientId as number,
    projectName,
    taxRateBasisPoints,
    discount,
    lineItems,
  };
}
