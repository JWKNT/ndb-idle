import type { CSSProperties } from "react";
import type { AttackVisualId, Position } from "@/game/types";

interface AttackEffectOverlayProps {
  visual: AttackVisualId;
  from: Position;
  to: Position;
  minimumX: number;
  minimumY: number;
  columns: number;
  rows: number;
  effectKey: string | number;
}

interface EffectBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

type AreaPresentation = "none" | "source-surround" | "source-front" | "target-surround";
type ProjectilePresentation = "never" | "always" | "distant-physical";

/**
 * Adding an attack visual requires an explicit presentation decision. A new
 * visual can never silently render nothing because it was omitted from a Set.
 */
export const ATTACK_VISUAL_CONTRACTS: Record<AttackVisualId, {
  area: AreaPresentation;
  projectile: ProjectilePresentation;
}> = {
  "knight-slash": { area: "none", projectile: "never" },
  "worm-acid": { area: "none", projectile: "always" },
  "miner-pick": { area: "none", projectile: "never" },
  "sword-sweep": { area: "source-surround", projectile: "never" },
  "heavy-slam": { area: "source-front", projectile: "never" },
  "burst-orb": { area: "target-surround", projectile: "always" },
  "rapid-bolt": { area: "none", projectile: "always" },
  "trident-throw": { area: "none", projectile: "always" },
  fire: { area: "none", projectile: "always" },
  abyssal: { area: "none", projectile: "always" },
  magic: { area: "none", projectile: "always" },
  physical: { area: "none", projectile: "distant-physical" },
};

export function AttackEffectOverlay({
  visual,
  from,
  to,
  minimumX,
  minimumY,
  columns,
  rows,
  effectKey,
}: AttackEffectOverlayProps) {
  const areaBounds = attackEffectAreaBounds(visual, from, to);
  const projectile = attackEffectUsesProjectile(visual, from, to);
  if (!areaBounds && !projectile) return null;

  const projectileStyle = cellStyle(from, minimumX, minimumY, columns, rows, {
    "--attack-travel-x": `${(to.x - from.x) * 100}%`,
    "--attack-travel-y": `${(to.y - from.y) * 100}%`,
  });
  const areaStyle = areaBounds
    ? boundsStyle(areaBounds, minimumX, minimumY, columns, rows)
    : undefined;

  return (
    <span aria-hidden="true" className="attack-effect-layer" key={effectKey}>
      {projectile && (
        <span
          className={`attack-effect-projectile attack-effect-${visual}`}
          style={projectileStyle}
        />
      )}
      {areaBounds && (
        <span
          className={`attack-effect-area attack-effect-${visual}`}
          style={areaStyle}
        />
      )}
    </span>
  );
}

export function attackEffectHasArea(visual: AttackVisualId | null | undefined): boolean {
  return Boolean(visual && ATTACK_VISUAL_CONTRACTS[visual].area !== "none");
}

export function attackEffectUsesProjectile(
  visual: AttackVisualId,
  from: Position,
  to: Position,
): boolean {
  const presentation = ATTACK_VISUAL_CONTRACTS[visual].projectile;
  if (presentation === "always") return true;
  if (presentation === "never") return false;
  return Math.max(Math.abs(to.x - from.x), Math.abs(to.y - from.y)) > 1;
}

export function attackEffectAreaBounds(
  visual: AttackVisualId,
  from: Position,
  to: Position,
): EffectBounds | null {
  const presentation = ATTACK_VISUAL_CONTRACTS[visual].area;
  if (presentation === "none") return null;
  if (presentation === "source-surround") {
    return { x: from.x - 1, y: from.y - 1, width: 3, height: 3 };
  }
  if (presentation === "target-surround") {
    return { x: to.x - 1, y: to.y - 1, width: 3, height: 3 };
  }

  const deltaX = to.x - from.x;
  const deltaY = to.y - from.y;
  if (Math.abs(deltaX) >= Math.abs(deltaY)) {
    return {
      x: from.x + (deltaX < 0 ? -2 : 1),
      y: from.y - 1,
      width: 2,
      height: 3,
    };
  }
  return {
    x: from.x - 1,
    y: from.y + (deltaY < 0 ? -2 : 1),
    width: 3,
    height: 2,
  };
}

function cellStyle(
  position: Position,
  minimumX: number,
  minimumY: number,
  columns: number,
  rows: number,
  customProperties: Record<string, string>,
): CSSProperties {
  return {
    left: `${(position.x - minimumX) * 100 / columns}%`,
    top: `${(position.y - minimumY) * 100 / rows}%`,
    width: `${100 / columns}%`,
    height: `${100 / rows}%`,
    ...customProperties,
  } as CSSProperties;
}

function boundsStyle(
  bounds: EffectBounds,
  minimumX: number,
  minimumY: number,
  columns: number,
  rows: number,
): CSSProperties {
  return {
    left: `${(bounds.x - minimumX) * 100 / columns}%`,
    top: `${(bounds.y - minimumY) * 100 / rows}%`,
    width: `${bounds.width * 100 / columns}%`,
    height: `${bounds.height * 100 / rows}%`,
  };
}
