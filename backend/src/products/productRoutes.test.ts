import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../app';
import { UpstreamError } from '../http/errors';
import { FakeProductSource, makeProduct, testConfig } from '../test/fakes';

const products = [
  makeProduct({ id: '1', title: 'Laptop', category: 'electronics', rating: { score: 4.0, count: 10 } }),
  makeProduct({ id: '2', title: 'Monitor', category: 'electronics', rating: { score: 4.8, count: 50 } }),
  makeProduct({ id: '3', title: 'Keyboard', category: 'electronics', rating: { score: 4.5, count: 90 } }),
  makeProduct({ id: '4', title: 'Rain Jacket', category: "men's clothing" }),
];

function setup() {
  const productSource = new FakeProductSource(products);
  const app = createApp({ config: testConfig, productSource });
  return { app, productSource };
}

const ids = (list: { id: string }[]) => list.map((product) => product.id);

afterEach(() => {
  vi.restoreAllMocks();
});

describe('GET /api/products/featured', () => {
  it('returns the featured products from config', async () => {
    const response = await request(setup().app).get('/api/products/featured');

    expect(response.status).toBe(200);
    expect(ids(response.body)).toEqual(testConfig.featuredProductIds);
  });
});

describe('GET /api/products', () => {
  it('returns only the products that match the search term', async () => {
    const response = await request(setup().app).get('/api/products').query({ search: 'jacket' });

    expect(response.status).toBe(200);
    expect(ids(response.body)).toEqual(['4']);
  });

  it('returns every product when there is no search term', async () => {
    const response = await request(setup().app).get('/api/products');
    expect(response.body).toHaveLength(products.length);
  });

  it('rejects a blank search term', async () => {
    const response = await request(setup().app).get('/api/products').query({ search: '   ' });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_INPUT');
  });
});

describe('GET /api/products/:id', () => {
  it('returns the product', async () => {
    const response = await request(setup().app).get('/api/products/2');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ id: '2', title: 'Monitor' });
  });

  it('returns 404 for an unknown product', async () => {
    const response = await request(setup().app).get('/api/products/999');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: { code: 'NOT_FOUND', message: 'Product not found' } });
  });
});

describe('GET /api/categories', () => {
  it('returns the categories with their slugs', async () => {
    const response = await request(setup().app).get('/api/categories');

    expect(response.body).toEqual([
      { slug: 'electronics', name: 'electronics' },
      { slug: 'mens-clothing', name: "men's clothing" },
    ]);
  });
});

describe('GET /api/categories/:slug', () => {
  it('returns top rated products and the other products separately', async () => {
    const response = await request(setup().app).get('/api/categories/electronics');

    expect(response.status).toBe(200);
    expect(response.body.category).toEqual({ slug: 'electronics', name: 'electronics' });
    expect(ids(response.body.topRated)).toEqual(['2', '3']);
    expect(ids(response.body.others)).toEqual(['1']);
  });

  it('returns 404 for an unknown category', async () => {
    const response = await request(setup().app).get('/api/categories/toys');
    expect(response.status).toBe(404);
  });
});

describe('error handling', () => {
  it('returns 502 when the product source fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const { app, productSource } = setup();
    productSource.failWith = new UpstreamError('The product catalogue is temporarily unavailable');

    const response = await request(app).get('/api/products/featured');

    expect(response.status).toBe(502);
    expect(response.body.error.code).toBe('UPSTREAM_ERROR');
  });

  it('returns 500 with a generic message for an unexpected error', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const { app, productSource } = setup();
    productSource.failWith = new Error('secret internal detail');

    const response = await request(app).get('/api/products/featured');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } });
  });

  it('returns 404 in the standard error shape for an unknown route', async () => {
    const response = await request(setup().app).get('/api/nope');
    expect(response.body).toEqual({ error: { code: 'NOT_FOUND', message: 'Route not found' } });
  });
});

describe('GET /health', () => {
  it('reports ok', async () => {
    const response = await request(setup().app).get('/health');
    expect(response.body).toEqual({ status: 'ok' });
  });
});
