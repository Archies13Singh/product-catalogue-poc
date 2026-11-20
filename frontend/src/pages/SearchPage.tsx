import { Navigate, useSearchParams } from 'react-router-dom';
import { searchProducts } from '../api/catalogue';
import { AsyncView } from '../components/AsyncView';
import { ProductGrid } from '../components/ProductGrid';
import { useAsync } from '../hooks/useAsync';
import { SITE_NAME } from '../siteConfig';

export function SearchPage() {
  const [searchParams] = useSearchParams();
  const term = (searchParams.get('q') ?? '').trim();

  // A search with no term is the whole catalogue, which lives at /products.
  if (!term) {
    return <Navigate to="/products" replace />;
  }

  return (
    <>
      <title>{`Search | ${SITE_NAME}`}</title>
      <SearchResults term={term} />
    </>
  );
}

function SearchResults({ term }: { term: string }) {
  const { state, retry } = useAsync(() => searchProducts(term), [term]);

  return (
    <>
      <h1>Results for “{term}”</h1>
      <AsyncView state={state} retry={retry}>
        {(products) =>
          products.length > 0 ? (
            <>
              <p className="muted">
                {products.length} {products.length === 1 ? 'product' : 'products'} found
              </p>
              <ProductGrid products={products} />
            </>
          ) : (
            <p className="message">No products found for “{term}”.</p>
          )
        }
      </AsyncView>
    </>
  );
}
