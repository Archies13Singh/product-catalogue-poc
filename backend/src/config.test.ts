import { describe, expect, it } from 'vitest';
import { loadConfig } from './config';

describe('loadConfig', () => {
  it('uses defaults when nothing is set', () => {
    const config = loadConfig({});
    expect(config.port).toBe(3000);
    expect(config.featuredProductIds).toHaveLength(5);
  });

  it('reads the featured product IDs from a comma-separated list', () => {
    expect(loadConfig({ FEATURED_PRODUCT_IDS: '2, 4,6' }).featuredProductIds).toEqual(['2', '4', '6']);
  });

  it('fails with a message that names the invalid setting', () => {
    expect(() => loadConfig({ PORT: 'abc' })).toThrow(/PORT/);
  });
});
