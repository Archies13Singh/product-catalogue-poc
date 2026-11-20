import { Router } from 'express';
import { z } from 'zod';
import { InvalidInputError } from '../http/errors';
import type { ProductService } from './productService';

const searchQuerySchema = z.object({
  search: z.string().trim().min(1).max(100).optional(),
});

export function productRoutes(service: ProductService): Router {
  const router = Router();

  // Declared before "/products/:id" so that "featured" is not read as a product ID.
  router.get('/products/featured', async (_req, res) => {
    res.json(await service.getFeatured());
  });

  router.get('/products', async (req, res) => {
    const query = searchQuerySchema.safeParse(req.query);
    if (!query.success) {
      throw new InvalidInputError('The search term must be between 1 and 100 characters');
    }
    const { search } = query.data;
    res.json(search ? await service.search(search) : await service.listProducts());
  });

  router.get('/products/:id', async (req, res) => {
    res.json(await service.getProduct(req.params.id));
  });

  router.get('/categories', async (_req, res) => {
    res.json(await service.getCategories());
  });

  router.get('/categories/:slug', async (req, res) => {
    res.json(await service.getCategoryPage(req.params.slug));
  });

  return router;
}
