import Decimal from "break_eternity.js";
import type { PlayerId, Position, Stats } from "../types";
import {
  adventureEnemyName,
  adventureEnemyStats,
  enemyKindForAdventure,
} from "./enemies";
import type { AdventureState, AdventureTileKind, DungeonRoom } from "./types";

const ACTION_GAUGE = new Decimal(1_000);

export function adventurePlayerActorId(playerId: PlayerId): string {
  return `adventure-${playerId}`;
}

export function isAdventurePlayerTurn(state: AdventureState): boolean {
  return state.activeActorId === adventurePlayerActorId(state.playerId);
}

export function adventureTurnPreview(
  state: AdventureState,
  playerStats: Stats,
  count = 5,
): string[] {
  return adventurePartyTurnPreview([{ state, playerStats }], count);
}

export function adventurePartyTurnPreview(
  explorers: Array<{ state: AdventureState; playerStats: Stats }>,
  count = 5,
): string[] {
  if (count <= 0) return [];
  const timelines = explorers.flatMap(({ state, playerStats }, explorerIndex) => {
    if (!state.activeActorId) return [];
    const actors = adventureActors(state, currentRoom(state), playerStats);
    return [{
      actors,
      explorerIndex,
      times: { ...state.readyAt },
    }];
  });
  const preview: string[] = [];

  while (preview.length < count) {
    const candidates = timelines.flatMap((timeline) => {
      const actor = nextAdventureActor(timeline.actors, timeline.times);
      return actor ? [{ actor, timeline }] : [];
    });
    candidates.sort((a, b) =>
      (a.timeline.times[a.actor.id] ?? new Decimal(0)).cmp(
        b.timeline.times[b.actor.id] ?? new Decimal(0),
      )
      || b.actor.speed.cmp(a.actor.speed)
      || a.timeline.explorerIndex - b.timeline.explorerIndex
      || a.actor.id.localeCompare(b.actor.id)
    );
    const next = candidates[0];
    if (!next) break;
    preview.push(next.actor.name);
    next.timeline.times[next.actor.id] = (
      next.timeline.times[next.actor.id] ?? new Decimal(0)
    ).add(ACTION_GAUGE.div(next.actor.speed));
  }
  return preview;
}

interface AdventureActor {
  id: string;
  name: string;
  speed: Decimal;
}

export function initializeAdventureTimeline(state: AdventureState, playerStats: Stats): AdventureState {
  const actors = adventureActors(state, currentRoom(state), playerStats);
  const readyAt = Object.fromEntries(
    actors.map((actor) => [actor.id, ACTION_GAUGE.div(actor.speed)]),
  );
  return beginNextAdventureTurn({ ...state, readyAt, activeActorId: null }, playerStats);
}

export function refreshAdventureTimeline(state: AdventureState, playerStats: Stats): AdventureState {
  return initializeAdventureTimeline({ ...state, activeActorId: null, readyAt: {} }, playerStats);
}

export function beginNextAdventureTurn(state: AdventureState, playerStats: Stats): AdventureState {
  const actors = adventureActors(state, currentRoom(state), playerStats);
  const readyAt = { ...state.readyAt };
  for (const actor of actors) {
    if (!readyAt[actor.id]) readyAt[actor.id] = ACTION_GAUGE.div(actor.speed);
  }
  return {
    ...state,
    readyAt,
    activeActorId: nextAdventureActor(actors, readyAt)?.id ?? null,
  };
}

function adventureActors(state: AdventureState, room: DungeonRoom, playerStats: Stats): AdventureActor[] {
  const seenEnemyIds = new Set<string>();
  const enemies = findTiles(room, "enemy").flatMap((position) => {
    const tile = room.tiles[position.y][position.x];
    if (!tile.enemyId || seenEnemyIds.has(tile.enemyId)) return [];
    seenEnemyIds.add(tile.enemyId);
    const kind = tile.enemyKind ?? enemyKindForAdventure(state, room);
    const enemyStats = adventureEnemyStats(room.ring, kind);
    return (tile.enemyHp ?? enemyStats.hp).gt(0)
      ? [{
          id: tile.enemyId,
          name: adventureEnemyName(kind),
          speed: enemyStats.speed,
        }]
      : [];
  });
  return [
    {
      id: adventurePlayerActorId(state.playerId),
      name: state.playerName,
      speed: Decimal.max(1, playerStats.speed),
    },
    ...enemies,
  ];
}

function nextAdventureActor(
  actors: AdventureActor[],
  readyAt: Record<string, Decimal>,
): AdventureActor | undefined {
  return [...actors].sort(
    (a, b) =>
      (readyAt[a.id] ?? new Decimal(0)).cmp(readyAt[b.id] ?? new Decimal(0)) ||
      b.speed.cmp(a.speed) ||
      a.id.localeCompare(b.id),
  )[0];
}


export function completeActorTurn(
  state: AdventureState,
  actorId: string,
  playerStats: Stats,
): AdventureState {
  const actors = adventureActors(state, currentRoom(state), playerStats);
  const actor = actors.find((candidate) => candidate.id === actorId);
  const actorIds = new Set(actors.map((candidate) => candidate.id));
  const readyAt = Object.fromEntries(
    Object.entries(state.readyAt).filter(([id]) => actorIds.has(id)),
  );
  if (actor) {
    readyAt[actor.id] = (readyAt[actor.id] ?? new Decimal(0)).add(
      ACTION_GAUGE.div(actor.speed),
    );
  }
  return beginNextAdventureTurn({ ...state, readyAt, activeActorId: null }, playerStats);
}

function currentRoom(state: AdventureState): DungeonRoom {
  return state.rooms[state.currentRoomKey];
}

function findTiles(room: DungeonRoom, kind: AdventureTileKind): Position[] {
  const found: Position[] = [];
  for (let y = 0; y < room.height; y += 1) {
    for (let x = 0; x < room.width; x += 1) {
      if (room.tiles[y][x].kind === kind) found.push({ x, y });
    }
  }
  return found;
}
