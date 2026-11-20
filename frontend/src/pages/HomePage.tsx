import { getFeaturedProducts } from '../api/catalogue';
import { AsyncView } from '../components/AsyncView';
import { ProductGrid } from '../components/ProductGrid';
import { useAsync } from '../hooks/useAsync';
import { SITE_NAME } from '../siteConfig';

export function HomePage() {
  const { state, retry } = useAsync(getFeaturedProducts, []);

  return (
    <>
      <title>{SITE_NAME}</title>
      <h1>Top rated products</h1>
      <AsyncView state={state} retry={retry}>
        {(products) =>
          products.length > 0 ? (
            <ProductGrid products={products} />
          ) : (
            <p className="message">There are no featured products at the moment.</p>
          )
        }
      </AsyncView>
    </>
  );
}
