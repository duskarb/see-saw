import TextLandscape from "@/components/TextLandscape";

export default function DisplayPage() {
  return (
    <main className="display-page">
      <div className="display-mark" style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.1em", opacity: 0.6 }}>
        Reading Index / Live Exhibition Text
      </div>
      <TextLandscape />
    </main>
  );
}
