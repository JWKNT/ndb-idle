import type {
  BattleHazard,
  BattleState,
  Position,
  Team,
  Unit,
} from "./types";

export function battleHazards(state: Pick<BattleState, "hazards">): BattleHazard[] {
  return state.hazards ?? [];
}

export function hazardAt(
  state: Pick<BattleState, "hazards">,
  positions: Position[],
  hostileTo?: Team,
): BattleHazard | undefined {
  const keys = new Set(positions.map(positionKey));
  return battleHazards(state).find((hazard) =>
    hazard.remainingActions > 0
    && keys.has(positionKey(hazard.position))
    && (hostileTo === undefined || hazard.sourceTeam !== hostileTo)
  );
}

export function decayBattleHazards(hazards: BattleHazard[]): BattleHazard[] {
  return hazards
    .map((hazard) => ({ ...hazard, remainingActions: hazard.remainingActions - 1 }))
    .filter((hazard) => hazard.remainingActions > 0);
}

export function createOozeBelchHazards(
  state: BattleState,
  source: Unit,
  random: () => number,
): BattleHazard[] {
  const belch = source.oozeBelch;
  if (!belch) return [];

  const board = state.level.board;
  const wallKeys = new Set(board.walls.map(positionKey));
  const gapKeys = new Set((board.gaps ?? []).map(positionKey));
  const sourceKeys = new Set(occupiedPositions(source).map(positionKey));
  const existingKeys = new Set(battleHazards(state).map((hazard) => positionKey(hazard.position)));
  const candidates: Position[] = [];

  for (let y = 0; y < board.height; y += 1) {
    for (let x = 0; x < board.width; x += 1) {
      const position = { x, y };
      const key = positionKey(position);
      if (wallKeys.has(key) || gapKeys.has(key) || sourceKeys.has(key) || existingKeys.has(key)) continue;
      const distance = Math.min(...occupiedPositions(source).map((tile) => manhattan(tile, position)));
      if (distance >= 1 && distance <= belch.radius) candidates.push(position);
    }
  }

  shuffleInPlace(candidates, random);
  const spread = Math.max(0, belch.maxTiles - belch.minTiles + 1);
  const requested = belch.minTiles + (spread > 1 ? randomIndex(spread, random) : 0);
  return candidates.slice(0, requested).map((position, index) => ({
    id: `acid-ooze-${source.id}-${state.actionCount + 1}-${index + 1}`,
    kind: "acid-ooze" as const,
    position,
    sourceTeam: source.team,
    remainingActions: belch.poolDurationActions,
    corrosionTurns: belch.corrosionTurns,
    damagePerTurn: belch.damagePerTurn,
  }));
}

function occupiedPositions(unit: Unit): Position[] {
  const startX = unit.position.x - Math.floor((unit.footprintWidth - 1) / 2);
  const startY = unit.position.y - Math.floor((unit.footprintHeight - 1) / 2);
  return Array.from({ length: unit.footprintWidth * unit.footprintHeight }, (_, index) => ({
    x: startX + index % unit.footprintWidth,
    y: startY + Math.floor(index / unit.footprintWidth),
  }));
}

function shuffleInPlace<T>(values: T[], random: () => number): void {
  for (let index = values.length - 1; index > 0; index -= 1) {
    const swapIndex = randomIndex(index + 1, random);
    [values[index], values[swapIndex]] = [values[swapIndex], values[index]];
  }
}

function randomIndex(length: number, random: () => number): number {
  if (length <= 1) return 0;
  return Math.min(length - 1, Math.max(0, Math.floor(random() * length)));
}

function manhattan(left: Position, right: Position): number {
  return Math.abs(left.x - right.x) + Math.abs(left.y - right.y);
}

function positionKey(position: Position): string {
  return `${position.x},${position.y}`;
}
