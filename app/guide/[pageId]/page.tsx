import { notFound } from "next/navigation";
import CuratorialText from "@/components/CuratorialText";
import ReadingTracker from "@/components/ReadingTracker";
import texts from "@/data/texts.json";
import type { TextsByPage } from "@/server/types";

const catalog = texts as TextsByPage;

type Props = {
  params: Promise<{
    pageId: string;
  }>;
};

export default async function GuidePage({ params }: Props) {
  const { pageId } = await params;
  const page = catalog[pageId];

  if (!page) notFound();

  return (
    <main className="guide-shell">
      <ReadingTracker pageId={pageId} />
      <article className="guide-page">
        <header className="guide-header">
          <div className="department">Industrial Design Permanent Exhibition</div>
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
