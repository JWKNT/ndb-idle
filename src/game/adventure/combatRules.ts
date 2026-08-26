import Decimal from "break_eternity.js";
import { getPlayer } from "@/content/players";
import { TRIDENT_THROW_RANGE } from "@/game/gear";
import type {
  HorizontalFacing,
  Position,
  WeaponAbilityId,
} from "@/game/types";
import { weaponSkill } from "@/game/weapon-skills";
import {
  isOnRoom,
  manhattanDistance as manhattanRoomDistance,
  positionKey,
  positionsEqual,
} from "./geometry";
import type {
  AdventureState,
  AdventureTile,
  AdventureTileKind,
  DungeonRoom,
  ExitDirection,
  RandomSource,
} from "./types";

export function twoTileFootprint(anchor: Position, facing: ExitDirection): Position[] {
  return facing === "east" || facing === "west"
    ? [anchor, { x: anchor.x + 1, y: anchor.y }]
    : [anchor, { x: anchor.x, y: anchor.y + 1 }];
}

export function facingFromOffset(offset: Position): ExitDirection {
  if (Math.abs(offset.x) >= Math.abs(offset.y)) return offset.x < 0 ? "west" : "east";
  return offset.y < 0 ? "north" : "south";
}

export function facingToward(from: Position, toward: Position): ExitDirection {
  return facingFromOffset({ x: toward.x - from.x, y: toward.y - from.y });
}

export function horizontalFacing(
  from: Position,
  toward: Position,
  current: HorizontalFacing,
): HorizontalFacing {
  if (toward.x < from.x) return "left";
  if (toward.x > from.x) return "right";
  return current;
}

export function setEnemySpriteFacing(
  room: DungeonRoom,
  enemyId: string | undefined,
  fallbackPosition: Position,
  facing: HorizontalFacing,
): void {
  const footprint = enemyId
    ? enemyFootprint(room, enemyId, fallbackPosition)
    : [fallbackPosition];
  for (const position of footprint) {
    const tile = room.tiles[position.y]?.[position.x];
    if (tile?.kind === "enemy") {
      room.tiles[position.y][position.x] = { ...tile, spriteFacing: facing };
    }
  }
}

export function isInPlayerAttackRange(
  state: AdventureState,
  room: DungeonRoom,
  target: Position,
): boolean {
  const player = getPlayer(state.playerId);
  const range = Math.max(1, player.attackRange ?? 1);
  const deltaX = Math.abs(state.playerPosition.x - target.x);
  const deltaY = Math.abs(state.playerPosition.y - target.y);
  const sameRow = state.playerPosition.y === target.y;
  const sameColumn = state.playerPosition.x === target.x;
  const diagonal = deltaX === deltaY;
  const eightWay = player.attackPattern === "eight-way";
  if (!sameRow && !sameColumn && !(eightWay && diagonal)) return false;
  const distance = eightWay
    ? Math.max(deltaX, deltaY)
    : manhattanRoomDistance(state.playerPosition, target);
  if (distance < 1 || distance > range) return false;
  const step = {
    x: Math.sign(target.x - state.playerPosition.x),
    y: Math.sign(target.y - state.playerPosition.y),
  };
  for (let distanceFromPlayer = 1; distanceFromPlayer < distance; distanceFromPlayer += 1) {
    const tile = room.tiles[
      state.playerPosition.y + step.y * distanceFromPlayer
    ][state.playerPosition.x + step.x * distanceFromPlayer];
    if (
      tile.kind === "wall"
      || tile.kind === "cage"
      || tile.kind === "shopkeeperCage"
      || tile.kind === "lotteryGate"
      || tile.kind === "diceGate"
      || tile.kind === "clayGate"
      || tile.kind === "clayBoulder"
      || tile.kind === "caveRock"
      || tile.kind === "caveGem"
      || tile.kind === "enemy"
      || (tile.kind === "woodenDoor" && (!tile.doorOpen || tile.bossBarrier))
    ) return false;
  }
  return true;
}

export function isInWeaponThrowRange(
  state: AdventureState,
  room: DungeonRoom,
  target: Position,
  hasTrident = false,
): boolean {
  if (!hasTrident) return false;
  const sameAxis = state.playerPosition.x === target.x || state.playerPosition.y === target.y;
  if (!sameAxis || positionsEqual(state.playerPosition, target)) return false;
  const throwDistance = Math.abs(state.playerPosition.x - target.x)
    + Math.abs(state.playerPosition.y - target.y);
  if (throwDistance > TRIDENT_THROW_RANGE) return false;
  const step = {
    x: Math.sign(target.x - state.playerPosition.x),
    y: Math.sign(target.y - state.playerPosition.y),
  };
  let cursor = { x: state.playerPosition.x + step.x, y: state.playerPosition.y + step.y };
  while (isOnRoom(room, cursor)) {
    const tile = room.tiles[cursor.y][cursor.x];
    if (tile.kind === "wall" || tile.kind === "cage" || tile.kind === "shopkeeperCage" || tile.kind === "lotteryGate" || tile.kind === "diceGate" || tile.kind === "forgeGate" || tile.kind === "clayGate" || tile.kind === "clayBoulder" || tile.kind === "caveRock" || tile.kind === "caveGem" || (tile.kind === "woodenDoor" && (!tile.doorOpen || tile.bossBarrier))) return false;
    if (positionsEqual(cursor, target)) return tile.kind === "enemy";
    if (tile.kind === "enemy") return false;
    cursor = { x: cursor.x + step.x, y: cursor.y + step.y };
  }
  return false;
}

export function isInAdventureWeaponSkillRange(
  state: AdventureState,
  room: DungeonRoom,
  target: Position,
  weaponAbilityId: WeaponAbilityId,
  hasTrident = false,
): boolean {
  const skill = weaponSkill(weaponAbilityId);
  if (!skill || (state.weaponCooldownRemaining ?? 0) > 0) return false;
  if (skill.id === "trident-throw") {
    return isInWeaponThrowRange(state, room, target, hasTrident);
  }
  const dx = Math.abs(state.playerPosition.x - target.x);
  const dy = Math.abs(state.playerPosition.y - target.y);
  if (dx === 0 && dy === 0) return false;
  const distance = skill.attackPattern === "orthogonal" ? dx + dy : Math.max(dx, dy);
  const matchesPattern = skill.attackPattern === "any"
    || (skill.attackPattern === "orthogonal"
      ? dx === 0 || dy === 0
      : dx === 0 || dy === 0 || dx === dy);
  if (!matchesPattern || distance > skill.range) return false;
  const path = roomLineBetween(state.playerPosition, target).slice(1, -1);
  return path.every((position) => !blocksAdventureProjectile(room.tiles[position.y][position.x]));
}

export function blocksAdventureProjectile(tile: AdventureTile): boolean {
  return tile.kind === "wall"
    || tile.kind === "cage"
    || tile.kind === "shopkeeperCage"
    || tile.kind === "lotteryGate"
    || tile.kind === "diceGate"
    || tile.kind === "forgeGate"
    || tile.kind === "clayGate"
    || tile.kind === "clayBoulder"
    || tile.kind === "caveRock"
    || tile.kind === "caveGem"
    || (tile.kind === "woodenDoor" && (!tile.doorOpen || Boolean(tile.bossBarrier)));
}

export function roomLineBetween(from: Position, to: Position): Position[] {
  const positions: Position[] = [];
  let x = from.x;
  let y = from.y;
  const dx = Math.abs(to.x - from.x);
  const dy = Math.abs(to.y - from.y);
  const stepX = from.x < to.x ? 1 : -1;
  const stepY = from.y < to.y ? 1 : -1;
  let error = dx - dy;
  while (true) {
    positions.push({ x, y });
    if (x === to.x && y === to.y) break;
    const doubleError = error * 2;
    if (doubleError > -dy) {
      error -= dy;
      x += stepX;
    }
    if (doubleError < dx) {
      error += dx;
      y += stepY;
    }
  }
  return positions;
}

export function enemyCanEnter(tile: AdventureTile): boolean {
  return tile.kind === "floor" || tile.kind === "trap" || tile.kind === "regen";
}

export function terrainUnderEnemy(tile: AdventureTile): AdventureTile {
  if (tile.underlyingKind === "trap") {
    return {
      kind: "trap",
      revealed: tile.underlyingTrapRevealed ?? true,
      trapStyle: tile.underlyingTrapStyle,
      trapGroupId: tile.underlyingTrapGroupId,
      trapGroupIds: tile.underlyingTrapGroupIds,
      trapBeamDirection: tile.underlyingTrapBeamDirection,
    };
  }
  if (tile.underlyingKind === "regen") {
    return {
      kind: "regen",
      regenPartX: tile.underlyingRegenPartX,
      regenPartY: tile.underlyingRegenPartY,
    };
  }
  return { kind: "floor" };
}

export function enemyFootprint(room: DungeonRoom, enemyId: string | undefined, fallback: Position): Position[] {
  if (!enemyId) return [fallback];
  const positions: Position[] = [];
  for (let y = 0; y < room.height; y += 1) {
    for (let x = 0; x < room.width; x += 1) {
      if (room.tiles[y][x].enemyId === enemyId) positions.push({ x, y });
    }
  }
  return positions.length > 0 ? positions : [fallback];
}

export function clearEnemyFootprint(room: DungeonRoom, enemyId: string | undefined, fallback: Position): void {
  for (const position of enemyFootprint(room, enemyId, fallback)) {
    room.tiles[position.y][position.x] = terrainUnderEnemy(room.tiles[position.y][position.x]);
  }
}

export function setEnemyFootprintHp(
  room: DungeonRoom,
  enemyId: string | undefined,
  fallback: Position,
  hp: Decimal,
): void {
  for (const position of enemyFootprint(room, enemyId, fallback)) {
    room.tiles[position.y][position.x] = { ...room.tiles[position.y][position.x], enemyHp: hp };
  }
}

export function setEnemyFootprintParalysis(
  room: DungeonRoom,
  enemyId: string | undefined,
  fallback: Position,
  turns: number,
): void {
  for (const position of enemyFootprint(room, enemyId, fallback)) {
    room.tiles[position.y][position.x] = {
      ...room.tiles[position.y][position.x],
      enemyParalyzedTurns: turns,
    };
  }
}

export function enemyWithoutUnderlyingTerrain(tile: AdventureTile): AdventureTile {
  const next = { ...tile };
  delete next.underlyingKind;
  delete next.underlyingTrapRevealed;
  delete next.underlyingTrapStyle;
  delete next.underlyingTrapGroupId;
  delete next.underlyingTrapGroupIds;
  delete next.underlyingTrapBeamDirection;
  delete next.underlyingRegenPartX;
  delete next.underlyingRegenPartY;
  return next;
}

export function indefiniteArticle(name: string): "a" | "an" {
  return /^[aeiou]/i.test(name) ? "an" : "a";
}

export function isInEnemyAttackRange(
  room: DungeonRoom,
  from: Position,
  to: Position,
  range: number,
  attackPattern: "orthogonal" | "eight-way" = "orthogonal",
): boolean {
  const differenceX = Math.abs(to.x - from.x);
  const differenceY = Math.abs(to.y - from.y);
  const sameAxis = differenceX === 0 || differenceY === 0;
  const sameDiagonal = differenceX === differenceY;
  const distance = Math.max(differenceX, differenceY);
  if (
    (!sameAxis && (attackPattern !== "eight-way" || !sameDiagonal))
    || distance < 1
    || distance > Math.max(1, range)
  ) return false;
  const step = { x: Math.sign(to.x - from.x), y: Math.sign(to.y - from.y) };
  for (let offset = 1; offset < distance; offset += 1) {
    const tile = room.tiles[from.y + step.y * offset][from.x + step.x * offset];
    if (
      tile.kind === "wall"
      || tile.kind === "cage"
      || tile.kind === "clayGate"
      || tile.kind === "clayBoulder"
      || tile.kind === "shopkeeperCage"
      || tile.kind === "lotteryGate"
      || tile.kind === "diceGate"
      || tile.kind === "forgeGate"
      || (tile.kind === "woodenDoor" && (!tile.doorOpen || tile.bossBarrier))
      || (attackPattern !== "eight-way" && tile.kind === "enemy")
    ) return false;
  }
  return true;
}

export function laserEndBeforeWall(room: DungeonRoom, from: Position, toward: Position): Position {
  const step = {
    x: Math.sign(toward.x - from.x),
    y: Math.sign(toward.y - from.y),
  };
  let endpoint = { ...from };
  while (true) {
    const next = { x: endpoint.x + step.x, y: endpoint.y + step.y };
    if (!isOnRoom(room, next)) break;
    const tile = room.tiles[next.y][next.x];
    if (tile.kind === "wall" || tile.kind === "cage" || tile.kind === "shopkeeperCage" || tile.kind === "lotteryGate" || tile.kind === "diceGate" || tile.kind === "forgeGate" || (tile.kind === "woodenDoor" && (!tile.doorOpen || tile.bossBarrier))) break;
    endpoint = next;
  }
  return endpoint;
}

export function trapDamage(ring: number): Decimal {
  if (ring >= 4) return new Decimal(60).mul(1 + (ring - 4) * 0.25).ceil();
  return new Decimal(5).mul(1 + Math.max(0, ring) * 0.25).ceil();
}

export function fireBeamIsActive(room: DungeonRoom, tile: AdventureTile): boolean {
  if (tile.trapStyle !== "fire-beam" && tile.underlyingTrapStyle !== "fire-beam") return false;
  return Math.max(0, Math.floor(room.hazardTurn ?? 0)) % 4 < 2;
}

export function trapIsActive(room: DungeonRoom, tile: AdventureTile): boolean {
  return tile.trapStyle !== "fire-beam" || fireBeamIsActive(room, tile);
}

export function revealTrapGroup(room: DungeonRoom, source: AdventureTile): void {
  const sourceGroupIds = beamGroupIds(source);
  for (const row of room.tiles) {
    for (let index = 0; index < row.length; index += 1) {
      const tile = row[index];
      if (tile.kind === "trap" && sharesBeamGroup(tile, sourceGroupIds)) {
        row[index] = { ...tile, revealed: true };
      } else if (
        tile.kind === "enemy"
        && tile.underlyingKind === "trap"
        && sharesBeamGroup(tile, sourceGroupIds, true)
      ) {
        row[index] = { ...tile, underlyingTrapRevealed: true };
      }
    }
  }
}

export function beamGroupIds(tile: AdventureTile, underlying = false): string[] {
  if (underlying) {
    return tile.underlyingTrapGroupIds
      ?? (tile.underlyingTrapGroupId ? [tile.underlyingTrapGroupId] : []);
  }
  return tile.trapGroupIds ?? (tile.trapGroupId ? [tile.trapGroupId] : []);
}

export function sharesBeamGroup(
  tile: AdventureTile,
  sourceGroupIds: string[],
  underlying = false,
): boolean {
  if (sourceGroupIds.length === 0) return true;
  return beamGroupIds(tile, underlying).some((groupId) => sourceGroupIds.includes(groupId));
}

export function findTiles(room: DungeonRoom, kind: AdventureTileKind): Position[] {
  const found: Position[] = [];
  for (let y = 0; y < room.height; y += 1) {
    for (let x = 0; x < room.width; x += 1) {
      if (room.tiles[y][x].kind === kind) found.push({ x, y });
    }
  }
  return found;
}

export function shamanRingTeleportPosition(
  room: DungeonRoom,
  currentPosition: Position,
  occupiedPositions: Position[],
  random: RandomSource,
): Position | null {
  if (random() >= 0.2) return null;
  const occupied = new Set(occupiedPositions.map(positionKey));
  const candidates = findTiles(room, "floor").filter((position) =>
    !positionsEqual(position, currentPosition) && !occupied.has(positionKey(position))
  );
  if (candidates.length === 0) return null;
  const index = Math.min(candidates.length - 1, Math.floor(Math.max(0, random()) * candidates.length));
  return { ...candidates[index] };
}
