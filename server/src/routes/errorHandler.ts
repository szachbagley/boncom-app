import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { NotFoundError, ValidationError } from '../services/errors.js';

/**
 * Centralized error mapping for the API. Translates the boundary's typed errors into
 * HTTP status codes. Logs full detail server-side for the unexpected case; never leaks
 * internal/DB detail to the client (per CLAUDE.md).
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ZodError) {
    // Field-level detail so the client knows exactly what to fix.
    res
      .status(400)
      .json({ error: 'Validation failed', details: err.flatten().fieldErrors });
    return;
  }
  if (err instanceof ValidationError) {
    res.status(400).json({ error: err.message });
    return;
  }
  if (err instanceof NotFoundError) {
    res.status(404).json({ error: err.message });
    return;
  }
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
}
