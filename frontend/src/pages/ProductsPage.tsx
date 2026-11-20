import { listProducts } from '../api/catalogue';
import { AsyncView } from '../components/AsyncView';
import { ProductGrid } from '../components/ProductGrid';
import { useAsync } from '../hooks/useAsync';
import { SITE_NAME } from '../siteConfig';

/** The whole catalogue. Clearing the search and submitting brings the customer here. */
export function ProductsPage() {
  const { state, retry } = useAsync(listProducts, []);

  return (
    <>
      <title>{`All products | ${SITE_NAME}`}</title>
      <h1>All products</h1>
      <AsyncView state={state} retry={retry}>
        {(products) => <ProductGrid products={products} />}
      </AsyncView>
    </>
  );
}
