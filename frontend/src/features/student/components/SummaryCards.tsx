type SummaryCard = {
  label: string;
  value: string;
  sub?: string;
};

type SummaryCardsProps = {
  cards: SummaryCard[];
};

export function SummaryCards({ cards }: SummaryCardsProps) {
  return (
    <section
      aria-label="Summary statistics"
      className="grid grid-cols-1 gap-4 sm:grid-cols-3"
    >
      {cards.map((card) => (
        <article
          key={card.label}
          className="rounded-2xl border border-border-ui bg-surface p-5 shadow-[0_4px_16px_rgba(30,27,51,0.05)]"
        >
          <p className="text-sm font-medium text-text-secondary">{card.label}</p>
          <p className="mt-1 text-3xl font-bold tracking-tight text-ink">
            {card.value}
          </p>
          {card.sub !== undefined && (
            <p className="mt-0.5 text-xs text-text-secondary">{card.sub}</p>
          )}
        </article>
      ))}
    </section>
  );
}
