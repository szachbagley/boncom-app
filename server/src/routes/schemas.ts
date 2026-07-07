import { z } from 'zod';

/**
 * Request validation schemas — the API's edge. These enforce the money invariants
 * (integer cents, integer basis points, discount as a discriminated union) at the
 * boundary, before anything reaches a service. `z.infer` of each schema is designed
 * to be assignable to the corresponding service input type.
 */

// ---- Shared money/number primitives ----

/** Integer cents (rate per unit, fixed discount amount). Never a float, never negative. */
export const intCents = z.number().int().nonnegative();

/** Integer basis points (tax rate, percentage discount). Never a float, never negative. */
export const basisPoints = z.number().int().nonnegative();

/** Quantity: fractional allowed (NOT money) but capped at 3 decimals to fit DECIMAL(12,3). */
export const quantity = z
  .number()
  .nonnegative()
  .refine((n) => Number.isInteger(n * 1000), {
    message: 'quantity supports at most 3 decimal places',
  });

/** Path/query id: arrives as a string, coerced to a positive integer. */
export const idParam = z.coerce.number().int().positive();

const projectName = z.string().trim().min(1).max(255);
const estimateStatus = z.enum(['draft', 'sent']);

// ---- Discount discriminated union (mirrors the calc module's Discount) ----

export const discountSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('percentage'), valueBasisPoints: basisPoints }),
  z.object({ type: z.literal('fixed'), amountCents: intCents }),
]);

export const lineItemSchema = z.object({
  description: z.string().trim().min(1).max(255),
  quantity,
  rateCents: intCents,
});

// ---- Client ----

export const createClientSchema = z.object({
  name: z.string().trim().min(1).max(255),
});

// ---- Estimate ----

export const createEstimateSchema = z.object({
  clientId: z.number().int().positive(),
  projectName,
  status: estimateStatus.optional(), // service defaults to 'draft'
  taxRateBasisPoints: basisPoints.optional(), // service defaults to 0
  discount: discountSchema.optional(),
  lineItems: z.array(lineItemSchema).optional(),
});

export const updateEstimateSchema = z.object({
  projectName,
  status: estimateStatus,
  taxRateBasisPoints: basisPoints,
  discount: discountSchema.optional(),
  lineItems: z.array(lineItemSchema), // complete replacement set (may be [])
});

export const updateStatusSchema = z.object({ status: estimateStatus });

export const listEstimatesQuerySchema = z.object({
  clientId: z.coerce.number().int().positive().optional(),
  status: estimateStatus.optional(),
});
