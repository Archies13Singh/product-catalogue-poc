import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { errorBody, makeProduct, stubBackend } from '../test/fakeBackend';
import { EnquiryForm } from './EnquiryForm';

const product = makeProduct({ id: '3', title: 'Cotton Jacket' });

async function openForm() {
  const user = userEvent.setup();
  render(<EnquiryForm product={product} />);
  await user.click(screen.getByRole('button', { name: 'Enquire' }));
  return user;
}

async function fillIn(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Name'), 'Jane Smith');
  await user.type(screen.getByLabelText('Email'), 'jane@customer.test');
  await user.type(screen.getByLabelText('Phone (optional)'), '0400 000 000');
  await user.type(screen.getByLabelText('Message (optional)'), 'Do you have this in medium?');
}

describe('EnquiryForm', () => {
  it('shows only the Enquire button until it is clicked', async () => {
    render(<EnquiryForm product={product} />);
    expect(screen.queryByLabelText('Name')).not.toBeInTheDocument();

    await userEvent.setup().click(screen.getByRole('button', { name: 'Enquire' }));

    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('sends the enquiry and shows a thank-you message', async () => {
    const fetchMock = stubBackend(() => ({ status: 201, body: { status: 'received' } }));
    const user = await openForm();
    await fillIn(user);

    await user.click(screen.getByRole('button', { name: 'Send enquiry' }));

    expect(await screen.findByRole('heading', { name: 'Thank you' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Name')).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe('/api/enquiries');
    expect(init?.method).toBe('POST');
    expect(JSON.parse(String(init?.body))).toEqual({
      productId: '3',
      name: 'Jane Smith',
      email: 'jane@customer.test',
      phone: '0400 000 000',
      message: 'Do you have this in medium?',
    });
  });

  it('leaves out the optional fields when they are empty', async () => {
    const fetchMock = stubBackend(() => ({ status: 201, body: { status: 'received' } }));
    const user = await openForm();
    await user.type(screen.getByLabelText('Name'), 'Jane Smith');
    await user.type(screen.getByLabelText('Email'), 'jane@customer.test');

    await user.click(screen.getByRole('button', { name: 'Send enquiry' }));

    await screen.findByRole('heading', { name: 'Thank you' });
    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toEqual({
      productId: '3',
      name: 'Jane Smith',
      email: 'jane@customer.test',
    });
  });

  it('shows the error and keeps what was typed when sending fails', async () => {
    stubBackend(() => ({
      status: 502,
      body: errorBody('UPSTREAM_ERROR', 'Your enquiry could not be sent. Please try again.'),
    }));
    const user = await openForm();
    await fillIn(user);

    await user.click(screen.getByRole('button', { name: 'Send enquiry' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Your enquiry could not be sent');
    expect(screen.queryByRole('heading', { name: 'Thank you' })).not.toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toHaveValue('Jane Smith');
    expect(screen.getByLabelText('Message (optional)')).toHaveValue('Do you have this in medium?');
    expect(screen.getByRole('button', { name: 'Send enquiry' })).toBeEnabled();
  });

  it('does not send when required fields are missing', async () => {
    const fetchMock = stubBackend(() => ({ status: 201, body: {} }));
    const user = await openForm();

    await user.click(screen.getByRole('button', { name: 'Send enquiry' }));

    expect(screen.getByText('Enter your name.')).toBeInTheDocument();
    expect(screen.getByText('Enter your email address.')).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toBeInvalid();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('does not send when the email address is not valid', async () => {
    const fetchMock = stubBackend(() => ({ status: 201, body: {} }));
    const user = await openForm();
    await user.type(screen.getByLabelText('Name'), 'Jane Smith');
    await user.type(screen.getByLabelText('Email'), 'not-an-email');

    await user.click(screen.getByRole('button', { name: 'Send enquiry' }));

    expect(screen.getByText('Enter a valid email address.')).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('removes a field error as soon as that field is edited', async () => {
    stubBackend(() => ({ status: 201, body: {} }));
    const user = await openForm();
    await user.type(screen.getByLabelText('Name'), 'Jane Smith');
    await user.type(screen.getByLabelText('Email'), 'not-an-email');
    await user.click(screen.getByRole('button', { name: 'Send enquiry' }));
    expect(screen.getByText('Enter a valid email address.')).toBeInTheDocument();

    await user.type(screen.getByLabelText('Email'), '@customer.test');

    expect(screen.queryByText('Enter a valid email address.')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeValid();
  });

  it('disables the send button while the enquiry is being sent', async () => {
    let finish: () => void = () => {};
    const pending = new Promise<void>((resolve) => {
      finish = resolve;
    });
    const fetchMock = stubBackend(() => ({ status: 201, body: {} }));
    fetchMock.mockImplementationOnce(async () => {
      await pending;
      return new Response('{}', { status: 201 });
    });
    const user = await openForm();
    await fillIn(user);

    await user.click(screen.getByRole('button', { name: 'Send enquiry' }));

    expect(screen.getByRole('button', { name: 'Sending…' })).toBeDisabled();
    finish();
    expect(await screen.findByRole('heading', { name: 'Thank you' })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledOnce();
  });
});
