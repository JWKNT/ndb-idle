import type { Position } from "@/game/types";
import type { AdventureState, DungeonRoom, ExitDirection } from "./types";
import { repairAdventureFrontier } from "./exitPlanning";
import {
  DIRECTIONS,
  DIRECTION_OFFSETS,
  directionBetween,
  oppositeDirection,
  parsePositionKey,
  positionKey,
  ringForPosition,
  roomKey,
} from "./geometry";

export function beginCartographerSurvey(state: AdventureState): AdventureState {
  if ((state.cartographerSurveyTargets?.length ?? 0) > 0) return state;
  const occupied = new Set(Object.keys(state.rooms));
  const paths: Position[][] = [];
  const anchors = Object.values(state.rooms)
    .filter((room) => room.kind === "normal")
    .sort((left, right) => right.number - left.number);

  for (const maxRing of [2, 3]) {
    for (const anchor of anchors) {
      if (paths.length >= 3) break;
      const path = reserveSurveyPath(
        anchor.position,
        2 + (paths.length % 3),
        occupied,
        maxRing,
        paths.length,
        state.dungeonSeed ?? 0,
      );
      if (!path) continue;
      paths.push(path);
      for (const position of path.slice(1)) occupied.add(roomKey(position));
    }
    if (paths.length >= 3) break;
  }

  // This fallback is intentionally permissive: the quest must never begin
  // with fewer than three reachable marks, even in an older cramped run.
  let fallbackAnchor = anchors[0]?.position ?? state.rooms[state.currentRoomKey].position;
  while (paths.length < 3) {
    const path = reserveSurveyPath(fallbackAnchor, 2, occupied, 99, paths.length + 11, state.dungeonSeed ?? 0);
    if (!path) break;
    paths.push(path);
    for (const position of path.slice(1)) occupied.add(roomKey(position));
    fallbackAnchor = path[path.length - 1];
  }
  const targets = paths.map((path) => path[path.length - 1]);
  return repairAdventureFrontier({
    ...state,
    cartographerSurveyTargets: targets,
    cartographerSurveyVisited: [],
    cartographerSurveyPaths: paths,
    cartographerQuestActive: false,
    log: ["The Cartographer marked three survey points on the map.", ...state.log].slice(0, 8),
  });
}

function reserveSurveyPath(
  anchor: Position,
  length: number,
  occupied: Set<string>,
  maxRing: number,
  salt: number,
  dungeonSeed: number,
): Position[] | null {
  const path: Position[] = [{ ...anchor }];
  const used = new Set<string>([roomKey(anchor)]);
  const search = (position: Position, remaining: number): boolean => {
    if (remaining === 0) return true;
    const ordered = [...DIRECTIONS].sort((left, right) =>
      surveyDirectionScore(anchor, position, left, salt, dungeonSeed) - surveyDirectionScore(anchor, position, right, salt, dungeonSeed)
    );
    for (const direction of ordered) {
      const offset = DIRECTION_OFFSETS[direction];
      const next = { x: position.x + offset.x, y: position.y + offset.y };
      const key = roomKey(next);
      if (occupied.has(key) || used.has(key)) continue;
      const ring = ringForPosition(next);
      if (ring === 0 || ring > maxRing) continue;
      used.add(key);
      path.push(next);
      if (search(next, remaining - 1)) return true;
      path.pop();
      used.delete(key);
    }
    return false;
  };
  return search(anchor, length) ? path : null;
}

function surveyDirectionScore(
  anchor: Position,
  position: Position,
  direction: ExitDirection,
  salt: number,
  dungeonSeed: number,
): number {
  const offset = DIRECTION_OFFSETS[direction];
  const next = { x: position.x + offset.x, y: position.y + offset.y };
  const outward = -(Math.abs(next.x - anchor.x) + Math.abs(next.y - anchor.y)) * 1000;
  return outward + chalkEdgeScore({ x: salt, y: salt }, position, next, dungeonSeed);
}

export function recordCartographerVisit(state: AdventureState, position: { x: number; y: number }): AdventureState {
  const targets = state.cartographerSurveyTargets ?? [];
  if (!targets.some((target) => positionKey(target) === positionKey(position))) return state;
  const visited = state.cartographerSurveyVisited ?? [];
  if (visited.some((target) => positionKey(target) === positionKey(position))) return state;
  return repairAdventureFrontier({
    ...state,
    cartographerSurveyVisited: [...visited, { ...position }],
    log: [`Survey point ${visited.length + 1}/${targets.length} reached.`, ...state.log].slice(0, 8),
  });
}

export function cartographerSurveyReady(state: AdventureState): boolean {
  const targets = state.cartographerSurveyTargets ?? [];
  const visited = state.cartographerSurveyVisited ?? [];
  return targets.length === 3 && targets.every((target) => visited.some((position) => positionKey(position) === positionKey(target)));
}

export function revealChalkArea(state: AdventureState): AdventureState {
  const center = state.rooms[state.currentRoomKey]?.position;
  if (!center) return state;
  const planned = planChalkMap(state, center);
  return repairAdventureFrontier({
    ...state,
    chalkRevealedPositions: planned.positions,
    chalkMappedExits: planned.exits,
    log: [`${state.playerName} used Mapmaker's Chalk and revealed a 5×5 area.`, ...state.log].slice(0, 8),
  });
}

/**
 * Chalk plans persistent room topology instead of painting vague placeholders.
 * Rooms are still instantiated when crossed, so mapped rooms do not count as
 * explored and cannot trigger encounters or rewards early.
 */
function planChalkMap(
  state: AdventureState,
  center: Position,
): { positions: Position[]; exits: Record<string, ExitDirection[]> } {
  const area: Position[] = [];
  for (let y = center.y - 2; y <= center.y + 2; y += 1) {
    for (let x = center.x - 2; x <= center.x + 2; x += 1) area.push({ x, y });
  }
  const areaKeys = new Set(area.map(roomKey));
  const exits = Object.fromEntries(
    Object.entries(state.chalkMappedExits ?? {}).map(([key, directions]) => [key, [...directions]]),
  ) as Record<string, ExitDirection[]>;
  const previouslyVisibleKeys = new Set([
    ...areaKeys,
    ...(state.chalkRevealedPositions ?? []).map(roomKey),
    ...Object.keys(state.rooms),
  ]);
  const addConnection = (from: Position, to: Position) => {
    const direction = directionBetween(from, to);
    if (!direction) return;
    addExit(exits, roomKey(from), direction);
    addExit(exits, roomKey(to), oppositeDirection(direction));
  };

  // Saved or overlapping chalk maps can contain an edge recorded on only one
  // endpoint. Treat every visible mapped tunnel as an undirected connection
  // before measuring reachability, otherwise the planner may consider a room
  // connected without ever drawing (or reserving) the matching tunnel.
  normalizeMappedConnections(exits, previouslyVisibleKeys);

  // Preserve every already-generated connection in the revealed square.
  for (const room of Object.values(state.rooms)) {
    if (!areaKeys.has(room.key)) continue;
    for (const exit of room.exits) {
      const offset = DIRECTION_OFFSETS[exit.direction];
      const neighbor = { x: room.position.x + offset.x, y: room.position.y + offset.y };
      if (areaKeys.has(roomKey(neighbor))) addConnection(room.position, neighbor);
    }
  }

  const reached = connectedMappedKeys(roomKey(center), exits, areaKeys);
  while (reached.size < areaKeys.size) {
    const candidates = area.flatMap((position) => DIRECTIONS.flatMap((direction) => {
      const offset = DIRECTION_OFFSETS[direction];
      const neighbor = { x: position.x + offset.x, y: position.y + offset.y };
      const fromKey = roomKey(position);
      const toKey = roomKey(neighbor);
      if (!areaKeys.has(toKey) || reached.has(fromKey) === reached.has(toKey)) return [];
      if (!canPlanExit(state.rooms[fromKey], direction)) return [];
      if (!canPlanExit(state.rooms[toKey], oppositeDirection(direction))) return [];
      return [{ from: position, to: neighbor, score: chalkEdgeScore(center, position, neighbor, state.dungeonSeed ?? 0) }];
    })).sort((left, right) => left.score - right.score);
    const selected = candidates[0];
    if (!selected) break;
    addConnection(selected.from, selected.to);
    for (const key of connectedMappedKeys(roomKey(center), exits, areaKeys)) reached.add(key);
  }

  const previous = state.chalkRevealedPositions ?? [];
  const mappedPositions = area.filter((position) => reached.has(roomKey(position)));
  const positions = [...previous];
  for (const position of mappedPositions) {
    if (!positions.some((candidate) => positionKey(candidate) === positionKey(position))) positions.push(position);
  }
  normalizeMappedConnections(exits, new Set([
    ...positions.map(roomKey),
    ...Object.keys(state.rooms),
  ]));
  return { positions, exits };
}

function canPlanExit(room: DungeonRoom | undefined, direction: ExitDirection): boolean {
  if (!room || room.kind === "normal") return true;
  return room.exits.some((exit) => exit.direction === direction);
}

function addExit(
  exits: Record<string, ExitDirection[]>,
  key: string,
  direction: ExitDirection,
): void {
  const roomExits = exits[key] ?? [];
  if (!roomExits.includes(direction)) exits[key] = [...roomExits, direction];
}

function normalizeMappedConnections(
  exits: Record<string, ExitDirection[]>,
  visibleKeys: Set<string>,
): void {
  for (const [key, directions] of Object.entries(exits)) {
    const position = parsePositionKey(key);
    for (const direction of [...directions]) {
      const offset = DIRECTION_OFFSETS[direction];
      const neighborKey = roomKey({
        x: position.x + offset.x,
        y: position.y + offset.y,
      });
      if (!visibleKeys.has(key) || !visibleKeys.has(neighborKey)) continue;
      addExit(exits, neighborKey, oppositeDirection(direction));
    }
  }
}

function connectedMappedKeys(
  startKey: string,
  exits: Record<string, ExitDirection[]>,
  allowed: Set<string>,
): Set<string> {
  const reached = new Set<string>([startKey]);
  const queue = [startKey];
  while (queue.length > 0) {
    const key = queue.shift()!;
    const position = parsePositionKey(key);
    for (const direction of exits[key] ?? []) {
      const offset = DIRECTION_OFFSETS[direction];
      const neighborKey = roomKey({ x: position.x + offset.x, y: position.y + offset.y });
      if (!allowed.has(neighborKey) || reached.has(neighborKey)) continue;
      reached.add(neighborKey);
      queue.push(neighborKey);
    }
  }
  return reached;
}

function chalkEdgeScore(center: Position, from: Position, to: Position, dungeonSeed: number): number {
  const seed = `${dungeonSeed}:${center.x},${center.y}:${Math.min(from.x, to.x)},${Math.min(from.y, to.y)}:${Math.max(from.x, to.x)},${Math.max(from.y, to.y)}`;
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}
