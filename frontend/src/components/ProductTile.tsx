import { Link } from 'react-router-dom';
import type { Product } from '../api/types';
import { formatPrice } from '../format';
import styles from './ProductTile.module.css';
import { Rating } from './Rating';

/** A product summary that links to the product's details page. */
export function ProductTile({ product }: { product: Product }) {
  return (
    <Link to={`/products/${product.id}`} className={styles.tile}>
      <img src={product.imageUrl} alt="" loading="lazy" className={styles.image} />
      <span className={styles.title}>{product.title}</span>
      <Rating rating={product.rating} />
      <span className={styles.price}>{formatPrice(product.price)}</span>
    </Link>
  );
}
