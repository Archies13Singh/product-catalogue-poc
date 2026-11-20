import { Link, useParams } from 'react-router-dom';
import { getProduct } from '../api/catalogue';
import { AsyncView } from '../components/AsyncView';
import { EnquiryForm } from '../components/EnquiryForm';
import { Rating } from '../components/Rating';
import { formatPrice } from '../format';
import { useAsync } from '../hooks/useAsync';
import { SITE_NAME } from '../siteConfig';
import { NotFoundPage } from './NotFoundPage';
import styles from './ProductPage.module.css';

export function ProductPage() {
  const { id = '' } = useParams();
  const { state, retry } = useAsync(() => getProduct(id), [id]);

  return (
    <AsyncView state={state} retry={retry} notFound={<NotFoundPage what="product" />}>
      {(product) => (
        <article className={styles.product}>
          <title>{`${product.title} | ${SITE_NAME}`}</title>
          <img src={product.imageUrl} alt={product.title} className={styles.image} />
          <div>
            <Link to={`/category/${product.category.slug}`} className="capitalize">
              {product.category.name}
            </Link>
            <h1 className={styles.title}>{product.title}</h1>
            <Rating rating={product.rating} />
            <p className={styles.price}>{formatPrice(product.price)}</p>
            <p>{product.description}</p>
            {/* The key gives each product its own form, so nothing typed carries over. */}
            <EnquiryForm key={product.id} product={product} />
          </div>
        </article>
      )}
    </AsyncView>
  );
}
