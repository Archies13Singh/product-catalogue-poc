import { useParams } from 'react-router-dom';
import { getCategoryPage } from '../api/catalogue';
import { AsyncView } from '../components/AsyncView';
import { ProductGrid } from '../components/ProductGrid';
import { useAsync } from '../hooks/useAsync';
import { SITE_NAME } from '../siteConfig';
import { NotFoundPage } from './NotFoundPage';

export function CategoryPage() {
  const { slug = '' } = useParams();
  const { state, retry } = useAsync(() => getCategoryPage(slug), [slug]);

  return (
    <AsyncView state={state} retry={retry} notFound={<NotFoundPage what="category" />}>
      {({ category, topRated, others }) => (
        <>
          <title>{`${category.name} | ${SITE_NAME}`}</title>
          <h1 className="capitalize">{category.name}</h1>
          <section className="section" aria-labelledby="top-rated-heading">
            <h2 id="top-rated-heading">Top rated</h2>
            <ProductGrid products={topRated} />
          </section>
          {others.length > 0 && (
            <section className="section" aria-labelledby="more-heading">
              <h2 id="more-heading">More in this category</h2>
              <ProductGrid products={others} />
            </section>
          )}
        </>
      )}
    </AsyncView>
  );
}
