import Link from "next/link";
import CuratorialText from "@/components/CuratorialText";
import ReadingTracker from "@/components/ReadingTracker";
import texts from "@/data/texts.json";
import type { TextsByPage } from "@/server/types";

const catalog = texts as TextsByPage;
const pageId = "object-01";
const page = catalog[pageId];

export default function SeeSawPage() {
  return (
    <main className="guide-shell see-saw-surface">
      <ReadingTracker pageId={pageId} />
      <article className="guide-page">
        <header className="guide-header">
          <Link href="/" className="department" style={{ textDecoration: "none" }}>
            Industrial Design Permanent Exhibition
          </Link>
        </header>

        <section className="object-meta" aria-labelledby="object-title">
          <div className="object-identity">
            <div className="object-number">{page.objectNo}</div>
            <h1 className="object-title" id="object-title">
              {page.title}
            </h1>
            <dl className="meta-row">
              <dt>Designer</dt>
              <dd>{page.author}</dd>
              <dt>Course</dt>
              <dd>
                {page.year} {page.course}
              </dd>
              <dt>Material</dt>
              <dd>{page.material}</dd>
            </dl>
          </div>
          <p className="summary">{page.summary}</p>
        </section>

        <CuratorialText blocks={page.blocks} />

        <footer className="guide-footer">
          <div>Department of Industrial Design</div>
          <div>KAIST</div>
        </footer>
      </article>
    </main>
  );
}
