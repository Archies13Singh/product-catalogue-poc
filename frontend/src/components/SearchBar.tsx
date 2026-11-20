import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styles from './SearchBar.module.css';

/** The search box and button. Submitting goes to the search page with the term in the URL. */
export function SearchBar() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const termInUrl = searchParams.get('q') ?? '';
  const [term, setTerm] = useState(termInUrl);
  const [showHint, setShowHint] = useState(false);

  // Keep the box in step with the URL, for example after the back button.
  useEffect(() => {
    setTerm(termInUrl);
  }, [termInUrl]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = term.trim();
    if (!trimmed) {
      setShowHint(true);
      return;
    }
    setShowHint(false);
    navigate(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <form role="search" onSubmit={handleSubmit} className={styles.form}>
      <label htmlFor="search-term" className={styles.label}>
        Search products
      </label>
      <input
        id="search-term"
        type="search"
        className="input"
        placeholder="Search products"
        maxLength={100}
        value={term}
        onChange={(event) => setTerm(event.target.value)}
        aria-describedby={showHint ? 'search-hint' : undefined}
      />
      <button type="submit" className="button">
        Search
      </button>
      {showHint && (
        <p id="search-hint" role="alert" className={styles.hint}>
          Enter a search term.
        </p>
      )}
    </form>
  );
}
