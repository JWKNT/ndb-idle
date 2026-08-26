export const ESCAPE_ROPE_LEVELS = [1, 2, 3] as const;

export type EscapeRopeLevel = typeof ESCAPE_ROPE_LEVELS[number];
export type EscapeRopeCounts = Record<EscapeRopeLevel, number>;

export interface EscapeRopeDefinition {
  level: EscapeRopeLevel;
  cost: number;
}

export const ESCAPE_ROPES: Record<EscapeRopeLevel, EscapeRopeDefinition> = {
  1: { level: 1, cost: 250 },
  2: { level: 2, cost: 500 },
  3: { level: 3, cost: 1_000 },
};

export function emptyEscapeRopeCounts(): EscapeRopeCounts {
  return { 1: 0, 2: 0, 3: 0 };
}

export function maximumPurchasableEscapeRopeLevel(highestRingVisited: number): number {
  return Math.min(3, Math.max(0, Math.floor(highestRingVisited) - 1));
}
