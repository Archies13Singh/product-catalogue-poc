import express, { type Express } from 'express';
import helmet from 'helmet';
import type { Config } from './config';
import { errorHandler, notFoundHandler } from './http/errors';
import { productRoutes } from './products/productRoutes';
import { ProductService } from './products/productService';
import type { ProductSource } from './products/productSource';

export interface AppDependencies {
  config: Config;
  productSource: ProductSource;
}

/**
 * Builds the app from its dependencies. `server.ts` passes the real adapters; tests pass
 * fakes. The app itself never knows which data source it is talking to.
 */
export function createApp({ config, productSource }: AppDependencies): Express {
  const productService = new ProductService(productSource, {
    featuredProductIds: config.featuredProductIds,
    categoryTopRatedCount: config.categoryTopRatedCount,
  });

  const app = express();
  app.use(helmet());
  // Query values are always plain strings, never nested objects or arrays.
  app.set('query parser', 'simple');

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });
  app.use('/api', productRoutes(productService));

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
