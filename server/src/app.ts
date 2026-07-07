import express from 'express';
import cors from 'cors';
import { config } from './config.js';
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

  // CORS locked to the configured origins (env-driven; see config.ts). A browser
  // request from a listed origin gets it echoed in Access-Control-Allow-Origin;
  // any other origin simply isn't allowed. Non-browser requests (no Origin) pass.
  app.use(cors({ origin: config.corsAllowedOrigins }));
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

  // Unmatched routes -> JSON 404 (consistent with the API; no framework HTML).
  app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  // Centralized error handler (registered last). Maps typed service/validation
  // errors to status codes; logs full detail server-side; never leaks internals.
  app.use(errorHandler);

  return app;
}
