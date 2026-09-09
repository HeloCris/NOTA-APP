const families = ["Todos", "Cítrico", "Amadeirado", "Floral", "Oriental", "Fougère", "Aquático", "Gourmand"];

interface OlfactoryFilterChipsProps {
  value: string;
  onChange: (family: string) => void;
}

export function OlfactoryFilterChips({ value, onChange }: OlfactoryFilterChipsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Família olfativa">
      {families.map((family) => {
        const selected = (value || "Todos") === family;
        return (
          <button
            key={family}
            type="button"
            onClick={() => onChange(family === "Todos" ? "" : family)}
            aria-pressed={selected}
            className={`whitespace-nowrap rounded-full border px-4 py-2 text-xs font-bold transition ${selected ? "border-[#354B5E] bg-[#354B5E] text-white" : "border-[#D8D4C8] bg-white text-[#5A6067] hover:border-[#A79876]"}`}
          >
            {family}
          </button>
        );
      })}
    </div>
  );
}
