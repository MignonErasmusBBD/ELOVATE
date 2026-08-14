type DashboardRecommendationsProps = {
  recommendations: string[];
};

export function DashboardRecommendations({
  recommendations,
}: DashboardRecommendationsProps) {
  return (
    <section
      aria-labelledby="dashboard-recommendations-heading"
      className="rounded-xl border border-ink/15 bg-ink/5 p-5"
    >
      <h3
        id="dashboard-recommendations-heading"
        className="text-base font-bold text-ink"
      >
        Recommendations
      </h3>
      {recommendations.length === 0 ? (
        <p className="mt-2 text-sm text-text-secondary">
          No recommendations yet.
        </p>
      ) : (
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-text-secondary">
          {recommendations.map((recommendation) => (
            <li key={recommendation}>{recommendation}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
