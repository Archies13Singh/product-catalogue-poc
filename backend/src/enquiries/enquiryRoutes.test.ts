import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../app';
import { FakeMailer, FakeProductSource, makeProduct, testConfig } from '../test/fakes';

const validEnquiry = {
  productId: '3',
  name: 'Jane Smith',
  email: 'jane@customer.test',
  phone: '0400 000 000',
  message: 'Do you have this in medium?',
};

function setup() {
  const mailer = new FakeMailer();
  const productSource = new FakeProductSource([makeProduct({ id: '3', title: 'Cotton Jacket' })]);
  const app = createApp({ config: testConfig, productSource, mailer });
  return { app, mailer };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('POST /api/enquiries', () => {
  it('emails the enquiry to the sales inbox and responds 201', async () => {
    const { app, mailer } = setup();

    const response = await request(app).post('/api/enquiries').send(validEnquiry);

    expect(response.status).toBe(201);
    expect(mailer.sent).toHaveLength(1);
    expect(mailer.sent[0]).toMatchObject({
      to: 'sales@shop.test',
      from: 'no-reply@shop.test',
      replyTo: 'jane@customer.test',
      subject: 'New enquiry: Cotton Jacket',
    });
    const text = mailer.sent[0]?.text;
    expect(text).toContain('Cotton Jacket (ID 3)');
    expect(text).toContain('Jane Smith');
    expect(text).toContain('jane@customer.test');
    expect(text).toContain('0400 000 000');
    expect(text).toContain('Do you have this in medium?');
  });

  it('accepts an enquiry without the optional phone and message', async () => {
    const { app, mailer } = setup();
    const { productId, name, email } = validEnquiry;

    const response = await request(app).post('/api/enquiries').send({ productId, name, email });

    expect(response.status).toBe(201);
    expect(mailer.sent[0]?.text).not.toContain('Phone');
    expect(mailer.sent[0]?.text).not.toContain('Message');
  });

  it('takes the product title from the catalogue, not from the request', async () => {
    const { app, mailer } = setup();

    await request(app)
      .post('/api/enquiries')
      .send({ ...validEnquiry, title: 'Something else', productTitle: 'Something else' });

    expect(mailer.sent[0]?.subject).toBe('New enquiry: Cotton Jacket');
    expect(mailer.sent[0]?.text).not.toContain('Something else');
  });

  it.each([
    ['a missing name', { name: '' }],
    ['an invalid email address', { email: 'not-an-email' }],
    ['a missing product ID', { productId: undefined }],
    ['a name containing a line break', { name: 'Jane\nBcc: someone@else.test' }],
    ['a phone number with letters', { phone: 'call me' }],
    ['a message that is too long', { message: 'x'.repeat(2001) }],
  ])('rejects %s with 400 and sends no email', async (_case, override) => {
    const { app, mailer } = setup();

    const response = await request(app)
      .post('/api/enquiries')
      .send({ ...validEnquiry, ...override });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_INPUT');
    expect(mailer.sent).toHaveLength(0);
  });

  it('responds 404 and sends no email for an unknown product', async () => {
    const { app, mailer } = setup();

    const response = await request(app)
      .post('/api/enquiries')
      .send({ ...validEnquiry, productId: '999' });

    expect(response.status).toBe(404);
    expect(mailer.sent).toHaveLength(0);
  });

  it('responds 502 when the email cannot be sent', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const { app, mailer } = setup();
    mailer.failWith = new Error('SMTP connection refused');

    const response = await request(app).post('/api/enquiries').send(validEnquiry);

    expect(response.status).toBe(502);
    expect(response.body).toEqual({
      error: { code: 'UPSTREAM_ERROR', message: 'Your enquiry could not be sent. Please try again.' },
    });
  });

  it('responds 400 for a body that is not valid JSON', async () => {
    const { app, mailer } = setup();

    const response = await request(app)
      .post('/api/enquiries')
      .set('Content-Type', 'application/json')
      .send('{ not json');

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_INPUT');
    expect(mailer.sent).toHaveLength(0);
  });

  it('rejects a body over the size limit', async () => {
    const { app, mailer } = setup();

    const response = await request(app)
      .post('/api/enquiries')
      .send({ ...validEnquiry, message: 'x'.repeat(20_000) });

    expect(response.status).toBe(413);
    expect(mailer.sent).toHaveLength(0);
  });

  it('limits how many enquiries one client can send', async () => {
    const { app, mailer } = setup();
    for (let i = 0; i < testConfig.enquiryRateLimitMax; i++) {
      await request(app).post('/api/enquiries').send(validEnquiry).expect(201);
    }

    const response = await request(app).post('/api/enquiries').send(validEnquiry);

    expect(response.status).toBe(429);
    expect(response.body.error.code).toBe('TOO_MANY_REQUESTS');
    expect(mailer.sent).toHaveLength(testConfig.enquiryRateLimitMax);
  });
});
