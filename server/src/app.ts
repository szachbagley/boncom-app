import express from 'express';
import cors from 'cors';

/**
 * Builds the Express application: middleware + routes, no network binding.
 * Kept separate from server bootstrap so it can be imported in tests later.
 */
export function createApp(): express.Express {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  return app;
}
