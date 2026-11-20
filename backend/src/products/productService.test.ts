import { describe, expect, it, vi } from 'vitest';
import { NotFoundError } from '../http/errors';
import { FakeProductSource, makeProduct } from '../test/fakes';
import { ProductService } from './productService';

const products = [
  makeProduct({ id: '1', title: 'Laptop', category: 'electronics', rating: { score: 4.0, count: 10 } }),
  makeProduct({ id: '2', title: 'Monitor', category: 'electronics', rating: { score: 4.8, count: 50 } }),
  makeProduct({ id: '3', title: 'Keyboard', category: 'electronics', rating: { score: 4.8, count: 90 } }),
  makeProduct({ id: '4', title: 'Mouse', category: 'electronics', rating: { score: 3.0, count: 5 } }),
  makeProduct({ id: '5', title: 'Rain Jacket', description: 'Keeps you dry', category: "men's clothing" }),
];

function createService(featuredProductIds = ['3', '1']) {
  return new ProductService(new FakeProductSource(products), {
    featuredProductIds,
    categoryTopRatedCount: 2,
  });
}

const ids = (list: { id: string }[]) => list.map((product) => product.id);

describe('getFeatured', () => {
  it('returns the configured products in the configured order', async () => {
    expect(ids(await createService(['3', '1']).getFeatured())).toEqual(['3', '1']);
  });

  it('skips a configured ID that does not exist', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(ids(await createService(['3', 'missing', '1']).getFeatured())).toEqual(['3', '1']);
    expect(warn).toHaveBeenCalledOnce();
    warn.mockRestore();
  });
});

describe('getCategories', () => {
  it('returns each category once, sorted by name', async () => {
    expect(await createService().getCategories()).toEqual([
      { slug: 'electronics', name: 'electronics' },
      { slug: 'mens-clothing', name: "men's clothing" },
    ]);
  });
});

describe('getCategoryPage', () => {
  it('puts the highest rated first, breaking ties by number of ratings', async () => {
    const page = await createService().getCategoryPage('electronics');
    expect(page.category.name).toBe('electronics');
    expect(ids(page.topRated)).toEqual(['3', '2']);
  });

  it('lists the remaining products once, without repeating the top rated', async () => {
    const page = await createService().getCategoryPage('electronics');
    expect(ids(page.others)).toEqual(['1', '4']);
  });

  it('only includes products from that category', async () => {
    const page = await createService().getCategoryPage('mens-clothing');
    expect(ids([...page.topRated, ...page.others])).toEqual(['5']);
  });

  it('throws NotFoundError for an unknown category', async () => {
    await expect(createService().getCategoryPage('toys')).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe('search', () => {
  it('matches part of a title, ignoring case', async () => {
    expect(ids(await createService().search('JACK'))).toEqual(['5']);
  });

  it('matches the description and the category name', async () => {
    expect(ids(await createService().search('keeps you dry'))).toEqual(['5']);
    expect(ids(await createService().search('clothing'))).toEqual(['5']);
  });

  it('returns nothing when no product matches', async () => {
    expect(await createService().search('bicycle')).toEqual([]);
  });
});

describe('getProduct', () => {
  it('returns the product', async () => {
    expect((await createService().getProduct('2')).title).toBe('Monitor');
  });

  it('throws NotFoundError for an unknown ID', async () => {
    await expect(createService().getProduct('999')).rejects.toBeInstanceOf(NotFoundError);
  });
});
