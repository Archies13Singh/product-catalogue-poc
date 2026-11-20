import { useSearchParams } from 'react-router-dom';
import { listProducts, searchProducts } from '../api/catalogue';
import { AsyncView } from '../components/AsyncView';
import { ProductGrid } from '../components/ProductGrid';
import { useAsync } from '../hooks/useAsync';
import { SITE_NAME } from '../siteConfig';

export function SearchPage() {
  const [searchParams] = useSearchParams();
  const term = (searchParams.get('q') ?? '').trim();

  return (
    <>
      <title>{`Search | ${SITE_NAME}`}</title>
      {term ? <SearchResults term={term} /> : <AllProducts />}
    </>
  );
}

/** Shown when the search is empty: clearing the search lists the whole catalogue again. */
function AllProducts() {
  const { state, retry } = useAsync(listProducts, []);

  return (
    <>
      <h1>All products</h1>
      <AsyncView state={state} retry={retry}>
        {(products) => <ProductGrid products={products} />}
      </AsyncView>
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
