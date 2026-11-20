import { Link, NavLink, Outlet } from 'react-router-dom';
import { getCategories } from '../api/catalogue';
import { useAsync } from '../hooks/useAsync';
import { SITE_NAME } from '../siteConfig';
import styles from './Layout.module.css';
import { SearchBar } from './SearchBar';

/** The header shown on every page: site name, search and category links. */
export function Layout() {
  const { state } = useAsync(getCategories, []);
  // If the categories fail to load, the header simply has no category links. Each page
  // reports its own errors, so one failed request does not take the whole site down.
  const categories = state.status === 'success' ? state.data : [];

  return (
    <>
      <header className={styles.header}>
        <div className={styles.bar}>
          <Link to="/" className={styles.brand}>
            {SITE_NAME}
          </Link>
          <SearchBar />
        </div>
        <nav aria-label="Categories" className={styles.nav}>
          {categories.map((category) => (
            <NavLink
              key={category.slug}
              to={`/category/${category.slug}`}
              className={({ isActive }) => (isActive ? `${styles.link} ${styles.active}` : styles.link)}
            >
              {category.name}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
    </>
  );
}
