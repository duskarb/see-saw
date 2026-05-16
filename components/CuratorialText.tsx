import type { TextBlock } from "@/server/types";

type Props = {
  blocks: TextBlock[];
};

export default function CuratorialText({ blocks }: Props) {
  return (
    <section className="curatorial-text" aria-labelledby="curatorial-text-title">
      <h2 className="section-label" id="curatorial-text-title">
        Curatorial Text
      </h2>
      {blocks.map((block) => (
        <p data-block-id={block.id} key={block.id}>
          <span>{block.text}</span>
        </p>
      ))}
    </section>
  );
}
