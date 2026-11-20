import { Link } from 'react-router-dom';
import { SITE_NAME } from '../siteConfig';

/** Shown for an unknown URL, and by pages whose product or category does not exist. */
export function NotFoundPage({ what = 'page' }: { what?: string }) {
  return (
    <>
      <title>{`Not found | ${SITE_NAME}`}</title>
      <h1>Not found</h1>
      <p>Sorry, we could not find that {what}.</p>
      <Link to="/">Back to the home page</Link>
    </>
  );
}
