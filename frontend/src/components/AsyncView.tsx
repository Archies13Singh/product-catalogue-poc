import type { ReactNode } from 'react';
import { ApiError } from '../api/client';
import type { AsyncState } from '../hooks/useAsync';

interface Props<T> {
  state: AsyncState<T>;
  retry: () => void;
  /** Shown when the backend answers 404. Without it, a 404 is shown like any other error. */
  notFound?: ReactNode;
  children: (data: T) => ReactNode;
}

/** Shows the loading, error or loaded view of a request, so every page handles them the same way. */
export function AsyncView<T>({ state, retry, notFound, children }: Props<T>) {
  if (state.status === 'loading') {
    return (
      <p role="status" className="muted">
        Loading…
      </p>
    );
  }

  if (state.status === 'error') {
    const { error } = state;
    if (notFound && error instanceof ApiError && error.status === 404) {
      return <>{notFound}</>;
    }
    return (
      <div role="alert" className="message message-error">
        <p>{error instanceof ApiError ? error.message : 'Something went wrong. Please try again.'}</p>
        <button type="button" className="button button-secondary" onClick={retry}>
          Try again
        </button>
      </div>
    );
  }

  return <>{children(state.data)}</>;
}
