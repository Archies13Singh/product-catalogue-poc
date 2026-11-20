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

  // Where enquiries are sent, and the address they are sent from.
  SALES_INBOX_EMAIL: z.email().default('sales@example.com'),
  MAIL_FROM: z.email().default('no-reply@example.com'),
  // Defaults point at Mailpit, the local mail catcher. See README.
  SMTP_HOST: z.string().min(1).default('localhost'),
  SMTP_PORT: z.coerce.number().int().positive().default(1025),
  // Only needed for a real mail provider. Mailpit accepts mail without a login.
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  // Enquiries allowed per client in each 15 minute window.
  ENQUIRY_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(5),
});

export interface Config {
  port: number;
  fakeStoreBaseUrl: string;
  productCacheTtlSeconds: number;
  featuredProductIds: string[];
  categoryTopRatedCount: number;
  salesInboxEmail: string;
  mailFrom: string;
  smtp: {
    host: string;
    port: number;
    user?: string;
    password?: string;
  };
  enquiryRateLimitMax: number;
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
    salesInboxEmail: values.SALES_INBOX_EMAIL,
    mailFrom: values.MAIL_FROM,
    smtp: {
      host: values.SMTP_HOST,
      port: values.SMTP_PORT,
      // An empty value in .env means "not set".
      user: values.SMTP_USER || undefined,
      password: values.SMTP_PASSWORD || undefined,
    },
    enquiryRateLimitMax: values.ENQUIRY_RATE_LIMIT_MAX,
  };
}
