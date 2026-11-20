import { describe, expect, it } from 'vitest';
import { toCategory } from './product';

describe('toCategory', () => {
  it('makes a URL-safe slug and keeps the display name', () => {
    expect(toCategory("men's clothing")).toEqual({ slug: 'mens-clothing', name: "men's clothing" });
    expect(toCategory('electronics')).toEqual({ slug: 'electronics', name: 'electronics' });
  });
});
