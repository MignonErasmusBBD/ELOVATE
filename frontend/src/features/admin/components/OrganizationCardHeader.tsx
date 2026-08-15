import type { CompanyStatus } from "../types";
import { StatusPill } from "./StatusPill";

type OrganizationCardHeaderProps = Readonly<{
  title: string;
  headingLevel: "h3" | "h4";
  slug: string | undefined;
  status: CompanyStatus;
  adminFullNames: string[];
}>;

export function OrganizationCardHeader({
  title,
  headingLevel,
  slug,
  status,
  adminFullNames,
}: OrganizationCardHeaderProps) {
  const HeadingTag = headingLevel;
  const isActive = status === "active";

  return (
    <header>
      <div className="flex flex-wrap items-center gap-2">
        <HeadingTag className="text-base font-bold text-ink">
          {title}
        </HeadingTag>
        <StatusPill
          label={isActive ? "Active" : "Suspended"}
          tone={isActive ? "success" : "danger"}
        />
      </div>
      {slug === undefined ? undefined : (
        <p className="mt-1 text-xs text-text-secondary">{slug}</p>
      )}
      <p className="mt-2 text-sm text-text-secondary">
        <span className="font-medium text-ink">Admins</span>
        {adminFullNames.length === 0
          ? " · None assigned"
          : ` · ${adminFullNames.join(", ")}`}
      </p>
    </header>
  );
}
