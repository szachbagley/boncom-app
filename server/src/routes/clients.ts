import { Router } from 'express';
import { asyncHandler } from './asyncHandler.js';
import { createClientSchema } from './schemas.js';
import * as clientService from '../services/clients.js';

/**
 * Clients router: HTTP only — parse, validate, delegate to the client service, respond.
 * List + create only, per this feature's scope.
 */
export const clientsRouter = Router();

clientsRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    res.json(await clientService.listClients());
  }),
);

clientsRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const input = createClientSchema.parse(req.body);
    const client = await clientService.createClient(input);
    res.status(201).json(client);
  }),
);
