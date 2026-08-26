import { useEffect, useRef, useState } from "react";

export interface GameDropdownOption<T extends string | number> {
  disabled?: boolean;
  value: T;
  label: string;
}

interface GameDropdownProps<T extends string | number> {
  ariaLabel: string;
  className?: string;
  onChange: (value: T) => void;
  options: GameDropdownOption<T>[];
  value: T;
}

export function GameDropdown<T extends string | number>({
  ariaLabel,
  className = "",
  onChange,
  options,
  value,
}: GameDropdownProps<T>) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const selected = options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    };
    document.addEventListener("pointerdown", closeOutside, true);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside, true);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div
      className={`game-dropdown ${open ? "is-open" : ""} ${className}`.trim()}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
      ref={rootRef}
    >
      <button
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        className="game-dropdown-trigger"
        disabled={options.length === 0}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
          event.preventDefault();
          setOpen(true);
        }}
        ref={triggerRef}
        type="button"
      >
        <span>{selected?.label ?? "—"}</span>
        <span aria-hidden="true" className="game-dropdown-caret">◆</span>
      </button>
      {open && (
        <div aria-label={ariaLabel} className="game-dropdown-menu" role="listbox">
          {options.map((option) => {
            const isSelected = option.value === selected?.value;
            return (
              <button
                aria-selected={isSelected}
                className={`game-dropdown-option ${isSelected ? "is-selected" : ""}`}
                disabled={option.disabled}
                key={String(option.value)}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                  triggerRef.current?.focus();
                }}
                role="option"
                type="button"
              >
                <span aria-hidden="true" className="game-dropdown-mark">{isSelected ? "◆" : ""}</span>
                <span>{option.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
