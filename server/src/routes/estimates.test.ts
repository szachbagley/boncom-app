import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import * as estimateService from '../services/estimates.js';
import { NotFoundError, ValidationError } from '../services/errors.js';

vi.mock('../services/estimates.js');

const sampleDetail = {
  id: 1,
  clientId: 1,
  projectName: 'Spring Brand Refresh',
  status: 'draft' as const,
  taxRateBasisPoints: 825,
  discount: { type: 'percentage' as const, valueBasisPoints: 1000 },
  createdAt: new Date(),
  updatedAt: new Date(),
  lineItems: [{ id: 1, estimateId: 1, description: 'Line', quantity: 1, rateCents: 1000 }],
  totals: {
    lineTotalsCents: [1000],
    subtotalCents: 1000,
    discountAmountCents: 100,
    discountedSubtotalCents: 900,
    taxAmountCents: 74,
    grandTotalCents: 974,
  },
};

const validCreateBody = {
  clientId: 1,
  projectName: 'Spring Brand Refresh',
  taxRateBasisPoints: 825,
  discount: { type: 'percentage', valueBasisPoints: 1000 },
  lineItems: [{ description: 'Design consultation', quantity: 2.5, rateCents: 1250 }],
};

const validUpdateBody = {
  projectName: 'Renamed',
  status: 'draft',
  taxRateBasisPoints: 0,
  lineItems: [],
};

beforeEach(() => {
  vi.resetAllMocks();
});

describe('GET /api/estimates', () => {
  it('returns the list and passes parsed query filters to the service', async () => {
    vi.mocked(estimateService.listEstimates).mockResolvedValue([]);

    const res = await request(createApp()).get('/api/estimates').query({ status: 'sent' });

    expect(res.status).toBe(200);
    expect(estimateService.listEstimates).toHaveBeenCalledWith({ status: 'sent' });
  });

  it('rejects an invalid status query value with 400', async () => {
    const res = await request(createApp()).get('/api/estimates').query({ status: 'bogus' });

    expect(res.status).toBe(400);
    expect(estimateService.listEstimates).not.toHaveBeenCalled();
  });
});

describe('POST /api/estimates', () => {
  it('creates an estimate and returns 201', async () => {
    vi.mocked(estimateService.createEstimate).mockResolvedValue(sampleDetail);

    const res = await request(createApp()).post('/api/estimates').send(validCreateBody);

    expect(res.status).toBe(201);
    expect(res.body.projectName).toBe('Spring Brand Refresh');
    expect(estimateService.createEstimate).toHaveBeenCalledWith(validCreateBody);
  });

  it('rejects a negative rateCents with 400 (money rule) and does not call the service', async () => {
    const res = await request(createApp())
      .post('/api/estimates')
      .send({
        ...validCreateBody,
        lineItems: [{ description: 'Bad', quantity: 1, rateCents: -100 }],
      });

    expect(res.status).toBe(400);
    expect(estimateService.createEstimate).not.toHaveBeenCalled();
  });

  it('rejects a quantity with more than 3 decimal places with 400', async () => {
    const res = await request(createApp())
      .post('/api/estimates')
      .send({
        ...validCreateBody,
        lineItems: [{ description: 'Bad', quantity: 1.2345, rateCents: 100 }],
      });

    expect(res.status).toBe(400);
    expect(estimateService.createEstimate).not.toHaveBeenCalled();
  });

  it('rejects a discount with the wrong key for its type (union enforcement) with 400', async () => {
    const res = await request(createApp())
      .post('/api/estimates')
      .send({
        ...validCreateBody,
        discount: { type: 'percentage', amountCents: 5 }, // should be valueBasisPoints
      });

    expect(res.status).toBe(400);
    expect(estimateService.createEstimate).not.toHaveBeenCalled();
  });

  it('maps a service NotFoundError (unknown client) to 404', async () => {
    vi.mocked(estimateService.createEstimate).mockRejectedValue(
      new NotFoundError('Client 999 not found'),
    );

    const res = await request(createApp()).post('/api/estimates').send(validCreateBody);

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Client 999 not found');
  });
});

describe('GET /api/estimates/:id', () => {
  it('rejects a non-numeric id with 400', async () => {
    const res = await request(createApp()).get('/api/estimates/abc');
    expect(res.status).toBe(400);
    expect(estimateService.getEstimate).not.toHaveBeenCalled();
  });

  it('returns 404 when the service returns null', async () => {
    vi.mocked(estimateService.getEstimate).mockResolvedValue(null);
    const res = await request(createApp()).get('/api/estimates/1');
    expect(res.status).toBe(404);
  });

  it('returns 200 with the estimate detail', async () => {
    vi.mocked(estimateService.getEstimate).mockResolvedValue(sampleDetail);
    const res = await request(createApp()).get('/api/estimates/1');
    expect(res.status).toBe(200);
    expect(res.body.totals.grandTotalCents).toBe(974);
    expect(estimateService.getEstimate).toHaveBeenCalledWith(1);
  });
});

describe('PUT /api/estimates/:id', () => {
  it('updates and returns 200', async () => {
    vi.mocked(estimateService.updateEstimate).mockResolvedValue(sampleDetail);
    const res = await request(createApp()).put('/api/estimates/1').send(validUpdateBody);
    expect(res.status).toBe(200);
    expect(estimateService.updateEstimate).toHaveBeenCalledWith(1, validUpdateBody);
  });

  it('maps a service ValidationError (e.g. sent->draft) to 400', async () => {
    vi.mocked(estimateService.updateEstimate).mockRejectedValue(
      new ValidationError('An estimate cannot move from "sent" back to "draft".'),
    );
    const res = await request(createApp()).put('/api/estimates/1').send(validUpdateBody);
    expect(res.status).toBe(400);
  });

  it('returns 404 when the service returns null', async () => {
    vi.mocked(estimateService.updateEstimate).mockResolvedValue(null);
    const res = await request(createApp()).put('/api/estimates/1').send(validUpdateBody);
    expect(res.status).toBe(404);
  });
});

describe('PATCH /api/estimates/:id/status', () => {
  it('updates status and returns 200', async () => {
    vi.mocked(estimateService.setEstimateStatus).mockResolvedValue(sampleDetail);
    const res = await request(createApp())
      .patch('/api/estimates/1/status')
      .send({ status: 'sent' });
    expect(res.status).toBe(200);
    expect(estimateService.setEstimateStatus).toHaveBeenCalledWith(1, 'sent');
  });

  it('rejects an invalid status enum value with 400', async () => {
    const res = await request(createApp())
      .patch('/api/estimates/1/status')
      .send({ status: 'archived' });
    expect(res.status).toBe(400);
    expect(estimateService.setEstimateStatus).not.toHaveBeenCalled();
  });

  it('maps a service ValidationError to 400', async () => {
    vi.mocked(estimateService.setEstimateStatus).mockRejectedValue(
      new ValidationError('An estimate cannot move from "sent" back to "draft".'),
    );
    const res = await request(createApp())
      .patch('/api/estimates/1/status')
      .send({ status: 'draft' });
    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/estimates/:id', () => {
  it('returns 204 when deleted', async () => {
    vi.mocked(estimateService.deleteEstimate).mockResolvedValue(true);
    const res = await request(createApp()).delete('/api/estimates/1');
    expect(res.status).toBe(204);
    expect(res.body).toEqual({});
  });

  it('returns 404 when nothing was deleted', async () => {
    vi.mocked(estimateService.deleteEstimate).mockResolvedValue(false);
    const res = await request(createApp()).delete('/api/estimates/1');
    expect(res.status).toBe(404);
  });
});
