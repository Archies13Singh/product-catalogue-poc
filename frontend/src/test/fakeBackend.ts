import { vi } from 'vitest';
import type { Product } from '../api/types';

export function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: '1',
    title: 'Test product',
    description: 'A product used in tests',
    price: 10,
    category: { slug: 'electronics', name: 'electronics' },
    imageUrl: 'https://example.com/image.png',
    rating: { score: 4, count: 100 },
    ...overrides,
  };
}

interface FakeResponse {
  status?: number;
  body: unknown;
}

type Handler = (request: { url: string; method: string; body: unknown }) => FakeResponse;

/**
 * Replaces `fetch` so tests run without a backend. Tests go through the real API module,
 * which also checks the URLs and bodies the frontend sends.
 */
export function stubBackend(handler: Handler) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const { status = 200, body } = handler({
      url: String(input),
      method: init?.method ?? 'GET',
      body: typeof init?.body === 'string' ? JSON.parse(init.body) : undefined,
    });
    return new Response(JSON.stringify(body), { status });
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

export function errorBody(code: string, message: string) {
  return { error: { code, message } };
}
