import { z } from 'zod';

const commaSeparatedList = z
  .string()
  .transform((value) => value.split(',').map((item) => item.trim()).filter(Boolean));

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  FAKE_STORE_BASE_URL: z.url().default('https://fakestoreapi.com'),
  PRODUCT_CACHE_TTL_SECONDS: z.coerce.number().int().nonnegative().default(60),
  // The products the business has chosen to feature on the home page.
  FEATURED_PRODUCT_IDS: commaSeparatedList.default(['3', '5', '11', '12', '18']),
  CATEGORY_TOP_RATED_COUNT: z.coerce.number().int().positive().default(3),
});

export interface Config {
  port: number;
  fakeStoreBaseUrl: string;
  productCacheTtlSeconds: number;
  featuredProductIds: string[];
  categoryTopRatedCount: number;
}

/** Reads and validates configuration. Throws with a readable message if it is invalid. */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const result = envSchema.safeParse(env);
  if (!result.success) {
    throw new Error(`Invalid configuration:\n${z.prettifyError(result.error)}`);
  }
  const values = result.data;
  return {
    port: values.PORT,
    fakeStoreBaseUrl: values.FAKE_STORE_BASE_URL,
    productCacheTtlSeconds: values.PRODUCT_CACHE_TTL_SECONDS,
    featuredProductIds: values.FEATURED_PRODUCT_IDS,
    categoryTopRatedCount: values.CATEGORY_TOP_RATED_COUNT,
  };
}
