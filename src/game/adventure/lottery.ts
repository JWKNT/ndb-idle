import Decimal from "break_eternity.js";
import { getEnemy } from "@/content/enemies";
import { formatWholeAmount } from "@/game/numbers";
import { adventureEnemyStats, enemyKindForRing } from "./enemies";
import { rollGold } from "./economy";
import type {
  AdventureEnemyKind,
  AdventureTileKind,
  DungeonRoom,
  LotteryColor,
  Position,
  RandomSource,
} from "./types";

const GOLD_LANDINGS: Array<{
  color: LotteryColor;
  multiplier: number;
  pileBonus: number;
}> = [
  { color: "blue", multiplier: 2, pileBonus: 0 },
  { color: "green", multiplier: 2, pileBonus: 1 },
  { color: "cyan", multiplier: 4, pileBonus: 0 },
  { color: "yellow", multiplier: 8, pileBonus: 2 },
];

const ENEMY_LANDINGS: Array<{
  color: LotteryColor;
  countBonus: number;
}> = [
  { color: "pink", countBonus: -1 },
  { color: "orange", countBonus: 0 },
  { color: "purple", countBonus: 1 },
  { color: "red", countBonus: 2 },
];

const BATTLE_SUPPORT_ENEMIES: Partial<Record<number, AdventureEnemyKind[]>> = {
  2: ["skeleton-giraffe", "skeleton-hippo"],
  3: ["skeleton-giraffe", "skeleton-hippo", "skeleton-rhino"],
  4: ["skeleton-giraffe", "skeleton-hippo", "skeleton-rhino", "skeleton-brachiosaurus"],
  5: ["goblin"],
  6: ["goblin", "goblin-archer"],
  7: ["fire-ant", "alligator", "dragonfly", "bee"],
  8: ["squid-knight"],
};

export function lotteryEnemyPool(
  ring: number,
  completedBattleNumbers: number[],
): AdventureEnemyKind[] {
  return [...new Set<AdventureEnemyKind>([
    enemyKindForRing(ring),
    ...completedBattleNumbers.flatMap((battle) => BATTLE_SUPPORT_ENEMIES[battle] ?? []),
  ])];
}

export function spinLotteryWheel(
  room: DungeonRoom,
  luck: Decimal,
  completedBattleNumbers: number[],
  random: RandomSource,
): string {
  if (room.kind !== "lottery" || room.lotterySpun) return "You already spun the wheel. Stop touching it. It has nothing left except fingerprints and a growing hatred of you.";
  room.lotterySpun = true;
  room.lotteryResolved = false;
  const goldOutcome = random() < 0.6;

  if (goldOutcome) {
    const landing = GOLD_LANDINGS[Math.min(
      GOLD_LANDINGS.length - 1,
      Math.floor(Math.max(0, random()) * GOLD_LANDINGS.length),
    )];
    room.lotteryOutcome = "gold";
    room.lotteryColor = landing.color;
    const candidates = shuffled(findTiles(room, "floor"), random);
    const pileCount = Math.min(
      candidates.length,
      2 + landing.pileBonus + Math.floor(random() * Math.min(5, room.ring + 2)),
    );
    let total = new Decimal(0);
    for (let index = 0; index < pileCount; index += 1) {
      const position = candidates[index];
      const amount = rollGold(luck, room.ring, random).mul(landing.multiplier).ceil();
      total = total.add(amount);
      room.tiles[position.y][position.x] = {
        kind: "gold",
        goldAmount: amount,
        lotteryPrize: true,
      };
    }
    unlockLotteryRoomIfResolved(room);
    return `The wheel lands on ${landing.color.toUpperCase()} — GOLD RUSH! ${pileCount} piles worth ${formatWholeAmount(total)} gold explode onto the floor. PICK IT UP BEFORE THE FLOOR REALIZES ITS MISTAKE.`;
  }

  const landing = ENEMY_LANDINGS[Math.min(
    ENEMY_LANDINGS.length - 1,
    Math.floor(Math.max(0, random()) * ENEMY_LANDINGS.length),
  )];
  room.lotteryOutcome = "enemies";
  room.lotteryColor = landing.color;
  const candidates = shuffled(findTiles(room, "floor"), random);
  const enemyPool = lotteryEnemyPool(room.ring, completedBattleNumbers);
  const targetEnemyCount = Math.min(
    candidates.length,
    Math.min(8, Math.max(1, 1 + room.ring + landing.countBonus + Math.floor(random() * 3))),
  );
  let enemyCount = 0;
  for (const position of candidates) {
    if (enemyCount >= targetEnemyCount) break;
    const enemyKind = enemyPool[Math.min(
      enemyPool.length - 1,
      Math.floor(Math.max(0, random()) * enemyPool.length),
    )] ?? enemyKindForRing(room.ring);
    const definition = getEnemy(enemyKind);
    const width = Math.max(1, definition?.footprintWidth ?? 1);
    const height = Math.max(1, definition?.footprintHeight ?? 1);
    const footprint = Array.from({ length: height }, (_, offsetY) =>
      Array.from({ length: width }, (_, offsetX) => ({
        x: position.x + offsetX,
        y: position.y + offsetY,
      })),
    ).flat();
    if (footprint.some(({ x, y }) => room.tiles[y]?.[x]?.kind !== "floor")) continue;
    const enemyId = `lottery-${enemyKind}-${room.key}-${enemyCount + 1}`;
    const hp = adventureEnemyStats(room.ring, enemyKind).hp;
    footprint.forEach((part, index) => {
      room.tiles[part.y][part.x] = {
        kind: "enemy",
        enemyId,
        enemyKind,
        enemyHp: hp,
        enemyPart: footprint.length > 1 ? index as 0 | 1 | 2 | 3 : undefined,
        enemyFacing: width > height ? "east" : "south",
        spriteFacing: "right",
      };
    });
    enemyCount += 1;
  }
  unlockLotteryRoomIfResolved(room);
  return `The wheel lands on ${landing.color.toUpperCase()} — MONSTER MAYHEM! ${enemyCount} enemies appear. Congratulations! You have won several urgent new problems with teeth.`;
}

export function unlockLotteryRoomIfResolved(room: DungeonRoom): boolean {
  if (
    room.kind !== "lottery"
    || !room.lotterySpun
    || room.lotteryResolved
    || findTiles(room, "enemy").length > 0
    || findTiles(room, "gold").some((position) => room.tiles[position.y][position.x].lotteryPrize)
  ) return false;
  room.lotteryResolved = true;
  for (const row of room.tiles) {
    for (let index = 0; index < row.length; index += 1) {
      const tile = row[index];
      if (tile.kind === "lotteryGate" && tile.exitDirection) {
        row[index] = { kind: "exit", exitDirection: tile.exitDirection };
      }
    }
  }
  return true;
}

function findTiles(room: DungeonRoom, kind: AdventureTileKind): Position[] {
  return room.tiles.flatMap((row, y) => row.flatMap((tile, x) =>
    tile.kind === kind ? [{ x, y }] : []
  ));
}

function shuffled<T>(values: T[], random: RandomSource): T[] {
  const copy = [...values];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [copy[index], copy[target]] = [copy[target], copy[index]];
  }
  return copy;
}
