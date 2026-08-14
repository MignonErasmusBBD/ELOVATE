"use client";

import { useEffect, useId, useRef, useState } from "react";
import { matchesSearchQuery } from "@/helpers/search";

export type SearchableMultiSelectOption = {
  id: string;
  label: string;
  description?: string;
};

type SearchableMultiSelectProps = {
  id: string;
  placeholder?: string;
  options: SearchableMultiSelectOption[];
  selectedIds: string[];
  onSelectedIdsChange: (selectedIds: string[]) => void;
  invalid?: boolean;
  describedBy?: string;
};

export function SearchableMultiSelect({
  id,
  placeholder = "Search",
  options,
  selectedIds,
  onSelectedIdsChange,
  invalid = false,
  describedBy,
}: SearchableMultiSelectProps) {
  const listboxId = useId();
  const containerRef = useRef<HTMLSpanElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isListOpen, setIsListOpen] = useState(false);

  const availableOptions = options.filter((option) => {
    if (selectedIds.includes(option.id)) {
      return false;
    }

    const searchableText =
      option.description !== undefined
        ? `${option.label} ${option.description}`
        : option.label;

    return matchesSearchQuery(searchableText, searchQuery);
  });

  useEffect(() => {
    function handlePointerDown(pointerEvent: PointerEvent) {
      const containerElement = containerRef.current;
      const eventTarget = pointerEvent.target;

      if (containerElement === null || !(eventTarget instanceof Node)) {
        return;
      }

      if (!containerElement.contains(eventTarget)) {
        setIsListOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, []);

  function addSelectedId(optionId: string) {
    onSelectedIdsChange([...selectedIds, optionId]);
    setSearchQuery("");
  }

  function removeSelectedId(optionId: string) {
    onSelectedIdsChange(
      selectedIds.filter((selectedId) => selectedId !== optionId),
    );
  }

  return (
    <span ref={containerRef} className="relative block">
      {selectedIds.length > 0 ? (
        <ul className="mb-2 flex flex-wrap gap-2">
          {selectedIds.map((selectedId) => {
            const selectedOption = options.find(
              (option) => option.id === selectedId,
            );

            if (selectedOption === undefined) {
              return undefined;
            }

            return (
              <li key={selectedId}>
                <button
                  type="button"
                  className="rounded-full border border-coral/50 bg-coral/15 px-2.5 py-1 text-xs font-medium text-coral hover:bg-coral/25"
                  onClick={() => removeSelectedId(selectedId)}
                  aria-label={`Remove ${selectedOption.label}`}
                >
                  {selectedOption.label} ×
                </button>
              </li>
            );
          })}
        </ul>
      ) : undefined}

      <input
        id={id}
        type="search"
        role="combobox"
        autoComplete="off"
        placeholder={placeholder}
        value={searchQuery}
        aria-invalid={invalid ? true : undefined}
        aria-expanded={isListOpen}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-describedby={describedBy}
        className={`w-full rounded-lg bg-surface px-3 py-3 text-ink placeholder:text-text-secondary ${
          invalid ? "border-2 border-ink" : "border border-border-ui"
        }`}
        onChange={(changeEvent) => {
          setSearchQuery(changeEvent.target.value);
          setIsListOpen(true);
        }}
        onFocus={() => setIsListOpen(true)}
        onKeyDown={(keyboardEvent) => {
          if (keyboardEvent.key === "Escape") {
            setIsListOpen(false);
            return;
          }

          if (keyboardEvent.key !== "Enter") {
            return;
          }

          const firstAvailableOption = availableOptions[0];
          if (firstAvailableOption === undefined) {
            return;
          }

          keyboardEvent.preventDefault();
          addSelectedId(firstAvailableOption.id);
        }}
      />

      {isListOpen ? (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-border-ui bg-surface shadow-[0_8px_24px_rgba(30,27,51,0.08)]"
        >
          {availableOptions.length === 0 ? (
            <li className="px-3 py-2.5 text-sm text-text-secondary">
              {searchQuery.trim() === ""
                ? "All options are already selected."
                : "No matching options."}
            </li>
          ) : (
            availableOptions.map((option) => (
              <li key={option.id} role="option" aria-selected="false">
                <button
                  type="button"
                  className="w-full px-3 py-2.5 text-left hover:bg-page"
                  onClick={() => addSelectedId(option.id)}
                >
                  <span className="block text-sm font-medium text-ink">
                    {option.label}
                  </span>
                  {option.description !== undefined ? (
                    <span className="block text-xs text-text-secondary">
                      {option.description}
                    </span>
                  ) : undefined}
                </button>
              </li>
            ))
          )}
        </ul>
      ) : undefined}
    </span>
  );
}
