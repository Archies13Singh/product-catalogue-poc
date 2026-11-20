/**
 * Our own product model. The frontend and the rest of the backend depend on this shape,
 * never on the shape of whichever data source the products come from.
 */
export interface Product {
  /** Opaque string, so a future source can use any kind of ID. */
  id: string;
  title: string;
  description: string;
  price: number;
  category: Category;
  imageUrl: string;
  rating: {
    /** Average score out of 5. */
    score: number;
    /** Number of ratings. */
    count: number;
  };
}

export interface Category {
  /** URL-safe identifier, for example "mens-clothing". */
  slug: string;
  /** Display name, for example "men's clothing". */
  name: string;
}

export function toCategory(name: string): Category {
  const slug = name
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return { slug, name };
}
