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
          <div className="department">Industrial Design Permanent Exhibition</div>
        </header>
        <section className="object-meta">
          <div className="object-identity">
            <div className="object-number">Prototype routes</div>
            <h1 className="object-title">Altered Seeing / &lt;see-saw&gt;</h1>
          </div>
          <p className="summary">Local entry points prepared from the exhibition labels.</p>
        </section>
        <nav className="route-list" aria-label="Prototype pages">
          <Link href="/see-saw">
            <span>Altered Seeing / &lt;see-saw&gt;</span>
            <small>Mobile surface</small>
          </Link>
          <Link href="/display">
            <span>&lt;see-saw&gt;</span>
            <small>Exhibition display</small>
          </Link>
          {pages.map(([pageId, page]) => (
            <Link href={`/guide/${pageId}`} key={pageId}>
              <span>{page.title}</span>
              <small>{page.year} {page.course}</small>
            </Link>
          ))}
        </nav>
      </div>
    </main>
  );
}
