import { useEffect, useMemo, useState } from "react";
import {
  activeUnit,
  isAdjacent,
  isDeploymentExcludedAt,
  isGapAt,
  isInAttackRange,
  isInWeaponSkillRange,
  isInWeaponThrowRange,
  isMovementBlockedAt,
  isUnitShielded,
  isWallAt,
  maxHp,
  terrainAt,
  unitAt,
} from "@/game/combat";
import { formatWholeAmount } from "@/game/numbers";
import type { BattleState, PlayerId, Position } from "@/game/types";
import type { SpriteName } from "@/content/sprites";
import { enemySprite } from "@/content/enemy-sprites";
import { playerSprite } from "@/content/player-sprites";
import { Sprite } from "@/features/shared/Sprite";
import {
  AttackEffectOverlay,
  attackEffectHasArea,
} from "@/features/shared/AttackEffectOverlay";

interface BattleBoardProps {
  battle: BattleState;
  manualEnabled: boolean;
  onTile: (position: Position) => void;
  onSecondaryTile: (position: Position) => void;
}

const floorSprites = {
  grass: "raidFloorGrass",
  planks: "raidFloorPlanks",
  leaves: "raidFloorLeaves",
  "abyssal-metal": "raidFloorAbyssalMetal",
  sand: "raidFloorSand",
} as const satisfies Record<NonNullable<BattleState["level"]["board"]["floorTheme"]>, SpriteName>;

const wallSprites = {
  tombstone: "raidTombstone",
  stone: "wall",
  "tree-stump": "raidTreeStump",
  "pressure-vat": "raidPressureVat",
} as const satisfies Record<NonNullable<BattleState["level"]["board"]["wallTheme"]>, SpriteName>;

export function BattleBoard({ battle, manualEnabled, onTile, onSecondaryTile }: BattleBoardProps) {
  const actor = activeUnit(battle);
  const { board } = battle.level;
  const largeBoard = board.width > 11 || board.height > 11;
  const playerUnits = battle.units.filter((unit) => unit.team === "player");
  const defaultPerspectiveId = playerUnits[0]?.id ?? null;
  const [perspectiveId, setPerspectiveId] = useState<string | null>(defaultPerspectiveId);
  const [cameraCenter, setCameraCenter] = useState<Position>(() => ({
    x: Math.min(board.width - 1, 4),
    y: Math.floor(board.height / 2),
  }));
  const [zoomedOut, setZoomedOut] = useState(false);
  const perspectiveUnit = perspectiveId
    ? playerUnits.find((unit) => unit.id === perspectiveId) ?? null
    : null;

  useEffect(() => {
    if (!largeBoard || zoomedOut || !perspectiveUnit || perspectiveUnit.position.x < 0) return;
    setCameraCenter({ ...perspectiveUnit.position });
  }, [battle.actionCount, battle.status, largeBoard, perspectiveUnit?.id, perspectiveUnit?.position.x, perspectiveUnit?.position.y, zoomedOut]);

  useEffect(() => {
    setZoomedOut(false);
    setPerspectiveId(defaultPerspectiveId);
    setCameraCenter({ x: Math.min(board.width - 1, 4), y: Math.floor(board.height / 2) });
  }, [battle.level.number]);

  const floorSprite = floorSprites[board.floorTheme ?? "planks"];
  const wallSprite = wallSprites[board.wallTheme ?? "stone"];
  const undeadWardActive = battle.level.number === 4
    && !battle.units.some((candidate) => candidate.team === "player" && candidate.hasUndeadGem);
  const viewportWidth = largeBoard && !zoomedOut ? Math.min(11, board.width) : board.width;
  const viewportHeight = largeBoard && !zoomedOut ? Math.min(11, board.height) : board.height;
  const cameraX = clamp(cameraCenter.x - Math.floor(viewportWidth / 2), 0, board.width - viewportWidth);
  const cameraY = clamp(cameraCenter.y - Math.floor(viewportHeight / 2), 0, board.height - viewportHeight);
  const tiles = useMemo(() => Array.from(
    { length: viewportWidth * viewportHeight },
    (_, index) => ({
      x: cameraX + (index % viewportWidth),
      y: cameraY + Math.floor(index / viewportWidth),
    }),
  ), [cameraX, cameraY, viewportHeight, viewportWidth]);
  const oozeBoss = battle.units.find((unit) =>
    unit.definitionId === "abyssal-ooze" && unit.hp.gt(0)
  );
  const livingOozeGuardians = oozeBoss
    ? battle.units.filter((unit) => unit.definitionId === "ooze-guardian" && unit.hp.gt(0))
    : [];
  const shieldConnections = battle.units.flatMap((boss) => {
    if (
      boss.hp.lte(0)
      || !boss.invulnerableWhileEnemyId
      || boss.invulnerableWhileEnemyId === "squid-tentacle"
    ) return [];
    const provider = battle.units.find((unit) =>
      unit.hp.gt(0)
      && unit.team === boss.team
      && unit.definitionId === boss.invulnerableWhileEnemyId
    );
    return provider ? [{ boss, provider }] : [];
  });

  const panCamera = (dx: number, dy: number) => {
    setPerspectiveId(null);
    setCameraCenter((current) => ({
      x: clamp(current.x + dx, 0, board.width - 1),
      y: clamp(current.y + dy, 0, board.height - 1),
    }));
  };

  return (
    <section>
      <div className="battle-board-stage">
        <div className="battle-board-frame activity-screen-frame battle-screen-frame">
          <div
            className={`battle-board ${largeBoard ? "large-raid-board" : ""} ${zoomedOut ? "is-zoomed-out" : "is-camera-view"}`}
            role="grid"
            aria-label={`${board.width} by ${board.height} combat board${largeBoard && !zoomedOut ? `, showing a ${viewportWidth} by ${viewportHeight} area` : ""}`}
            style={{
              gridTemplateColumns: `repeat(${viewportWidth}, 1fr)`,
              gridTemplateRows: `repeat(${viewportHeight}, 1fr)`,
              aspectRatio: `${viewportWidth} / ${viewportHeight}`,
            }}
          >
        {oozeBoss && livingOozeGuardians.length > 0 && (
          <svg
            aria-hidden="true"
            className="ooze-guardian-links"
            preserveAspectRatio="none"
            viewBox={`0 0 ${viewportWidth} ${viewportHeight}`}
          >
            {livingOozeGuardians.map((guardian) => {
              const from = unitVisualCenter(guardian);
              const to = unitVisualCenter(oozeBoss);
              return (
                <g key={guardian.id}>
                  <line
                    className="ooze-link-beam ooze-link-beam-shadow"
                    x1={from.x - cameraX}
                    y1={from.y - cameraY}
                    x2={to.x - cameraX}
                    y2={to.y - cameraY}
                  />
                  <line
                    className="ooze-link-beam ooze-link-beam-core"
                    x1={from.x - cameraX}
                    y1={from.y - cameraY}
                    x2={to.x - cameraX}
                    y2={to.y - cameraY}
                  />
                </g>
              );
            })}
          </svg>
        )}
        {shieldConnections.length > 0 && (
          <svg
            aria-hidden="true"
            className="shield-generator-links"
            preserveAspectRatio="none"
            viewBox={`0 0 ${viewportWidth} ${viewportHeight}`}
          >
            {shieldConnections.map(({ boss, provider }) => {
              const from = unitVisualCenter(provider);
              const to = unitVisualCenter(boss);
              return (
                <g key={`${boss.id}-${provider.id}`}>
                  <line className="dynamo-link-shadow" x1={from.x - cameraX} y1={from.y - cameraY} x2={to.x - cameraX} y2={to.y - cameraY} />
                  <line className="dynamo-link-core" x1={from.x - cameraX} y1={from.y - cameraY} x2={to.x - cameraX} y2={to.y - cameraY} />
                </g>
              );
            })}
          </svg>
        )}
        {battle.lastAttack && (
          <AttackEffectOverlay
            visual={battle.lastAttack.visual}
            from={battle.lastAttack.from}
            to={battle.lastAttack.to}
            minimumX={cameraX}
            minimumY={cameraY}
            columns={viewportWidth}
            rows={viewportHeight}
            effectKey={battle.actionCount}
          />
        )}
        {tiles.map((position) => {
          const graveyardFloorVariant = board.id === "graveyard-board"
            ? (position.x * 3 + position.y) % 4
            : 0;
          const terrain = terrainAt(battle, position);
          const unit = unitAt(battle, position);
          const wall = isWallAt(battle, position);
          const gap = isGapAt(battle, position);
          const acidOoze = battle.hazards?.find((hazard) =>
            hazard.kind === "acid-ooze"
            && hazard.remainingActions > 0
            && samePosition(hazard.position, position)
          );
          const decoration = board.decorations?.find((candidate) =>
            samePosition(candidate.position, position)
          );
          const blueGap = Boolean(board.blueGaps?.some((candidate) =>
            candidate.x === position.x && candidate.y === position.y
          ));
          const blocked = isMovementBlockedAt(battle, position);
          const deploymentExcluded = isDeploymentExcludedAt(battle, position);
          const deploymentOption = battle.status === "deploying"
            && !blocked
            && !deploymentExcluded
            && terrain === "player"
            && !unit;
          const renderAnchor = unit ? {
            x: clamp(unit.position.x, cameraX, cameraX + viewportWidth - 1),
            y: clamp(unit.position.y, cameraY, cameraY + viewportHeight - 1),
          } : null;
          const isUnitAnchor = Boolean(
            unit && renderAnchor && renderAnchor.x === position.x && renderAnchor.y === position.y,
          );
          const primaryActionable = Boolean(
            battle.status === "deploying"
              ? !blocked && !deploymentExcluded && terrain === "player" && (!unit || unit.team === "player")
              : manualEnabled && actor && (
                  unit?.team === "enemy"
                    ? isInAttackRange(actor, position, battle)
                    : !blocked && isAdjacent(actor.position, position)
                ),
          );
          const secondaryActionable = Boolean(
            battle.status === "fighting"
            && manualEnabled
            && actor
            && unit?.team === "enemy"
            && (
              isInWeaponSkillRange(actor, position, battle)
              || isInWeaponThrowRange(actor, position, battle)
            ),
          );
          const actionable = primaryActionable || secondaryActionable;
          const maximumHp = unit ? maxHp(battle, unit) : null;
          const footprintWidth = unit?.footprintWidth ?? 1;
          const footprintHeight = unit?.footprintHeight ?? 1;
          const largeUnit = footprintWidth > 1 || footprintHeight > 1;
          const footprintStart = unit ? {
            x: unit.position.x - Math.floor((footprintWidth - 1) / 2),
            y: unit.position.y - Math.floor((footprintHeight - 1) / 2),
          } : null;
          const footprintStyle = largeUnit && renderAnchor && footprintStart ? {
            left: `calc(${(footprintStart.x - renderAnchor.x) * 100}% + 1px)`,
            top: `calc(${(footprintStart.y - renderAnchor.y) * 100}% + 1px)`,
            width: `calc(${footprintWidth * 100}% - 2px)`,
            height: `calc(${footprintHeight * 100}% - 2px)`,
          } : undefined;
          const footprintClass = !largeUnit
            ? ""
            : footprintWidth === footprintHeight
              ? `unit-footprint-${footprintWidth}`
              : `unit-footprint-${footprintWidth}x${footprintHeight}`;
          const summonWardActive = Boolean(unit?.invulnerableWhileSummons && isUnitShielded(battle, unit));
          const tentacleWardActive = Boolean(
            unit?.definitionId === "abyssal-squid" && isUnitShielded(battle, unit),
          );
          const dynamoWardActive = Boolean(
            unit?.definitionId === "rustmire-engine" && isUnitShielded(battle, unit),
          );
          const attackOrigin = Boolean(battle.lastAttack && samePosition(position, battle.lastAttack.from));
          const attackImpact = Boolean(
            battle.lastAttack
            && !attackEffectHasArea(battle.lastAttack.visual)
            && samePosition(position, battle.lastAttack.to),
          );
          const attackVisual = battle.lastAttack?.visual
            ?? (battle.lastAttack?.attackType === "special" ? "magic" : "physical");
          const label = wall
            ? `Wall, blocked, ${terrain} territory, column ${position.x + 1}, row ${position.y + 1}`
            : gap
            ? `Gap, blocks movement but not projectiles, ${terrain} territory, column ${position.x + 1}, row ${position.y + 1}`
            : unit
            ? `${unit.name}, ${formatWholeAmount(unit.hp)} of ${formatWholeAmount(maximumHp!)} health, ${terrain} territory`
            : `${terrain} territory, column ${position.x + 1}, row ${position.y + 1}`;

          return (
            <button
              className={`board-tile zone-${terrain} ${wall ? "raid-wall" : ""} ${gap ? "raid-gap" : ""} ${gap && board.gapTheme === "murky-water" ? "raid-gap-murky-water" : ""} ${gap && board.gapTheme === "ocean" ? "raid-gap-ocean" : ""} ${blueGap ? "raid-gap-blue-water" : ""} ${acidOoze ? "has-acid-ooze" : ""} ${isUnitAnchor && largeUnit ? "large-unit-anchor" : ""} ${unit?.id === battle.deploymentUnitId ? "deployment-selected" : ""} ${deploymentOption ? "deployment-option" : ""} ${actionable ? "actionable" : ""} ${attackOrigin ? "attack-origin" : ""} ${attackImpact ? "attack-impact" : ""}`}
              key={`${position.x}-${position.y}`}
              onClick={() => onTile(position)}
              onContextMenu={(event) => {
                event.preventDefault();
                if (battle.status === "fighting" && manualEnabled) onSecondaryTile(position);
              }}
              type="button"
              role="gridcell"
              aria-label={label}
            >
              {!wall && !gap && (
                <span
                  aria-hidden="true"
                  className={`raid-floor-art raid-floor-variant-${graveyardFloorVariant}`}
                >
                  <Sprite name={floorSprite} />
                </span>
              )}
              {!wall && !gap && decoration && (
                <span aria-hidden="true" className={`raid-decoration raid-decoration-${decoration.kind}`}>
                  <Sprite name={decoration.kind as SpriteName} />
                </span>
              )}
              {acidOoze && <span aria-hidden="true" className="acid-ooze-pool"><i /><i /><i /></span>}
              {gap && (
                <span aria-hidden="true" className="raid-gap-art">
                  <Sprite name={board.gapTheme === "ocean"
                    ? "raidWaterOcean"
                    : board.gapTheme === "murky-water"
                      ? blueGap ? "raidWaterBlue" : "raidWaterMurky"
                      : "raidGap"} />
                </span>
              )}
              {attackOrigin && <span aria-hidden="true" className={`attack-windup attack-windup-${attackVisual}`} key={`windup-${battle.actionCount}`} />}
              {attackImpact && <span aria-hidden="true" className={`attack-hit-flash attack-impact-${attackVisual}`} key={`impact-${battle.actionCount}`} />}
              {wall ? (
                <span className="raid-wall-art"><Sprite name={wallSprite} /></span>
              ) : isUnitAnchor && unit && (
                <span
                  className={`unit-label unit-kind-${unit.definitionId} unit-facing-${unit.facing ?? (unit.team === "player" ? "right" : "left")} ${attackOrigin ? `attack-motion-${attackVisual}` : ""} ${footprintClass} ${unit.definitionId === "skeleton-king" && undeadWardActive ? "undead-force-field" : ""} ${summonWardActive ? "beast-force-field" : ""} ${tentacleWardActive ? "squid-force-field" : ""} ${dynamoWardActive ? "dynamo-force-field" : ""}`}
                  style={footprintStyle}
                >
                  <span
                    aria-label={`${unit.name} health`}
                    aria-valuemax={100}
                    aria-valuemin={0}
                    aria-valuenow={Math.round(unit.hp.div(maximumHp!).mul(100).toNumber())}
                    className="tile-health-bar"
                    role="progressbar"
                  >
                    <span
                      className="tile-health-fill"
                      style={{ width: `${Math.max(0, Math.min(100, unit.hp.div(maximumHp!).mul(100).toNumber()))}%` }}
                    />
                  </span>
                  <span className={`entity-frame entity-${unit.team === "player" ? "friendly" : "hostile"}`}>
                    <Sprite name={unit.team === "player"
                      ? playerSprite(unit.definitionId as PlayerId)
                      : enemySprite(unit.definitionId)} />
                  </span>
                  {unit.paralyzedTurns > 0 && (
                    <span aria-label={`${unit.name} is paralyzed`} className="paralysis-status">⚡</span>
                  )}
                  {unit.corrosionTurns > 0 && (
                    <span aria-label={`${unit.name} is corroding`} className="corrosion-status">
                      <i /><i /><i />
                    </span>
                  )}
                  {unit.summonCaged && (
                    <span aria-hidden="true" className="summon-cage"><Sprite name="summonCage" /></span>
                  )}
                </span>
              )}
            </button>
          );
        })}
          </div>
        </div>
        {largeBoard && (
          <div className="battle-camera-controls" aria-label="Battle camera controls">
            {battle.status !== "deploying" && (
              <div className="battle-perspectives" aria-label="Follow party member">
                {playerUnits.map((unit) => (
                  <button
                    aria-pressed={perspectiveId === unit.id}
                    className={perspectiveId === unit.id ? "is-active" : ""}
                    key={unit.id}
                    onClick={() => {
                      const lockingPerspective = perspectiveId !== unit.id;
                      setPerspectiveId(lockingPerspective ? unit.id : null);
                      if (lockingPerspective && unit.position.x >= 0) {
                        setCameraCenter({ ...unit.position });
                      }
                    }}
                    type="button"
                  >
                    {unit.name}
                  </button>
                ))}
              </div>
            )}
            <div className="battle-camera-pan" aria-label="Pan camera">
              <button className="camera-up" aria-label="Pan camera up" disabled={zoomedOut} onClick={() => panCamera(0, -1)} type="button">↑</button>
              <button className="camera-left" aria-label="Pan camera left" disabled={zoomedOut} onClick={() => panCamera(-1, 0)} type="button">←</button>
              <button className="camera-right" aria-label="Pan camera right" disabled={zoomedOut} onClick={() => panCamera(1, 0)} type="button">→</button>
              <button className="camera-down" aria-label="Pan camera down" disabled={zoomedOut} onClick={() => panCamera(0, 1)} type="button">↓</button>
            </div>
            <button
              aria-label={zoomedOut ? "Zoom in" : "Zoom out"}
              className="battle-camera-zoom"
              onClick={() => setZoomedOut((current) => !current)}
              title={zoomedOut ? "Zoom in" : "Zoom out"}
              type="button"
            >
              {zoomedOut ? "+" : "−"}
            </button>
          </div>
        )}
        </div>

      {(battle.status === "won" || battle.status === "lost") && (
        <p className="battle-result">
          <strong>{battle.status === "won" ? "Victory" : "Defeat"}</strong>
          {battle.status === "won" ? " — Battle boss defeated." : " — Party defeated."}
        </p>
      )}
    </section>
  );
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function samePosition(left: Position, right: Position): boolean {
  return left.x === right.x && left.y === right.y;
}

function unitVisualCenter(unit: BattleState["units"][number]): Position {
  return {
    x: unit.position.x - Math.floor((unit.footprintWidth - 1) / 2) + unit.footprintWidth / 2,
    y: unit.position.y - Math.floor((unit.footprintHeight - 1) / 2) + unit.footprintHeight / 2,
  };
}
