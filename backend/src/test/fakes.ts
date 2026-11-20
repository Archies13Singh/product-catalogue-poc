import type { Config } from '../config';
import { toCategory, type Product } from '../products/product';
import type { ProductSource } from '../products/productSource';

type ProductOverrides = Partial<Omit<Product, 'category'>> & { category?: string };

export function makeProduct({ category = 'electronics', ...overrides }: ProductOverrides = {}): Product {
  return {
    id: '1',
    title: 'Test product',
    description: 'A product used in tests',
    price: 10,
    imageUrl: 'https://example.com/image.png',
    rating: { score: 4, count: 100 },
    ...overrides,
    category: toCategory(category),
  };
}

/** An in-memory product source, so tests never call the real Fake Store API. */
export class FakeProductSource implements ProductSource {
  /** Set to make every call fail, to test how the app handles a broken source. */
  failWith: Error | null = null;

  constructor(private readonly products: Product[]) {}

  async listProducts(): Promise<Product[]> {
    if (this.failWith) throw this.failWith;
    return this.products;
  }

  async getProduct(id: string): Promise<Product | null> {
    if (this.failWith) throw this.failWith;
    return this.products.find((product) => product.id === id) ?? null;
  }
}

export const testConfig: Config = {
  port: 0,
  fakeStoreBaseUrl: 'https://fake-store.test',
  productCacheTtlSeconds: 60,
  featuredProductIds: ['3', '1'],
  categoryTopRatedCount: 2,
};
