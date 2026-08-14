import type { DashboardMetric } from "../types";

type DashboardMetricsRowProps = {
  metrics: DashboardMetric[];
};

export function DashboardMetricsRow({ metrics }: DashboardMetricsRowProps) {
  return (
    <ul className="grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-3">
      {metrics.map((metric) => (
        <li key={metric.id}>
          <article
            className={`rounded-2xl border border-border-ui border-l-4 bg-surface px-4 py-5 text-center shadow-[0_8px_24px_rgba(30,27,51,0.06)] ${metric.accentClassName}`}
          >
            <h3 className="text-sm font-semibold">{metric.label}</h3>
            <p className="mt-2 text-2xl font-bold tracking-tight text-ink">
              {metric.value}
            </p>
          </article>
        </li>
      ))}
    </ul>
  );
}
