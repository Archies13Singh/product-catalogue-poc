import { z } from 'zod';
import { UpstreamError } from '../http/errors';
import { toCategory, type Product } from './product';
import type { ProductSource } from './productSource';

const REQUEST_TIMEOUT_MS = 5000;

// Only the fields we use. Validating the response means a change in the Fake Store API
// fails here with a clear error, not somewhere in the frontend.
const fakeStoreProductSchema = z.object({
  id: z.number(),
  title: z.string(),
  price: z.number(),
  description: z.string(),
  category: z.string(),
  image: z.string(),
  rating: z.object({ rate: z.number(), count: z.number() }),
});

type FakeStoreProduct = z.infer<typeof fakeStoreProductSchema>;

function toProduct(item: FakeStoreProduct): Product {
  return {
    id: String(item.id),
    title: item.title,
    description: item.description,
    price: item.price,
    category: toCategory(item.category),
    imageUrl: item.image,
    rating: { score: item.rating.rate, count: item.rating.count },
  };
}

interface Options {
  baseUrl: string;
  cacheTtlSeconds: number;
  /** Replaceable so tests do not make network calls. */
  fetchFn?: typeof fetch;
}

/** Product source backed by https://fakestoreapi.com. */
export class FakeStoreSource implements ProductSource {
  private readonly fetchFn: typeof fetch;
  private cache: { products: Product[]; expiresAt: number } | null = null;

  constructor(private readonly options: Options) {
    this.fetchFn = options.fetchFn ?? fetch;
  }

  async listProducts(): Promise<Product[]> {
    if (this.cache && this.cache.expiresAt > Date.now()) {
      return this.cache.products;
    }
    const products = await this.fetchProducts();
    this.cache = { products, expiresAt: Date.now() + this.options.cacheTtlSeconds * 1000 };
    return products;
  }

  // Served from the cached list, not from the API's single-product endpoint. The catalogue
  // is small, it saves a network call per product page, and that endpoint answers
  // "200 with an empty body" for an unknown ID, which is easy to get wrong.
  async getProduct(id: string): Promise<Product | null> {
    const products = await this.listProducts();
    return products.find((product) => product.id === id) ?? null;
  }

  private async fetchProducts(): Promise<Product[]> {
    let body: unknown;
    try {
      const response = await this.fetchFn(`${this.options.baseUrl}/products`, {
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (!response.ok) {
        throw new Error(`Fake Store API responded with status ${response.status}`);
      }
      body = await response.json();
    } catch (cause) {
      throw new UpstreamError('The product catalogue is temporarily unavailable', { cause });
    }

    const parsed = z.array(fakeStoreProductSchema).safeParse(body);
    if (!parsed.success) {
      throw new UpstreamError('The product catalogue returned unexpected data', {
        cause: parsed.error,
      });
    }
    return parsed.data.map(toProduct);
  }
}
