import type { HTMLAttributes, KeyboardEvent, ReactNode } from "react";
import type { SpriteName } from "@/content/sprites";
import { Sprite } from "@/features/shared/Sprite";

export type InventoryCardKind = "gear" | "material" | "fish" | "key" | "potion" | "supply";

interface InventoryCardProps extends Omit<HTMLAttributes<HTMLElement>, "children"> {
  capacity?: number;
  children?: ReactNode;
  description: string;
  disabled?: boolean;
  name: string;
  quantity?: number;
  selected?: boolean;
  sprite: SpriteName;
  type: InventoryCardKind;
}

/**
 * Shared inventory presentation used anywhere an owned item is shown.
 * Interactions remain feature-owned: Party supplies item actions, while
 * Crafting supplies click/drag handlers.
 */
export function InventoryCard({
  capacity,
  children,
  className = "",
  description,
  disabled = false,
  name,
  onClick,
  onKeyDown,
  quantity,
  selected = false,
  sprite,
  tabIndex,
  type,
  ...articleProps
}: InventoryCardProps) {
  const interactive = Boolean(onClick) && !disabled;
  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented || !interactive) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      event.currentTarget.click();
    }
  };

  return (
    <article
      {...articleProps}
      aria-disabled={disabled || undefined}
      aria-label={`${name}${quantity === undefined ? "" : `, quantity ${quantity}`}`}
      aria-pressed={interactive ? selected : undefined}
      className={`inventory-slot inventory-slot-${type}${selected ? " is-selected" : ""}${disabled ? " is-disabled" : ""}${className ? ` ${className}` : ""}`}
      onClick={disabled ? undefined : onClick}
      onKeyDown={handleKeyDown}
      role={interactive ? "button" : undefined}
      tabIndex={disabled ? -1 : (tabIndex ?? 0)}
    >
      <Sprite name={sprite} />
      {quantity !== undefined && <strong className="inventory-quantity">{quantity}</strong>}
      <span className="inventory-slot-name">{name}</span>
      <div className="inventory-tooltip" role="tooltip">
        <h3>{name}</h3>
        {quantity !== undefined && <p>Owned: {quantity}{capacity === undefined ? "" : ` / ${capacity}`}</p>}
        {description && <p>{description}</p>}
        {children}
      </div>
    </article>
  );
}
