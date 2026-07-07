import { describe, it, expect, vi } from 'vitest';
import { z } from 'zod';
import type { Response } from 'express';
import { errorHandler } from './errorHandler.js';
import { NotFoundError, ValidationError } from '../services/errors.js';

function mockRes(): Response {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return res as unknown as Response;
}

describe('errorHandler', () => {
  it('maps a malformed-JSON body-parser SyntaxError to 400', () => {
    const err = new SyntaxError('Unexpected token in JSON');
    // body-parser attaches the raw body to its SyntaxError; that's what
    // distinguishes it from an unrelated SyntaxError.
    (err as unknown as { body: string }).body = '{ bad';
    const res = mockRes();

    errorHandler(err, {} as never, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Malformed JSON in request body' });
  });

  it('maps a ZodError to 400 with field-level details', () => {
    const result = z.object({ name: z.string() }).safeParse({ name: 123 });
    if (result.success) {
      throw new Error('expected parse to fail');
    }
    const res = mockRes();

    errorHandler(result.error, {} as never, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Validation failed' }),
    );
    const payload = vi.mocked(res.json).mock.calls[0]?.[0] as { details: unknown };
    expect(payload.details).toBeDefined();
  });

  it('maps a ValidationError to 400 with its message', () => {
    const res = mockRes();
    errorHandler(new ValidationError('bad transition'), {} as never, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'bad transition' });
  });

  it('maps a NotFoundError to 404 with its message', () => {
    const res = mockRes();
    errorHandler(new NotFoundError('Client 1 not found'), {} as never, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Client 1 not found' });
  });

  it('maps an unexpected error to a clean 500 that does NOT leak the message', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = mockRes();

    errorHandler(new Error('secret db connection string'), {} as never, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
    const payload = vi.mocked(res.json).mock.calls[0]?.[0] as { error: string };
    expect(payload.error).not.toContain('secret db connection string');
    // The detail is still logged server-side, just not sent to the client.
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});
