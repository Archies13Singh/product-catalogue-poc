import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { App } from './App';
import { errorBody, makeProduct, stubBackend } from './test/fakeBackend';

const jacket = makeProduct({ id: '3', title: 'Cotton Jacket', description: 'A warm jacket' });
const monitor = makeProduct({ id: '7', title: 'Wide Monitor' });
const cable = makeProduct({ id: '8', title: 'USB Cable' });
const electronics = { slug: 'electronics', name: 'electronics' };

/** A stand-in for our backend, answering the same URLs with the same shapes. */
function stubCatalogue() {
  return stubBackend(({ url, method }) => {
    if (url === '/api/categories') return { body: [electronics] };
    if (url === '/api/products/featured') return { body: [jacket, monitor] };
    if (url === '/api/categories/electronics') {
      return { body: { category: electronics, topRated: [monitor], others: [cable] } };
    }
    if (url === '/api/products?search=jacket') return { body: [jacket] };
    if (url.startsWith('/api/products?search=')) return { body: [] };
    if (url === '/api/products/3') return { body: jacket };
    if (url === '/api/enquiries' && method === 'POST') return { status: 201, body: {} };
    return { status: 404, body: errorBody('NOT_FOUND', 'Product not found') };
  });
}

function renderAt(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
  return userEvent.setup();
}

const main = () => within(screen.getByRole('main'));

describe('Home page', () => {
  it('shows the featured products', async () => {
    stubCatalogue();
    renderAt('/');

    expect(await main().findByRole('link', { name: /Cotton Jacket/ })).toBeInTheDocument();
    expect(main().getByRole('link', { name: /Wide Monitor/ })).toBeInTheDocument();
    expect(main().getAllByRole('listitem')).toHaveLength(2);
  });

  it('shows an error with a retry button when the products cannot be loaded', async () => {
    stubBackend(({ url }) =>
      url === '/api/categories'
        ? { body: [] }
        : { status: 502, body: errorBody('UPSTREAM_ERROR', 'The product catalogue is temporarily unavailable') },
    );
    renderAt('/');

    expect(await screen.findByRole('alert')).toHaveTextContent('temporarily unavailable');
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });
});

describe('Category page', () => {
  it('opens from a category link and shows top rated and additional products', async () => {
    stubCatalogue();
    const user = renderAt('/');

    await user.click(await screen.findByRole('link', { name: 'electronics' }));

    const topRated = within(await screen.findByRole('region', { name: 'Top rated' }));
    expect(topRated.getByRole('link', { name: /Wide Monitor/ })).toBeInTheDocument();
    const more = within(screen.getByRole('region', { name: 'More in this category' }));
    expect(more.getByRole('link', { name: /USB Cable/ })).toBeInTheDocument();
  });
});

describe('Search', () => {
  it('shows only the matching products after the search button is clicked', async () => {
    const fetchMock = stubCatalogue();
    const user = renderAt('/');
    await main().findByRole('link', { name: /Wide Monitor/ });

    await user.type(screen.getByRole('searchbox', { name: 'Search products' }), 'jacket');
    await user.click(screen.getByRole('button', { name: 'Search' }));

    expect(await screen.findByRole('heading', { name: 'Results for “jacket”' })).toBeInTheDocument();
    expect(await main().findByRole('link', { name: /Cotton Jacket/ })).toBeInTheDocument();
    expect(main().queryByRole('link', { name: /Wide Monitor/ })).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith('/api/products?search=jacket', undefined);
  });

  it('says so when nothing matches', async () => {
    stubCatalogue();
    renderAt('/search?q=bicycle');

    expect(await screen.findByText('No products found for “bicycle”.')).toBeInTheDocument();
  });

  it('asks for a term and does not search when the box is empty', async () => {
    const fetchMock = stubCatalogue();
    const user = renderAt('/');
    await main().findByRole('link', { name: /Wide Monitor/ });
    const callsBefore = fetchMock.mock.calls.length;

    await user.click(screen.getByRole('button', { name: 'Search' }));

    expect(screen.getByText('Enter a search term.')).toBeInTheDocument();
    expect(fetchMock.mock.calls).toHaveLength(callsBefore);
  });
});

describe('Product page', () => {
  it('opens when a product tile is clicked and shows the details', async () => {
    stubCatalogue();
    const user = renderAt('/');

    await user.click(await main().findByRole('link', { name: /Cotton Jacket/ }));

    expect(await screen.findByRole('heading', { name: 'Cotton Jacket', level: 1 })).toBeInTheDocument();
    expect(screen.getByText('A warm jacket')).toBeInTheDocument();
    expect(screen.getByText('$10.00')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Enquire' })).toBeInTheDocument();
  });

  it('shows Not found for a product that does not exist', async () => {
    stubCatalogue();
    renderAt('/products/999');

    expect(await screen.findByRole('heading', { name: 'Not found' })).toBeInTheDocument();
  });
});

describe('Enquiry journey', () => {
  it('goes from the home page to a thank-you message', async () => {
    const fetchMock = stubCatalogue();
    const user = renderAt('/');

    await user.click(await main().findByRole('link', { name: /Cotton Jacket/ }));
    await user.click(await screen.findByRole('button', { name: 'Enquire' }));
    await user.type(screen.getByLabelText('Name'), 'Jane Smith');
    await user.type(screen.getByLabelText('Email'), 'jane@customer.test');
    await user.click(screen.getByRole('button', { name: 'Send enquiry' }));

    expect(await screen.findByRole('heading', { name: 'Thank you' })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith('/api/enquiries', expect.objectContaining({ method: 'POST' }));
  });
});
