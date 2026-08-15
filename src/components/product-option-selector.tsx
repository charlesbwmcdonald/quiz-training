"use client";

import { useMemo } from "react";

export type SelectableVariation = {
  id?: string;
  name: string;
  model_sku: string | null;
  variation_label?: string | null;
  variation_options?: Record<string, string>;
};

function unique(values: string[]) {
  return values.filter((value, index) => value && values.indexOf(value) === index);
}

export function ProductOptionSelector({
  variations,
  selectedId,
  onSelect,
  compact = false,
}: {
  variations: SelectableVariation[];
  selectedId: string;
  onSelect: (id: string) => void;
  compact?: boolean;
}) {
  const optionLabels = useMemo(
    () => unique(variations.flatMap((variation) => Object.keys(variation.variation_options ?? {}))),
    [variations],
  );
  const selected = variations.find((variation) => variation.id === selectedId) ?? variations[0];

  if (!optionLabels.length) {
    return <div className="flex gap-3 overflow-x-auto pb-2">
      {variations.map((variation) => {
        const active = variation.id === selected?.id;
        return <button
          key={variation.id}
          type="button"
          onClick={() => onSelect(variation.id ?? "")}
          className={`${compact ? "min-w-40 px-4 py-3 text-sm" : "min-w-52 p-4"} border-2 text-left font-bold transition ${active ? "border-black bg-black text-white" : "border-black/15 hover:border-black"}`}
        >
          <span className="block uppercase">{variation.variation_label || variation.name}</span>
          {variation.model_sku && <span className={`mt-1 block text-xs ${active ? "text-white/55" : "text-black/45"}`}>{variation.model_sku}</span>}
        </button>;
      })}
    </div>;
  }

  return <div className={compact ? "grid gap-4" : "grid gap-6"}>
    {optionLabels.map((label, level) => {
      const values = unique(variations.map((variation) => variation.variation_options?.[label] ?? ""));
      const previousLabels = optionLabels.slice(0, level);

      return <fieldset key={label}>
        <legend className={`${compact ? "text-xs" : "text-sm"} font-extrabold uppercase tracking-wide`}>{label}</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {values.map((value) => {
            const available = variations.some((variation) =>
              variation.variation_options?.[label] === value
              && previousLabels.every((previous) => variation.variation_options?.[previous] === selected?.variation_options?.[previous]),
            );
            const active = selected?.variation_options?.[label] === value;

            return <button
              key={value}
              type="button"
              disabled={!available}
              aria-label={`${label}: ${value}${available ? "" : " - unavailable"}`}
              onClick={() => {
                const match = variations.find((variation) =>
                  variation.variation_options?.[label] === value
                  && previousLabels.every((previous) => variation.variation_options?.[previous] === selected?.variation_options?.[previous]),
                );
                if (match?.id) onSelect(match.id);
              }}
              className={`relative min-h-11 overflow-hidden border-2 px-4 py-2 text-sm font-extrabold transition ${
                !available
                  ? "cursor-not-allowed border-black/10 bg-black/[.025] text-black/25 after:absolute after:left-[-8%] after:top-1/2 after:h-px after:w-[116%] after:-rotate-12 after:bg-black/35 after:content-['']"
                  : active
                    ? "border-black bg-black text-white"
                    : "border-black/20 bg-white hover:border-black"
              }`}
            >
              {value}
            </button>;
          })}
        </div>
      </fieldset>;
    })}
    <p className="text-xs text-black/40"><span className="mr-2 inline-block w-7 border-t border-black/35 align-middle -rotate-12" />Crossed-out options are unavailable with the selections above.</p>
  </div>;
}
