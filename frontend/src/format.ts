import { CURRENCY, LOCALE } from './siteConfig';

const priceFormatter = new Intl.NumberFormat(LOCALE, { style: 'currency', currency: CURRENCY });

export function formatPrice(price: number): string {
  return priceFormatter.format(price);
}
