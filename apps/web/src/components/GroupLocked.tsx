import { Link } from 'react-router-dom';
import { DiscoverLink } from './DiscoverLink';
import { LegalFooter } from './LegalFooter';
import { MarketingLayout, useFormTheme } from './MarketingLayout';
import { ThemeToggle } from './ThemeToggle';
import { SITE_NAME } from '../lib/constants';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

type GroupLockedProps = {
  groupName: string;
  /** Set when the lookup failed for a reason other than access; offers a retry. */
  loadError?: string | null;
  onRetry?: () => void;
};

export function GroupLocked({ groupName, loadError, onRetry }: GroupLockedProps) {
  useDocumentTitle(loadError ? 'Group unavailable' : 'Private group', {
    noindex: true,
  });
  const formTheme = useFormTheme();
  const trimmed = groupName.trim();
  const loginHref = trimmed
    ? `/login?name=${encodeURIComponent(trimmed)}`
    : '/login';

  return (
    <MarketingLayout
      topLeft={
        <Link className="hero-back" to="/">
          ← Home
        </Link>
      }
      topRight={
        <>
          <DiscoverLink />
          <ThemeToggle />
        </>
      }
    >
      <div className="hero-col hero-stagger">
        <span className="hero-brand">{SITE_NAME}</span>

        <div className={formTheme}>
          <div className="hero-card glk-card">
            <span className="glk-badge" aria-hidden>
              <svg viewBox="0 0 24 24" width="26" height="26" fill="none">
                <path
                  d="M7 10V7a5 5 0 0 1 10 0v3"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <rect
                  x="4"
                  y="10"
                  width="16"
                  height="11"
                  rx="2.5"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <circle cx="12" cy="15.5" r="1.6" fill="currentColor" />
              </svg>
            </span>

            {loadError ? (
              <>
                <h1>Could not load this group</h1>
                <p className="hero-card-lead">
                  Something went wrong reaching the server, so we cannot tell whether{' '}
                  <strong>{trimmed || 'this group'}</strong> is public. It is usually worth another
                  go.
                </p>
                <p className="glk-detail">{loadError}</p>
              </>
            ) : (
              <>
                <h1>This group is private</h1>
                <p className="hero-card-lead">
                  <strong>{trimmed || 'That group'}</strong> has not made its page public — or there
                  is no group by that name. Either way there is nothing here to show.
                </p>
                <p className="glk-detail">
                  Only a group can publish its own page, from Settings → Visibility. We cannot do it
                  for them.
                </p>
              </>
            )}

            <div className="glk-actions">
              {loadError && onRetry ? (
                <button type="button" className="glk-btn glk-btn--primary" onClick={onRetry}>
                  Try again
                </button>
              ) : (
                <Link className="glk-btn glk-btn--primary" to={loginHref}>
                  This is my group — log in
                </Link>
              )}
              <Link className="glk-btn" to="/discover">
                Browse public groups
              </Link>
            </div>

            <p className="glk-foot">
              No group yet? <Link to="/get-started">Create one</Link> — it takes about a minute.
            </p>
          </div>
        </div>

        <LegalFooter />
      </div>
    </MarketingLayout>
  );
}
