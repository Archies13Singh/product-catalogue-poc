import { request } from './client';

export interface Enquiry {
  productId: string;
  name: string;
  email: string;
  phone?: string;
  message?: string;
}

/** Resolves once the backend has accepted the enquiry and emailed the sales inbox. */
export async function submitEnquiry(enquiry: Enquiry): Promise<void> {
  await request('/enquiries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(enquiry),
  });
}
