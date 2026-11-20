import { request } from './client';
import type { Category, CategoryPage, Product } from './types';

export function getFeaturedProducts(): Promise<Product[]> {
  return request('/products/featured');
}

export function getCategories(): Promise<Category[]> {
  return request('/categories');
}

export function getCategoryPage(slug: string): Promise<CategoryPage> {
  return request(`/categories/${encodeURIComponent(slug)}`);
}

export function searchProducts(term: string): Promise<Product[]> {
  return request(`/products?search=${encodeURIComponent(term)}`);
}

export function getProduct(id: string): Promise<Product> {
  return request(`/products/${encodeURIComponent(id)}`);
}
