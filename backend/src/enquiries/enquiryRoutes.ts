import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { TooManyRequestsError } from '../http/errors';
import type { EnquiryService } from './enquiryService';

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

interface Options {
  rateLimitMax: number;
}

export function enquiryRoutes(service: EnquiryService, options: Options): Router {
  const router = Router();

  // This endpoint sends email, so it is the one most open to abuse.
  const limiter = rateLimit({
    windowMs: RATE_LIMIT_WINDOW_MS,
    limit: options.rateLimitMax,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_req, _res, next) => {
      next(new TooManyRequestsError('Too many enquiries. Please try again later.'));
    },
  });

  router.post('/enquiries', limiter, async (req, res) => {
    await service.submit(req.body);
    res.status(201).json({ status: 'received' });
  });

  return router;
}
