import Decimal from "break_eternity.js";
import { physicalDamage } from "@/game/combat";
import { formatWholeAmount } from "@/game/numbers";
import type { HorizontalFacing, Position, Stats } from "@/game/types";
import { createMiningEnemy } from "./enemies";
import { createMiningRoom, MAX_MINING_ROOM, type MiningRandom } from "./generation";
import type { MiningEnemy, MiningResult, MiningRock, MiningState } from "./types";

const ZERO = new Decimal(0);

export function miningPower(attack: Decimal): Decimal {
  return Decimal.max(1, attack).pow(0.65).mul(1.8);
}

export function miningMoveRate(speed: Decimal): Decimal {
  return Decimal.max(1, speed).pow(0.35).mul(1.15);
}

export function frontierMiningRocks(state: MiningState): MiningRock[] {
  if (state.enemy || state.status !== "running") return [];
  const reachable = reachableFloorKeys(state);
  return Object.values(state.rocks).filter((rock) =>
    neighbors(rock.position).some((position) => reachable.has(positionKey(position)))
  );
}

export function selectMiningRock(
  state: MiningState,
  rockId: string,
): { state: MiningState; error?: string } {
  if (state.status !== "running") return { state, error: "This mining run has ended." };
  if (state.enemy) return { state, error: `Defeat the ${state.enemy.name} before mining another rock.` };
  const rock = state.rocks[rockId];
  if (!rock) return { state, error: "That rock has already been cleared." };
  const reachable = reachableFloorKeys(state);
  const approach = neighbors(rock.position)
    .filter((position) => reachable.has(positionKey(position)))
    .sort((a, b) => distance(a, state.playerPosition) - distance(b, state.playerPosition))[0];
  if (!approach) return { state, error: "Clear a path to that rock first." };
  return {
    state: {
      ...state,
      activeRockId: rockId,
      movementProgress: ZERO,
    },
  };
}

export function enterNextMiningRoom(
  state: MiningState,
  stats: Stats,
  random: MiningRandom = Math.random,
): { state: MiningState; error?: string; limitReached?: boolean } {
  if (!state.doorRevealed) return { state, error: "The room's door is still hidden behind rock." };
  if (!state.hasKey) return { state, error: "Find this room's key before opening the door." };
  if (state.enemy) return { state, error: `Defeat the ${state.enemy.name} first.` };
  if (!samePosition(state.playerPosition, state.doorPosition)) {
    return { state, error: "The miner is still walking to the door." };
  }
  if (state.roomNumber >= MAX_MINING_ROOM) {
    return {
      state: {
        ...state,
        status: "exhausted" as const,
        activeRockId: null,
        movementProgress: ZERO,
        log: ["The tunnel beyond Room 10 is blocked. Mining ended.", ...state.log].slice(0, 8),
      },
      limitReached: true,
    };
  }
  return {
    state: createMiningRoom(
      state.memberId,
      state.roomNumber + 1,
      stats,
      random,
      entranceAcrossFromDoor(state),
    ),
  };
}

export function attackMiningEnemy(
  state: MiningState,
  stats: Stats,
  currentHp: Decimal,
  currentStamina: Decimal,
): MiningResult {
  const enemy = state.enemy;
  if (!enemy || state.status !== "running") return unchangedResult(state, currentHp, currentStamina);
  const next = cloneMiningState(state);
  next.playerFacing = horizontalFacing(
    state.playerPosition,
    enemy.position,
    state.playerFacing ?? "right",
  );
  if (next.enemy) {
    next.enemy.facing = horizontalFacing(
      enemy.position,
      state.playerPosition,
      enemy.facing ?? "left",
    );
  }
  const playerDamage = physicalDamage(stats.attack, enemy.defense);
  const remainingEnemyHp = Decimal.max(0, enemy.hp.sub(playerDamage));
  if (remainingEnemyHp.lte(0)) {
    next.enemy = null;
    next.playerPosition = { ...enemy.position };
    next.combatProgress = ZERO;
    next.movementProgress = ZERO;
    next.log = [`Defeated ${indefiniteEnemyName(enemy.name)}.`, ...next.log].slice(0, 8);
    return {
      state: next,
      hp: currentHp,
      stamina: currentStamina,
      goldGained: ZERO,
      defeatedEnemyId: enemy.definitionId,
      died: false,
      exhausted: false,
    };
  }
  next.enemy = { ...enemy, hp: remainingEnemyHp };
  const enemyDamage = physicalDamage(enemy.attack, stats.defense);
  const hp = Decimal.max(0, currentHp.sub(enemyDamage));
  if (hp.lte(0)) {
    next.status = "dead";
    next.activeRockId = null;
    next.movementProgress = ZERO;
    next.log = [`${state.memberId === "miner" ? "Miner" : "The deployed member"} was defeated by ${indefiniteEnemyName(enemy.name)}.`, ...next.log].slice(0, 8);
  }
  return { state: next, hp, stamina: currentStamina, goldGained: ZERO, died: hp.lte(0), exhausted: false };
}

export function advanceMining(
  state: MiningState,
  stats: Stats,
  currentHp: Decimal,
  currentStamina: Decimal,
  seconds: number,
  autoMode: boolean,
  random: MiningRandom = Math.random,
): MiningResult {
  if (state.status !== "running") return unchangedResult(state, currentHp, currentStamina);
  if (state.enemy) {
    if (!autoMode) return unchangedResult(state, currentHp, currentStamina);
    const next = cloneMiningState(state);
    next.combatProgress = next.combatProgress.add(
      Decimal.max(1, stats.speed).div(8).mul(Math.max(0, seconds)),
    );
    if (next.combatProgress.lt(1)) return unchangedResult(next, currentHp, currentStamina);
    next.combatProgress = next.combatProgress.sub(1);
    const attacked = attackMiningEnemy(next, stats, currentHp, currentStamina);
    attacked.state.combatProgress = next.combatProgress;
    return attacked;
  }
  if (state.doorRevealed && state.hasKey) {
    return advanceTowardDoor(state, stats, currentHp, currentStamina, seconds, random);
  }
  if (state.activeRockId) return mineSelectedRock(state, stats, currentHp, currentStamina, seconds);
  if (!autoMode) return unchangedResult(state, currentHp, currentStamina);
  const choices = frontierMiningRocks(state);
  if (choices.length === 0) return unchangedResult(state, currentHp, currentStamina);
  const perimeterDistance = state.hasKey && !state.doorRevealed
    ? Math.min(...choices.map((rock) => distanceToPerimeterRockLayer(state, rock.position)))
    : null;
  // Once the key is secured, every useful unknown is along the outer rock
  // layer. Prefer a reachable edge rock, or the frontier rock that most
  // directly extends the current tunnel toward that layer.
  const purposefulChoices = perimeterDistance === null
    ? choices
    : choices.filter((rock) => distanceToPerimeterRockLayer(state, rock.position) === perimeterDistance);
  const distances = purposefulChoices.map((rock) => ({ rock, distance: pathToRock(state, rock)?.length ?? Infinity }));
  const nearestDistance = Math.min(...distances.map((candidate) => candidate.distance));
  const nearby = distances.filter((candidate) => candidate.distance <= nearestDistance + 1);
  const selected = nearby[Math.min(
    nearby.length - 1,
    Math.floor(Math.max(0, Math.min(0.999999, random())) * nearby.length),
  )]?.rock ?? purposefulChoices[0];
  const selectedResult = selectMiningRock(state, selected.id);
  return unchangedResult(selectedResult.state, currentHp, currentStamina);
}

function advanceTowardDoor(
  state: MiningState,
  stats: Stats,
  currentHp: Decimal,
  currentStamina: Decimal,
  seconds: number,
  random: MiningRandom,
): MiningResult {
  if (samePosition(state.playerPosition, state.doorPosition)) {
    const advanced = enterNextMiningRoom(state, stats, random);
    const depthLimitReached = Boolean(advanced.limitReached);
    return {
      state: advanced.state,
      hp: currentHp,
      stamina: depthLimitReached ? ZERO : currentStamina,
      goldGained: ZERO,
      died: false,
      exhausted: depthLimitReached,
      roomAdvanced: !advanced.error && !depthLimitReached,
      depthLimitReached,
    };
  }
  const path = shortestMiningPath(state, [state.doorPosition]);
  if (!path || path.length === 0) return unchangedResult(state, currentHp, currentStamina);
  const next = cloneMiningState(state);
  next.activeRockId = null;
  next.movementProgress = next.movementProgress.add(
    miningMoveRate(stats.speed).mul(Math.max(0, seconds)),
  );
  if (next.movementProgress.lt(1)) return unchangedResult(next, currentHp, currentStamina);
  next.playerFacing = horizontalFacing(
    state.playerPosition,
    path[0],
    state.playerFacing ?? "right",
  );
  next.playerPosition = { ...path[0] };
  next.movementProgress = next.movementProgress.sub(1);
  return unchangedResult(next, currentHp, currentStamina);
}

function mineSelectedRock(
  state: MiningState,
  stats: Stats,
  currentHp: Decimal,
  currentStamina: Decimal,
  seconds: number,
): MiningResult {
  const rock = state.activeRockId ? state.rocks[state.activeRockId] : undefined;
  if (!rock) return unchangedResult({ ...state, activeRockId: null, movementProgress: ZERO }, currentHp, currentStamina);
  if (distance(state.playerPosition, rock.position) !== 1) {
    const path = pathToRock(state, rock);
    if (!path) {
      return unchangedResult({ ...state, activeRockId: null, movementProgress: ZERO }, currentHp, currentStamina);
    }
    const next = cloneMiningState(state);
    next.movementProgress = next.movementProgress.add(
      miningMoveRate(stats.speed).mul(Math.max(0, seconds)),
    );
    if (next.movementProgress.lt(1) || path.length === 0) return unchangedResult(next, currentHp, currentStamina);
    next.playerFacing = horizontalFacing(
      state.playerPosition,
      path[0],
      state.playerFacing ?? "right",
    );
    next.playerPosition = { ...path[0] };
    next.movementProgress = next.movementProgress.sub(1);
    if (distance(next.playerPosition, rock.position) === 1) next.movementProgress = ZERO;
    return unchangedResult(next, currentHp, currentStamina);
  }
  const next = cloneMiningState(state);
  const nextRock = next.rocks[rock.id];
  nextRock.durability = Decimal.max(
    0,
    nextRock.durability.sub(miningPower(stats.attack).mul(Math.max(0, seconds))),
  );
  if (nextRock.durability.gt(0)) return unchangedResult(next, currentHp, currentStamina);

  delete next.rocks[rock.id];
  next.tiles[rock.position.y][rock.position.x] = { kind: "floor" };
  next.activeRockId = null;
  next.movementProgress = ZERO;
  next.staminaRockProgress = (next.staminaRockProgress + 1) % 5;
  const stamina = next.staminaRockProgress === 0
    ? Decimal.max(0, currentStamina.sub(1))
    : currentStamina;
  let goldGained = ZERO;
  if (rock.hidesDoor) {
    next.doorRevealed = true;
    next.tiles[next.doorPosition.y][next.doorPosition.x] = { kind: "door" };
    next.log = ["Found the room door behind the rock.", ...next.log].slice(0, 8);
  }
  if (rock.content === "enemy") {
    next.enemy = createMiningEnemy(next.roomNumber, rock.position);
    next.enemy.facing = horizontalFacing(
      rock.position,
      next.playerPosition,
      next.enemy.facing ?? "left",
    );
    next.combatProgress = ZERO;
    const enemyName = indefiniteEnemyName(next.enemy.name);
    next.log = [`${enemyName[0]?.toUpperCase()}${enemyName.slice(1)} emerged from the rock.`, ...next.log].slice(0, 8);
  } else {
    next.playerFacing = horizontalFacing(
      state.playerPosition,
      rock.position,
      state.playerFacing ?? "right",
    );
    next.playerPosition = { ...rock.position };
    if (rock.content === "gold") {
      goldGained = rock.goldAmount ?? ZERO;
      next.log = [`Mined ${formatWholeAmount(goldGained)} gold.`, ...next.log].slice(0, 8);
    } else if (rock.content === "key") {
      next.hasKey = true;
      next.log = ["Found the room key inside a rock.", ...next.log].slice(0, 8);
    }
  }
  const exhausted = stamina.lte(0);
  if (exhausted) {
    next.status = "exhausted";
    next.activeRockId = null;
    next.movementProgress = ZERO;
    next.log = ["Stamina ran out after breaking the rock. Mining ended.", ...next.log].slice(0, 8);
  }
  return { state: next, hp: currentHp, stamina, goldGained, died: false, exhausted };
}

function reachableFloorKeys(state: MiningState): Set<string> {
  const queue = [{ ...state.playerPosition }];
  const visited = new Set<string>();
  while (queue.length > 0) {
    const position = queue.shift();
    if (!position) break;
    const key = positionKey(position);
    if (visited.has(key)) continue;
    const tile = state.tiles[position.y]?.[position.x];
    if (!tile || !["floor", "entrance", "door"].includes(tile.kind)) continue;
    visited.add(key);
    queue.push(...neighbors(position).filter((neighbor) =>
      neighbor.x >= 0 && neighbor.y >= 0 && neighbor.x < state.width && neighbor.y < state.height
    ));
  }
  return visited;
}

function pathToRock(state: MiningState, rock: MiningRock): Position[] | null {
  const targets = neighbors(rock.position).filter((position) => isMiningFloor(state, position));
  return shortestMiningPath(state, targets);
}

function shortestMiningPath(state: MiningState, targets: Position[]): Position[] | null {
  const targetKeys = new Set(targets.map(positionKey));
  const startKey = positionKey(state.playerPosition);
  if (targetKeys.has(startKey)) return [];
  const queue = [{ ...state.playerPosition }];
  const visited = new Set([startKey]);
  const previous = new Map<string, Position>();
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) break;
    for (const next of neighbors(current)) {
      const key = positionKey(next);
      if (visited.has(key) || !isMiningFloor(state, next)) continue;
      visited.add(key);
      previous.set(key, current);
      if (targetKeys.has(key)) {
        const path = [next];
        let cursor = current;
        while (!samePosition(cursor, state.playerPosition)) {
          path.unshift(cursor);
          const parent = previous.get(positionKey(cursor));
          if (!parent) return null;
          cursor = parent;
        }
        return path;
      }
      queue.push(next);
    }
  }
  return null;
}

function isMiningFloor(state: MiningState, position: Position): boolean {
  if (position.x < 0 || position.y < 0 || position.x >= state.width || position.y >= state.height) {
    return false;
  }
  return ["floor", "entrance", "door"].includes(state.tiles[position.y]?.[position.x]?.kind ?? "wall");
}

function cloneMiningState(state: MiningState): MiningState {
  return {
    ...state,
    tiles: state.tiles.map((row) => row.map((tile) => ({ ...tile }))),
    rocks: Object.fromEntries(Object.entries(state.rocks).map(([id, rock]) => [id, { ...rock }])),
    enemy: state.enemy ? { ...state.enemy, position: { ...state.enemy.position } } : null,
    playerPosition: { ...state.playerPosition },
    doorPosition: { ...state.doorPosition },
    log: [...state.log],
  };
}

function unchangedResult(state: MiningState, hp: Decimal, stamina: Decimal): MiningResult {
  return { state, hp, stamina, goldGained: ZERO, died: false, exhausted: false };
}

function neighbors(position: Position): Position[] {
  return [
    { x: position.x, y: position.y - 1 },
    { x: position.x + 1, y: position.y },
    { x: position.x, y: position.y + 1 },
    { x: position.x - 1, y: position.y },
  ];
}

function positionKey(position: Position): string {
  return `${position.x},${position.y}`;
}

function distance(a: Position, b: Position): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function distanceToPerimeterRockLayer(state: MiningState, position: Position): number {
  return Math.min(
    Math.abs(position.x - 1),
    Math.abs(position.y - 1),
    Math.abs(position.x - (state.width - 2)),
    Math.abs(position.y - (state.height - 2)),
  );
}

function horizontalFacing(
  from: Position,
  toward: Position,
  current: HorizontalFacing,
): HorizontalFacing {
  if (toward.x < from.x) return "left";
  if (toward.x > from.x) return "right";
  return current;
}

function samePosition(a: Position, b: Position): boolean {
  return a.x === b.x && a.y === b.y;
}

function indefiniteEnemyName(name: string): string {
  return `${/^[aeiou]/i.test(name) ? "an" : "a"} ${name}`;
}

function entranceAcrossFromDoor(state: MiningState): Position {
  if (state.doorPosition.y === 0) {
    return { x: state.doorPosition.x, y: state.height - 1 };
  }
  if (state.doorPosition.y === state.height - 1) {
    return { x: state.doorPosition.x, y: 0 };
  }
  if (state.doorPosition.x === 0) {
    return { x: state.width - 1, y: state.doorPosition.y };
  }
  return { x: 0, y: state.doorPosition.y };
}
