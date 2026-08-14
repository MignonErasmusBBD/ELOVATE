import type { DashboardStatusBanner } from "../types";

type DashboardStatusBannerCardProps = {
  banner: DashboardStatusBanner;
};

const variantStyles: Record<
  DashboardStatusBanner["variant"],
  { article: string; title: string; icon: string; iconLabel: string }
> = {
  completed: {
    article: "border-ink/20 bg-ink/5",
    title: "text-ink",
    icon: "bg-emerald-600 text-white",
    iconLabel: "✓",
  },
  intervention: {
    article: "border-amber-300 bg-amber-50",
    title: "text-ink",
    icon: "bg-amber-500 text-white",
    iconLabel: "!",
  },
  failed: {
    article: "border-coral/40 bg-coral/10",
    title: "text-coral",
    icon: "bg-coral text-white",
    iconLabel: "✕",
  },
};

export function DashboardStatusBannerCard({
  banner,
}: DashboardStatusBannerCardProps) {
  const styles = variantStyles[banner.variant];

  return (
    <article
      className={`flex items-center justify-between gap-4 rounded-2xl border px-5 py-4 ${styles.article}`}
    >
      <header className="min-w-0">
        <h2 className={`text-base font-bold uppercase tracking-wide ${styles.title}`}>
          {banner.title}
        </h2>
        <p className="mt-1 text-sm text-text-secondary">{banner.message}</p>
      </header>
      <span
        aria-hidden="true"
        className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${styles.icon}`}
      >
        {styles.iconLabel}
      </span>
    </article>
  );
}
