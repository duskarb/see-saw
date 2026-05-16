import Link from "next/link";
import texts from "@/data/texts.json";
import type { TextsByPage } from "@/server/types";

const catalog = texts as TextsByPage;

export default function Home() {
  const pages = Object.entries(catalog);

  return (
    <main className="guide-shell">
      <div className="guide-page">
        <header className="guide-header">
          <div className="department">Department of Industrial Design</div>
        </header>
        <section className="object-meta">
          <div className="object-identity">
            <div className="object-number">Exhibition System</div>
            <h1 className="object-title">KAIST Industrial Design Exhibition Guide</h1>
          </div>
          <p className="summary">Official guide and local entry points for the exhibition labels.</p>
        </section>
        <nav className="route-list" aria-label="Exhibition pages">
          {pages.map(([pageId, page]) => (
            <Link href={`/guide/${pageId}`} key={pageId}>
              <span>{page.title}</span>
              <small>{page.year} {page.course}</small>
            </Link>
          ))}
          <Link href="/see-saw">
            <span>Mobile Surface Test</span>
            <small>Internal use</small>
          </Link>
          <Link href="/display">
            <span>Live Exhibition Text Display</span>
            <small>Dashboard</small>
          </Link>
        </nav>
        <footer className="guide-footer" style={{ marginTop: '4rem', opacity: 0.5, fontSize: '0.75rem', textAlign: 'center' }}>
          Altered Seeing / &lt;see-saw&gt;
        </footer>
      </div>
    </main>
  );
}
