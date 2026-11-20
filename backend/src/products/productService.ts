import { NotFoundError } from '../http/errors';
import type { Category, Product } from './product';
import type { ProductSource } from './productSource';

interface Options {
  featuredProductIds: string[];
  categoryTopRatedCount: number;
}

export interface CategoryPage {
  category: Category;
  topRated: Product[];
  others: Product[];
}

/** Catalogue rules that hold whatever the data source is. */
export class ProductService {
  constructor(
    private readonly source: ProductSource,
    private readonly options: Options,
  ) {}

  /** The products the business has chosen to feature, in the configured order. */
  async getFeatured(): Promise<Product[]> {
    const products = await this.source.listProducts();
    const featured: Product[] = [];
    for (const id of this.options.featuredProductIds) {
      const product = products.find((candidate) => candidate.id === id);
      if (product) {
        featured.push(product);
      } else {
        // A wrong ID in config should not break the home page.
        console.warn(`Featured product "${id}" was not found and is skipped`);
      }
    }
    return featured;
  }

  async getCategories(): Promise<Category[]> {
    const products = await this.source.listProducts();
    const bySlug = new Map<string, Category>();
    for (const product of products) {
      bySlug.set(product.category.slug, product.category);
    }
    return [...bySlug.values()].sort((a, b) => a.name.localeCompare(b.name));
  }

  /** Splits a category into its highest-rated products and the rest, with no overlap. */
  async getCategoryPage(slug: string): Promise<CategoryPage> {
    const products = await this.source.listProducts();
    const inCategory = products.filter((product) => product.category.slug === slug);
    const category = inCategory[0]?.category;
    if (!category) {
      throw new NotFoundError('Category not found');
    }

    const topRated = [...inCategory]
      .sort((a, b) => b.rating.score - a.rating.score || b.rating.count - a.rating.count)
      .slice(0, this.options.categoryTopRatedCount);
    const others = inCategory.filter((product) => !topRated.includes(product));
    return { category, topRated, others };
  }

  async listProducts(): Promise<Product[]> {
    return this.source.listProducts();
  }

  /** Case-insensitive substring match on title, description and category name. */
  async search(term: string): Promise<Product[]> {
    const needle = term.trim().toLowerCase();
    const products = await this.source.listProducts();
    return products.filter((product) =>
      [product.title, product.description, product.category.name].some((text) =>
        text.toLowerCase().includes(needle),
      ),
    );
  }

  async getProduct(id: string): Promise<Product> {
    const product = await this.source.getProduct(id);
    if (!product) {
      throw new NotFoundError('Product not found');
    }
    return product;
  }
}
