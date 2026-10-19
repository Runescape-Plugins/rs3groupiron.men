import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ThemeToggle } from '../components/ThemeToggle';
import { useResolvedTheme, useUiPrefs } from '../hooks/useUiPrefs';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { DISCORD_URL, SITE_NAME } from '../lib/constants';
import { legalDoc, type LegalBlock } from '../lib/legal';
import {
  LEGAL_CONTACT,
  LEGAL_PAGES,
  LEGAL_UPDATED,
  type LegalSlug,
} from '../lib/legalIndex';
import '../styles/hero.css';
import '../styles/legal.css';

function Blocks({ blocks }: { blocks: LegalBlock[] }) {
  return (
    <>
      {blocks.map((block, i) => {
        if (block.kind === 'p') {
          return (
            <p key={i} className="legal-p">
              {block.text}
            </p>
          );
        }
        if (block.kind === 'list') {
          return (
            <ul key={i} className="legal-list">
              {block.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          );
        }
        if (block.kind === 'defs') {
          return (
            <dl key={i} className="legal-defs">
              {block.items.map((item) => (
                <div key={item.term} className="legal-def">
                  <dt>{item.term}</dt>
                  <dd>{item.text}</dd>
                </div>
              ))}
            </dl>
          );
        }
        return (
          <div key={i} className="legal-table-wrap">
            <table className="legal-table">
              <thead>
                <tr>
                  {block.head.map((cell) => (
                    <th key={cell} scope="col">
                      {cell}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row, r) => (
                  <tr key={r}>
                    {row.map((cell, c) =>
                      c === 0 ? (
                        <th key={c} scope="row">
                          {cell}
                        </th>
                      ) : (
                        <td key={c}>{cell}</td>
                      ),
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </>
  );
}

export function LegalPage({ slug }: { slug: LegalSlug }) {
  const doc = legalDoc(slug);
  useDocumentTitle(doc.title, {
    canonicalPath: `/${doc.slug}`,
    description: doc.description,
  });
  const { prefs } = useUiPrefs();
  const theme = useResolvedTheme(prefs.themePref) === 'light' ? 'theme-light' : 'theme-dark';

  // This page is lazy-loaded, so on a cold hit of /privacy#security the browser
  // has already run its own hash scroll against a document that did not contain
  // the section yet. Deep links from the plugin description depend on this.
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.replace('#', ''));
    const target = id ? document.getElementById(id) : null;
    if (target) target.scrollIntoView();
    else window.scrollTo(0, 0);
  }, [slug]);

  return (
    <div className={`legal ${theme}`}>
      <header className="legal-top">
        <Link className="legal-back" to="/">
          ← {SITE_NAME}
        </Link>
        <ThemeToggle />
      </header>

      <main className="legal-main">
        <article className="legal-doc">
          <h1 className="legal-title">{doc.title}</h1>
          <p className="legal-updated">Last updated {LEGAL_UPDATED}</p>
          <p className="legal-lead">{doc.lead}</p>

          <nav className="legal-toc" aria-label="On this page">
            <ol>
              {doc.sections.map((section) => (
                <li key={section.id}>
                  <a href={`#${section.id}`}>{section.heading}</a>
                </li>
              ))}
            </ol>
          </nav>

          {doc.sections.map((section) => (
            <section key={section.id} id={section.id} className="legal-section">
              <h2 className="legal-heading">
                {section.heading}
                <a
                  className="legal-anchor"
                  href={`#${section.id}`}
                  aria-label={`Link to “${section.heading}”`}
                >
                  #
                </a>
              </h2>
              <Blocks blocks={section.blocks} />
            </section>
          ))}
        </article>

        <nav className="legal-siblings" aria-label="Other policies">
          {LEGAL_PAGES.filter((other) => other.slug !== doc.slug).map((other) => (
            <Link key={other.slug} className="legal-sibling" to={`/${other.slug}`}>
              <strong>{other.title}</strong>
              <em>{other.description}</em>
            </Link>
          ))}
        </nav>

        <footer className="legal-foot">
          <span>
            Questions about your data? <a href={`mailto:${LEGAL_CONTACT.email}`}>{LEGAL_CONTACT.email}</a>
          </span>
          <a href={DISCORD_URL} target="_blank" rel="noopener noreferrer">
            Discord ↗
          </a>
        </footer>
      </main>
    </div>
  );
}
