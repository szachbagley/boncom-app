import express from 'express';
import cors from 'cors';
import { getHealthStatus } from './services/health.js';

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

  // Centralized error handler. Logs full detail server-side; never leaks
  // internal detail to the client.
  app.use(
    (
      err: unknown,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      console.error(err);
      res.status(500).json({ error: 'Internal Server Error' });
    },
  );

  return app;
}
