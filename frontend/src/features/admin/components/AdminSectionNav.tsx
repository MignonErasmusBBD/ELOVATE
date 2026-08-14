"use client";

type AdminSectionNavItem<SectionId extends string> = {
  id: SectionId;
  label: string;
};

type AdminSectionNavProps<SectionId extends string> = {
  items: AdminSectionNavItem<SectionId>[];
  selectedSectionId: SectionId;
  onSelectSection: (sectionId: SectionId) => void;
};

export function AdminSectionNav<SectionId extends string>({
  items,
  selectedSectionId,
  onSelectSection,
}: AdminSectionNavProps<SectionId>) {
  return (
    <nav aria-label="Admin sections" className="mt-8">
      <ul className="flex flex-wrap gap-2">
        {items.map((item) => {
          const isSelected = item.id === selectedSectionId;

          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onSelectSection(item.id)}
                aria-current={isSelected ? "true" : undefined}
                className={
                  isSelected
                    ? "rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white"
                    : "rounded-full border border-border-ui bg-surface px-4 py-2 text-sm font-medium text-text-secondary hover:bg-page"
                }
              >
                {item.label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
