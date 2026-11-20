import type { Product } from './product';

/**
 * Where products come from. To change the data source, write a new implementation of this
 * interface and wire it in `server.ts`. Nothing else needs to change.
 */
export interface ProductSource {
  listProducts(): Promise<Product[]>;
  /** Resolves to null when there is no product with that ID. */
  getProduct(id: string): Promise<Product | null>;
}
