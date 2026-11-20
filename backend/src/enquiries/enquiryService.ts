import { z } from 'zod';
import { InvalidInputError, UpstreamError } from '../http/errors';
import type { ProductService } from '../products/productService';
import type { Mailer } from './mailer';

const singleLine = /^[^\r\n]*$/;

const enquirySchema = z.object({
  productId: z.string().trim().min(1).max(50),
  name: z.string().trim().min(1, 'Name is required').max(100).regex(singleLine),
  email: z.email('A valid email address is required').max(254),
  phone: z
    .string()
    .trim()
    .max(30)
    .regex(/^[0-9+()\-\s]*$/, 'Phone may only contain digits, spaces and + - ( )')
    .optional(),
  message: z.string().trim().max(2000).optional(),
});

interface Options {
  salesInboxEmail: string;
  mailFrom: string;
}

export class EnquiryService {
  constructor(
    private readonly productService: ProductService,
    private readonly mailer: Mailer,
    private readonly options: Options,
  ) {}

  /** Validates an enquiry and emails it to the sales inbox. */
  async submit(input: unknown): Promise<void> {
    const parsed = enquirySchema.safeParse(input);
    if (!parsed.success) {
      const problems = parsed.error.issues.map(
        (issue) => `${issue.path.join('.') || 'body'}: ${issue.message}`,
      );
      throw new InvalidInputError(`Invalid enquiry. ${problems.join('; ')}`);
    }
    const enquiry = parsed.data;

    // The product is looked up here, so the email never relies on a product name sent by
    // the browser. Throws NotFoundError if the product does not exist.
    const product = await this.productService.getProduct(enquiry.productId);

    const lines = [
      `Product:  ${product.title} (ID ${product.id})`,
      `Name:     ${enquiry.name}`,
      `Email:    ${enquiry.email}`,
    ];
    if (enquiry.phone) lines.push(`Phone:    ${enquiry.phone}`);
    if (enquiry.message) lines.push('', 'Message:', enquiry.message);

    try {
      await this.mailer.send({
        to: this.options.salesInboxEmail,
        from: this.options.mailFrom,
        replyTo: enquiry.email,
        subject: `New enquiry: ${product.title}`,
        text: lines.join('\n'),
      });
    } catch (cause) {
      throw new UpstreamError('Your enquiry could not be sent. Please try again.', { cause });
    }
  }
}
