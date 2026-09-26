"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Loader2, Lock, Search, X } from "lucide-react";
import { useInstitutionSearch, type Institution } from "@/hooks/use-institution-search";
import { INSTITUTION_TYPE_LABEL } from "@/lib/validation/profile";
import { inputClass } from "@/components/ui/field";
import { cn } from "@/lib/cn";

const meta = (row: Institution) =>
  [INSTITUTION_TYPE_LABEL[row.type] ?? row.type, row.eiin ? `EIIN ${row.eiin}` : row.code ? `Code ${row.code}` : null]
    .filter(Boolean)
    .join(" · ");

export type InstitutionValue = {
  institutionId: string | null;
  institutionOther: string;
  institutionName: string;
};

type Props = {
  error?: string;
  describedBy?: string;
  id?: string;
  /** Controlled mode. Without it the picker posts `institutionId` / `institutionOther` itself. */
  value?: InstitutionValue;
  onChange?: (value: InstitutionValue) => void;
  /** Read-only, for a participant whose institution comes from their own profile. */
  locked?: boolean;
};

/** Searchable picker over the institutions catalogue, with a free-text escape hatch. */
export function InstitutionSelect({ error, describedBy, id = "institution", value, onChange, locked }: Props) {
  const { query, search, items, loading, loadingMore, hasMore, error: searchError, loadMore } = useInstitutionSearch();

  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [selected, setSelected] = useState<Institution | null>(null);
  const [otherMode, setOtherMode] = useState(false);

  const root = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);

  const controlled = Boolean(onChange);
  const chosenName = controlled ? (value?.institutionId ? value.institutionName : "") : (selected?.name ?? "");
  const chosenMeta = controlled ? "" : selected ? meta(selected) : "";
  const other = controlled
    ? otherMode || (!value?.institutionId && Boolean(value?.institutionOther?.trim()))
    : otherMode;

  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const emit = (next: InstitutionValue) => onChange?.(next);

  const choose = (row: Institution) => {
    if (controlled) emit({ institutionId: row.id, institutionOther: "", institutionName: row.name });
    else setSelected(row);
    setOpen(false);
    search("");
  };

  const clear = () => {
    if (controlled) emit({ institutionId: null, institutionOther: "", institutionName: "" });
    else setSelected(null);
    setOpen(true);
    window.setTimeout(() => input.current?.focus(), 0);
  };

  if (locked) {
    return (
      <div className={cn(inputClass, "flex items-center gap-3 py-0 opacity-90")}>
        <Lock aria-hidden className="size-4 shrink-0 text-muted" />
        <span className="min-w-0 truncate">{chosenName || value?.institutionOther || "—"}</span>
      </div>
    );
  }

  if (other) {
    return (
      <div className="space-y-2">
        {!controlled && <input type="hidden" name="institutionId" value="" />}
        <input
          id={id}
          name={controlled ? undefined : "institutionOther"}
          type="text"
          required
          maxLength={120}
          placeholder="Type the institution's full name"
          value={controlled ? (value?.institutionOther ?? "") : undefined}
          onChange={
            controlled
              ? (e) => emit({ institutionId: null, institutionOther: e.target.value, institutionName: "" })
              : undefined
          }
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={inputClass}
        />
        <button
          type="button"
          onClick={() => {
            if (controlled) emit({ institutionId: null, institutionOther: "", institutionName: "" });
            setOtherMode(false);
            setOpen(true);
          }}
          className="text-sm text-muted underline-offset-4 transition-colors hover:text-fg hover:underline"
        >
          Search the list instead
        </button>
      </div>
    );
  }

  const hasSelection = controlled ? Boolean(value?.institutionId) : Boolean(selected);

  return (
    <div ref={root} className="relative">
      {!controlled && (
        <>
          <input type="hidden" name="institutionId" value={selected?.id ?? ""} />
          <input type="hidden" name="institutionOther" value="" />
        </>
      )}

      {hasSelection ? (
        <div className={cn(inputClass, "flex items-center justify-between gap-3 py-0")}>
          <span className="min-w-0">
            <span className="block truncate text-base">{chosenName}</span>
            {chosenMeta && <span className="block truncate font-mono text-[11px] text-muted">{chosenMeta}</span>}
          </span>
          <button
            type="button"
            onClick={clear}
            aria-label="Change institution"
            className="grid size-8 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-bg-elev hover:text-fg"
          >
            <X aria-hidden className="size-4" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <Search aria-hidden className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted" />
          <input
            ref={input}
            id={id}
            type="text"
            role="combobox"
            aria-expanded={open}
            aria-controls={`${id}-list`}
            aria-autocomplete="list"
            aria-busy={loading}
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy}
            autoComplete="off"
            value={query}
            placeholder="Search school, college or university"
            onFocus={() => setOpen(true)}
            onChange={(e) => {
              search(e.target.value);
              setActive(0);
              setOpen(true);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                e.preventDefault();
                setOpen(true);
                setActive((i) => {
                  const last = items.length - 1;
                  if (last < 0) return 0;
                  return e.key === "ArrowDown" ? (i >= last ? 0 : i + 1) : i <= 0 ? last : i - 1;
                });
              } else if (e.key === "Enter" && open && items[active]) {
                e.preventDefault();
                choose(items[active]);
              } else if (e.key === "Escape") {
                setOpen(false);
              }
            }}
            className={cn(inputClass, "pr-10 pl-10")}
          />
          {loading ? (
            <Loader2 aria-hidden className="absolute top-1/2 right-4 size-4 -translate-y-1/2 animate-spin text-muted" />
          ) : (
            <ChevronDown aria-hidden className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-muted" />
          )}
        </div>
      )}

      {open && !hasSelection && (
        <div
          id={`${id}-list`}
          role="listbox"
          data-lenis-prevent
          className="absolute z-20 mt-2 max-h-72 w-full overflow-y-auto rounded-xl hairline bg-bg-elev p-1 shadow-[0_20px_60px_-20px_rgb(0_0_0/0.45)]"
        >
          {loading && (
            <p className="flex items-center gap-2 px-3 py-3 text-sm text-muted">
              <Loader2 aria-hidden className="size-4 animate-spin" />
              Searching…
            </p>
          )}

          {!loading && searchError && <p className="px-3 py-3 text-sm text-signal">{searchError}</p>}

          {!loading && !searchError && items.length === 0 && (
            <p className="px-3 py-3 text-sm text-muted">Nothing matched “{query}”.</p>
          )}

          {!loading &&
            items.map((row, i) => (
              <button
                key={row.id}
                type="button"
                role="option"
                aria-selected={i === active}
                onPointerEnter={() => setActive(i)}
                onClick={() => choose(row)}
                className={cn(
                  "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                  i === active ? "bg-surface text-fg" : "text-fg/90",
                )}
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm">{row.name}</span>
                  <span className="block truncate font-mono text-[11px] text-muted">{meta(row)}</span>
                </span>
                {i === active && <Check aria-hidden className="size-4 shrink-0 text-accent-ink" />}
              </button>
            ))}

          {!loading && hasMore && (
            <button
              type="button"
              onClick={loadMore}
              disabled={loadingMore}
              className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm text-muted transition-colors hover:text-fg disabled:opacity-60"
            >
              {loadingMore && <Loader2 aria-hidden className="size-4 animate-spin" />}
              {loadingMore ? "Loading…" : "Show more results"}
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setOtherMode(true);
              setOpen(false);
            }}
            className="mt-1 w-full border-t border-line px-3 py-2.5 text-left text-sm text-muted transition-colors hover:text-fg"
          >
            My institution isn&apos;t listed
          </button>
        </div>
      )}
    </div>
  );
}
