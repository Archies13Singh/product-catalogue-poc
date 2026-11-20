import { describe, expect, it, vi } from 'vitest';
import { UpstreamError } from '../http/errors';
import { FakeStoreSource } from './fakeStoreSource';

// The shape the real Fake Store API returns.
const fakeStoreProduct = {
  id: 7,
  title: 'White Gold Ring',
  price: 9.99,
  description: 'A ring',
  category: 'jewelery',
  image: 'https://fakestoreapi.com/img/ring.png',
  rating: { rate: 3, count: 400 },
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

function createSource(fetchFn: typeof fetch, cacheTtlSeconds = 60) {
  return new FakeStoreSource({ baseUrl: 'https://fake-store.test', cacheTtlSeconds, fetchFn });
}

describe('FakeStoreSource', () => {
  it('maps a Fake Store product to our Product model', async () => {
    const fetchFn = vi.fn(async () => jsonResponse([fakeStoreProduct]));

    const products = await createSource(fetchFn).listProducts();

    expect(fetchFn).toHaveBeenCalledWith('https://fake-store.test/products', expect.anything());
    expect(products).toEqual([
      {
        id: '7',
        title: 'White Gold Ring',
        description: 'A ring',
        price: 9.99,
        category: { slug: 'jewelery', name: 'jewelery' },
        imageUrl: 'https://fakestoreapi.com/img/ring.png',
        rating: { score: 3, count: 400 },
      },
    ]);
  });

  it('finds a product by ID and returns null for an unknown ID', async () => {
    const source = createSource(vi.fn(async () => jsonResponse([fakeStoreProduct])));

    expect((await source.getProduct('7'))?.title).toBe('White Gold Ring');
    expect(await source.getProduct('999')).toBeNull();
  });

  it('calls the API once while the cache is fresh', async () => {
    const fetchFn = vi.fn(async () => jsonResponse([fakeStoreProduct]));
    const source = createSource(fetchFn);

    await source.listProducts();
    await source.getProduct('7');

    expect(fetchFn).toHaveBeenCalledOnce();
  });

  it('calls the API again when the cache has expired', async () => {
    const fetchFn = vi.fn(async () => jsonResponse([fakeStoreProduct]));
    const source = createSource(fetchFn, 0);

    await source.listProducts();
    await source.listProducts();

    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it('throws UpstreamError when the API responds with an error status', async () => {
    const source = createSource(vi.fn(async () => jsonResponse({}, 500)));
    await expect(source.listProducts()).rejects.toBeInstanceOf(UpstreamError);
  });

  it('throws UpstreamError when the network call fails', async () => {
    const source = createSource(vi.fn(async () => Promise.reject(new Error('network down'))));
    await expect(source.listProducts()).rejects.toBeInstanceOf(UpstreamError);
  });

  it('throws UpstreamError when the API returns data in an unexpected shape', async () => {
    const source = createSource(vi.fn(async () => jsonResponse([{ id: 'not-a-number' }])));
    await expect(source.listProducts()).rejects.toBeInstanceOf(UpstreamError);
  });

  it('does not cache a failure', async () => {
    const fetchFn = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({}, 500))
      .mockResolvedValueOnce(jsonResponse([fakeStoreProduct]));
    const source = createSource(fetchFn);

    await expect(source.listProducts()).rejects.toBeInstanceOf(UpstreamError);
    expect(await source.listProducts()).toHaveLength(1);
  });
});
