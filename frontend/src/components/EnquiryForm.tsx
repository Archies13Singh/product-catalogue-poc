import { useState, type FormEvent } from 'react';
import { ApiError } from '../api/client';
import { submitEnquiry } from '../api/enquiries';
import type { Product } from '../api/types';
import styles from './EnquiryForm.module.css';

type Step = 'closed' | 'form' | 'sending' | 'sent';

interface Fields {
  name: string;
  email: string;
  phone: string;
  message: string;
}

type FieldErrors = Partial<Record<keyof Fields, string>>;

const emptyFields: Fields = { name: '', email: '', phone: '', message: '' };

// These mirror the backend's rules to give quick feedback. The backend validates again,
// because checks in the browser can be bypassed.
function validate(fields: Fields): FieldErrors {
  const errors: FieldErrors = {};
  if (!fields.name.trim()) errors.name = 'Enter your name.';
  if (!fields.email.trim()) errors.email = 'Enter your email address.';
  else if (!/^\S+@\S+\.\S+$/.test(fields.email.trim())) errors.email = 'Enter a valid email address.';
  if (!/^[0-9+()\-\s]*$/.test(fields.phone)) {
    errors.phone = 'A phone number may only contain digits, spaces and + - ( ).';
  }
  return errors;
}

/** The Enquire button, the contact form it opens, and the thank-you message after sending. */
export function EnquiryForm({ product }: { product: Product }) {
  const [step, setStep] = useState<Step>('closed');
  const [fields, setFields] = useState<Fields>(emptyFields);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (step === 'closed') {
    return (
      <button type="button" className="button" onClick={() => setStep('form')}>
        Enquire
      </button>
    );
  }

  if (step === 'sent') {
    return (
      <div role="status" className="message message-success">
        <h2>Thank you</h2>
        <p className={styles.lastLine}>
          Your enquiry about {product.title} has been sent. Our sales team will be in touch soon.
        </p>
      </div>
    );
  }

  function setField(name: keyof Fields, value: string) {
    setFields((current) => ({ ...current, [name]: value }));
    // Once the customer edits a field, its old error message no longer applies.
    setFieldErrors((current) => ({ ...current, [name]: undefined }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const errors = validate(fields);
    setFieldErrors(errors);
    setSubmitError(null);
    if (Object.keys(errors).length > 0) return;

    setStep('sending');
    try {
      await submitEnquiry({
        productId: product.id,
        name: fields.name.trim(),
        email: fields.email.trim(),
        phone: fields.phone.trim() || undefined,
        message: fields.message.trim() || undefined,
      });
      setStep('sent');
    } catch (error) {
      // Back to the form with everything the customer typed still in place.
      setStep('form');
      setSubmitError(
        error instanceof ApiError ? error.message : 'Your enquiry could not be sent. Please try again.',
      );
    }
  }

  const sending = step === 'sending';

  return (
    // noValidate: we show our own messages, so every browser behaves the same way.
    <form onSubmit={handleSubmit} noValidate className={styles.form} aria-labelledby="enquiry-heading">
      <h2 id="enquiry-heading">Enquire about this product</h2>

      <Field label="Name" name="name" error={fieldErrors.name}>
        {(props) => (
          <input
            {...props}
            type="text"
            autoComplete="name"
            autoFocus
            maxLength={100}
            value={fields.name}
            onChange={(event) => setField('name', event.target.value)}
          />
        )}
      </Field>

      <Field label="Email" name="email" error={fieldErrors.email}>
        {(props) => (
          <input
            {...props}
            type="email"
            autoComplete="email"
            maxLength={254}
            value={fields.email}
            onChange={(event) => setField('email', event.target.value)}
          />
        )}
      </Field>

      <Field label="Phone (optional)" name="phone" error={fieldErrors.phone}>
        {(props) => (
          <input
            {...props}
            type="tel"
            autoComplete="tel"
            maxLength={30}
            value={fields.phone}
            onChange={(event) => setField('phone', event.target.value)}
          />
        )}
      </Field>

      <Field label="Message (optional)" name="message" error={fieldErrors.message}>
        {(props) => (
          <textarea
            {...props}
            rows={4}
            maxLength={2000}
            value={fields.message}
            onChange={(event) => setField('message', event.target.value)}
          />
        )}
      </Field>

      {submitError && (
        <p role="alert" className="message message-error">
          {submitError}
        </p>
      )}

      <div className={styles.actions}>
        {/* Disabled while sending, so a double click cannot send two emails. */}
        <button type="submit" className="button" disabled={sending}>
          {sending ? 'Sending…' : 'Send enquiry'}
        </button>
        <button
          type="button"
          className="button button-secondary"
          disabled={sending}
          onClick={() => setStep('closed')}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

interface FieldProps {
  label: string;
  name: string;
  error?: string;
  /** Receives the attributes that connect the control to its label and error message. */
  children: (props: {
    id: string;
    name: string;
    className: string;
    'aria-invalid': boolean;
    'aria-describedby': string | undefined;
  }) => React.ReactNode;
}

function Field({ label, name, error, children }: FieldProps) {
  const id = `enquiry-${name}`;
  const errorId = `${id}-error`;
  return (
    <div className={styles.field}>
      <label htmlFor={id}>{label}</label>
      {children({
        id,
        name,
        className: 'input',
        'aria-invalid': Boolean(error),
        'aria-describedby': error ? errorId : undefined,
      })}
      {error && (
        <p id={errorId} className={styles.error}>
          {error}
        </p>
      )}
    </div>
  );
}
