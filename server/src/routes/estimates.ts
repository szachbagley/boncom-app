import { Router } from 'express';
import { asyncHandler } from './asyncHandler.js';
import {
  createEstimateSchema,
  idParam,
  listEstimatesQuerySchema,
  updateEstimateSchema,
  updateStatusSchema,
} from './schemas.js';
import * as estimateService from '../services/estimates.js';

/**
 * Estimates router: HTTP only — parse, validate, delegate to the estimate service,
 * respond. Line items are nested-only (bulk replace via POST/PUT bodies); there are
 * no granular per-line-item endpoints in this feature.
 */
export const estimatesRouter = Router();

estimatesRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const filter = listEstimatesQuerySchema.parse(req.query);
    res.json(await estimateService.listEstimates(filter));
  }),
);

estimatesRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const input = createEstimateSchema.parse(req.body);
    const created = await estimateService.createEstimate(input);
    res.status(201).json(created);
  }),
);

estimatesRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = idParam.parse(req.params.id);
    const estimate = await estimateService.getEstimate(id);
    if (!estimate) {
      res.status(404).json({ error: 'Estimate not found' });
      return;
    }
    res.json(estimate);
  }),
);

estimatesRouter.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = idParam.parse(req.params.id);
    const input = updateEstimateSchema.parse(req.body);
    const updated = await estimateService.updateEstimate(id, input);
    if (!updated) {
      res.status(404).json({ error: 'Estimate not found' });
      return;
    }
    res.json(updated);
  }),
);

estimatesRouter.patch(
  '/:id/status',
  asyncHandler(async (req, res) => {
    const id = idParam.parse(req.params.id);
    const { status } = updateStatusSchema.parse(req.body);
    const updated = await estimateService.setEstimateStatus(id, status);
    if (!updated) {
      res.status(404).json({ error: 'Estimate not found' });
      return;
    }
    res.json(updated);
  }),
);

estimatesRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = idParam.parse(req.params.id);
    const deleted = await estimateService.deleteEstimate(id);
    if (!deleted) {
      res.status(404).json({ error: 'Estimate not found' });
      return;
    }
    res.status(204).end();
  }),
);
