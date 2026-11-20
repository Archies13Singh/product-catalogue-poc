import express, { type Express } from 'express';
import helmet from 'helmet';
import type { Config } from './config';
import { enquiryRoutes } from './enquiries/enquiryRoutes';
import { EnquiryService } from './enquiries/enquiryService';
import type { Mailer } from './enquiries/mailer';
import { errorHandler, notFoundHandler } from './http/errors';
import { productRoutes } from './products/productRoutes';
import { ProductService } from './products/productService';
import type { ProductSource } from './products/productSource';

export interface AppDependencies {
  config: Config;
  productSource: ProductSource;
  mailer: Mailer;
}

/**
 * Builds the app from its dependencies. `server.ts` passes the real adapters; tests pass
 * fakes. The app itself never knows which data source or email provider it is using.
 */
export function createApp({ config, productSource, mailer }: AppDependencies): Express {
  const productService = new ProductService(productSource, {
    featuredProductIds: config.featuredProductIds,
    categoryTopRatedCount: config.categoryTopRatedCount,
  });
  const enquiryService = new EnquiryService(productService, mailer, {
    salesInboxEmail: config.salesInboxEmail,
    mailFrom: config.mailFrom,
  });

  const app = express();
  app.use(helmet());
  // An enquiry is a few short fields, so anything larger is rejected.
  app.use(express.json({ limit: '10kb' }));
  // Query values are always plain strings, never nested objects or arrays.
  app.set('query parser', 'simple');

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });
  app.use('/api', productRoutes(productService));
  app.use('/api', enquiryRoutes(enquiryService, { rateLimitMax: config.enquiryRateLimitMax }));

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
