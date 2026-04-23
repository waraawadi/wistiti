"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Clock3 } from "lucide-react";

import { cn } from "@/lib/utils";

type DateTimePickerProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

const WEEK_DAYS = ["L", "M", "M", "J", "V", "S", "D"];

function parseLocalDateTime(value: string) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toInputDateTime(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function dayGridOffsetMonday(firstDayOfMonth: Date) {
  // JS: 0=Sunday ... 6=Saturday  -> Monday-first grid
  return (firstDayOfMonth.getDay() + 6) % 7;
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = "Choisir une date et une heure",
  disabled = false,
  className,
}: DateTimePickerProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const selectedDate = parseLocalDateTime(value);
  const [open, setOpen] = useState(false);
  const [monthCursor, setMonthCursor] = useState(() => startOfMonth(selectedDate ?? new Date()));

  useEffect(() => {
    if (selectedDate) {
      setMonthCursor(startOfMonth(selectedDate));
    }
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current || !(e.target instanceof Node)) return;
      if (!rootRef.current.contains(e.target)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const monthLabel = useMemo(
    () =>
      monthCursor.toLocaleDateString("fr-FR", {
        month: "long",
        year: "numeric",
      }),
    [monthCursor]
  );

  const displayLabel = useMemo(() => {
    if (!selectedDate) return placeholder;
    return selectedDate.toLocaleString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [placeholder, selectedDate]);

  const days = useMemo(() => {
    const first = startOfMonth(monthCursor);
    const offset = dayGridOffsetMonday(first);
    const inMonth = new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 0).getDate();
    const cells: Array<Date | null> = [];

    for (let i = 0; i < offset; i += 1) cells.push(null);
    for (let d = 1; d <= inMonth; d += 1) {
      cells.push(new Date(monthCursor.getFullYear(), monthCursor.getMonth(), d));
    }
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [monthCursor]);

  function setDay(day: Date) {
    const base = selectedDate ?? new Date();
    const next = new Date(day.getFullYear(), day.getMonth(), day.getDate(), base.getHours(), base.getMinutes(), 0, 0);
    onChange(toInputDateTime(next));
  }

  function setTimePart(type: "hours" | "minutes", raw: string) {
    const base = selectedDate ?? new Date();
    const hours = type === "hours" ? Number(raw) : base.getHours();
    const minutes = type === "minutes" ? Number(raw) : base.getMinutes();
    const next = new Date(base.getFullYear(), base.getMonth(), base.getDate(), hours, minutes, 0, 0);
    onChange(toInputDateTime(next));
  }

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => !disabled && setOpen((prev) => !prev)}
        disabled={disabled}
        className={cn(
          "w-full rounded-[var(--radius-input)] border px-3 py-2.5 text-left text-sm transition-all",
          "border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] bg-background",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--color-primary)_45%,transparent)]",
          "hover:border-[color-mix(in_srgb,var(--color-primary)_35%,transparent)] hover:shadow-sm",
          disabled && "cursor-not-allowed opacity-60"
        )}
      >
        <span className="inline-flex items-center gap-2">
          <CalendarDays size={16} className="text-[var(--color-primary)]" />
          <span className={selectedDate ? "text-foreground" : "text-muted-foreground"}>{displayLabel}</span>
        </span>
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-full min-w-[290px] rounded-2xl border border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] bg-background p-3 shadow-[0_18px_48px_-24px_color-mix(in_srgb,var(--color-primary)_30%,transparent)] backdrop-blur-md">
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() - 1, 1))}
              className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-[var(--color-primary-light)] hover:text-[var(--color-primary)]"
              aria-label="Mois précédent"
            >
              <ChevronLeft size={16} />
            </button>
            <p className="text-sm font-semibold capitalize">{monthLabel}</p>
            <button
              type="button"
              onClick={() => setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 1))}
              className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-[var(--color-primary-light)] hover:text-[var(--color-primary)]"
              aria-label="Mois suivant"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {WEEK_DAYS.map((d, index) => (
              <div key={`${d}-${index}`} className="pb-1 text-center text-[11px] font-semibold text-muted-foreground">
                {d}
              </div>
            ))}
            {days.map((day, index) => {
              if (!day) {
                return <div key={`empty-${index}`} className="h-9" />;
              }
              const isSelected =
                !!selectedDate &&
                selectedDate.getFullYear() === day.getFullYear() &&
                selectedDate.getMonth() === day.getMonth() &&
                selectedDate.getDate() === day.getDate();

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => setDay(day)}
                  className={cn(
                    "h-9 rounded-lg text-sm transition-all",
                    "hover:bg-[var(--color-primary-light)] hover:text-[var(--color-primary)]",
                    isSelected &&
                      "bg-[var(--color-primary)] text-[var(--color-white)] shadow-[0_8px_24px_-14px_color-mix(in_srgb,var(--color-primary)_80%,transparent)] hover:bg-[var(--color-primary)] hover:text-[var(--color-white)]"
                  )}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex items-center gap-2 rounded-xl border border-[color-mix(in_srgb,var(--foreground)_8%,transparent)] bg-[color-mix(in_srgb,var(--color-primary-light)_45%,var(--background))] px-2.5 py-2">
            <Clock3 size={15} className="text-[var(--color-primary)]" />
            <select
              className="rounded-md border border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] bg-background px-2 py-1 text-sm"
              value={String((selectedDate ?? new Date()).getHours()).padStart(2, "0")}
              onChange={(e) => setTimePart("hours", e.target.value)}
            >
              {Array.from({ length: 24 }).map((_, hour) => {
                const h = String(hour).padStart(2, "0");
                return (
                  <option key={h} value={h}>
                    {h}
                  </option>
                );
              })}
            </select>
            <span className="text-muted-foreground">:</span>
            <select
              className="rounded-md border border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] bg-background px-2 py-1 text-sm"
              value={String((selectedDate ?? new Date()).getMinutes()).padStart(2, "0")}
              onChange={(e) => setTimePart("minutes", e.target.value)}
            >
              {Array.from({ length: 12 }).map((_, step) => {
                const minute = String(step * 5).padStart(2, "0");
                return (
                  <option key={minute} value={minute}>
                    {minute}
                  </option>
                );
              })}
            </select>
            <button
              type="button"
              onClick={() => {
                if (!selectedDate) onChange(toInputDateTime(new Date()));
                setOpen(false);
              }}
              className="ml-auto rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary-light)]"
            >
              Valider
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
