import type { Product } from '../api/types';
import styles from './Rating.module.css';

export function Rating({ rating }: { rating: Product['rating'] }) {
  return (
    <span
      className={styles.rating}
      aria-label={`Rated ${rating.score} out of 5 from ${rating.count} ratings`}
    >
      <span aria-hidden="true" className={styles.star}>
        ★
      </span>
      <span aria-hidden="true">
        {rating.score.toFixed(1)} ({rating.count})
      </span>
    </span>
  );
}
