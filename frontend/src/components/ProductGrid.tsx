import type { Product } from '../api/types';
import styles from './ProductGrid.module.css';
import { ProductTile } from './ProductTile';

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <ul className={styles.grid}>
      {products.map((product) => (
        <li key={product.id}>
          <ProductTile product={product} />
        </li>
      ))}
    </ul>
  );
}
