"use client";

import { useEffect, useId, useRef, useState } from "react";
import { matchesSearchQuery } from "@/helpers/search";

export type SearchableMultiSelectOption = {
  id: string;
  label: string;
  description?: string;
};

type SearchableMultiSelectProps = Readonly<{
  id: string;
  placeholder?: string;
  options: SearchableMultiSelectOption[];
  selectedIds: string[];
  onSelectedIdsChange: (selectedIds: string[]) => void;
  invalid?: boolean;
  describedBy?: string;
}>;

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
  const containerElementRef = useRef<HTMLSpanElement | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState("");
  const [isListOpen, setIsListOpen] = useState(false);

  const selectedOptions = selectedIds.flatMap((selectedId) => {
    const selectedOption = options.find((option) => option.id === selectedId);
    if (selectedOption === undefined) {
      return [];
    }
    return [selectedOption];
  });

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
      const containerElement = containerElementRef.current;
      const eventTarget = pointerEvent.target;
      if (
        containerElement instanceof HTMLElement === false ||
        eventTarget instanceof Node === false
      ) {
        return;
      }
      if (containerElement.contains(eventTarget) === false) {
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
    setIsListOpen(false);
  }

  function removeSelectedId(optionId: string) {
    onSelectedIdsChange(
      selectedIds.filter((selectedId) => selectedId !== optionId),
    );
  }

  return (
    <span
      ref={(element) => {
        containerElementRef.current = element ?? undefined;
      }}
      className="relative block"
    >
      {selectedOptions.length > 0 ? (
        <ul className="mb-2 flex flex-wrap gap-2">
          {selectedOptions.map((selectedOption) => (
            <li key={selectedOption.id}>
              <button
                type="button"
                className="rounded-full border border-coral/50 bg-coral/15 px-2.5 py-1 text-xs font-medium text-coral hover:bg-coral/25"
                onClick={() => removeSelectedId(selectedOption.id)}
                aria-label={`Remove ${selectedOption.label}`}
              >
                {selectedOption.label} ×
              </button>
            </li>
          ))}
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
        onBlur={(blurEvent) => {
          const nextFocus = blurEvent.relatedTarget;
          if (
            nextFocus instanceof Node &&
            containerElementRef.current?.contains(nextFocus)
          ) {
            return;
          }
          setIsListOpen(false);
        }}
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
                  onMouseDown={(mouseEvent) => {
                    mouseEvent.preventDefault();
                    addSelectedId(option.id);
                  }}
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
