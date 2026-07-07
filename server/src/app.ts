import express from 'express';
import cors from 'cors';
import { getHealthStatus } from './services/health.js';
import { clientsRouter } from './routes/clients.js';
import { estimatesRouter } from './routes/estimates.js';
import { errorHandler } from './routes/errorHandler.js';

/**
 * Builds the Express application: middleware + routes, no network binding.
 * Kept separate from server bootstrap so it can be imported in tests later.
 */
export function createApp(): express.Express {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Route does HTTP only: delegate to the service, forward failures to the
  // centralized error handler. No business logic or DB calls live here.
  app.get('/health', async (_req, res, next) => {
    try {
      res.json(await getHealthStatus());
    } catch (err) {
      next(err);
    }
  });

  app.use('/api/clients', clientsRouter);
  app.use('/api/estimates', estimatesRouter);

  // Centralized error handler (registered last). Maps typed service/validation
  // errors to status codes; logs full detail server-side; never leaks internals.
  app.use(errorHandler);

  return app;
}
