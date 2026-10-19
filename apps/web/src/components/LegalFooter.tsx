import { Link } from 'react-router-dom';
import { LEGAL_PAGES } from '../lib/legalIndex';

export function LegalFooter({ className = 'hero-links legal-strip' }: { className?: string }) {
  return (
    <nav className={className} aria-label="Policies">
      {LEGAL_PAGES.map((page) => (
        <Link key={page.slug} to={`/${page.slug}`}>
          {page.shortTitle}
        </Link>
      ))}
    </nav>
  );
}
