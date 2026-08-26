import Decimal from "break_eternity.js";
import type { PlayerId, PortalType, Stats } from "@/game/types";
import type { AdventureState, ExitDirection } from "./types";

const DICE_CURSE_MULTIPLIER = new Decimal(0.75);

export interface AdventureDiceCurse {
  turnsRemaining: number;
}

/** Runtime state shared by every party member in one active expedition. */
export interface AdventureSession {
  explorers: Partial<Record<PlayerId, AdventureState>>;
  order: PlayerId[];
  focusedMemberId: PlayerId;
  headingByMember?: Partial<Record<PlayerId, ExitDirection>>;
  /** A discovered landmark every explorer should route toward this expedition. */
  routeTargetRoomKey?: string | null;
  /** Temporary rendezvous used before a Forge arena is allowed to seal. */
  forgeRallyRoomKey?: string | null;
  /** Main-dungeon state preserved while the expedition visits a sub-dungeon. */
  returnSession?: AdventureSession | null;
  /**
   * Sub-dungeons already visited during this expedition. Cached sessions never
   * retain their parent reference, which keeps this tree acyclic.
   */
  portalSessions?: Partial<Record<PortalType, AdventureSession>>;
  /** Routes every surviving explorer back to the sub-dungeon's entry portal. */
  returnToDungeonPortal?: boolean;
  carriedGold: Decimal;
  diceCurse?: AdventureDiceCurse | null;
}

/**
 * Attach the latest state of a sub-dungeon to its parent expedition without
 * retaining the child's parent link (and therefore without creating a cycle).
 */
export function cachePortalDungeonSession(
  parent: AdventureSession,
  portalType: PortalType,
  child: AdventureSession,
): AdventureSession {
  const snapshot: AdventureSession = {
    ...child,
    returnSession: null,
    portalSessions: undefined,
    routeTargetRoomKey: null,
    forgeRallyRoomKey: null,
    returnToDungeonPortal: false,
  };
  return {
    ...parent,
    portalSessions: {
      ...parent.portalSessions,
      [portalType]: snapshot,
    },
  };
}

export function diceCursedAdventureStats(
  stats: Stats,
  curse: AdventureDiceCurse | null | undefined,
): Stats {
  if (!curse) return stats;
  return {
    ...stats,
    attack: stats.attack.mul(DICE_CURSE_MULTIPLIER),
    defense: stats.defense.mul(DICE_CURSE_MULTIPLIER),
    spAttack: stats.spAttack.mul(DICE_CURSE_MULTIPLIER),
    spDefense: stats.spDefense.mul(DICE_CURSE_MULTIPLIER),
    speed: stats.speed.mul(DICE_CURSE_MULTIPLIER),
    luck: stats.luck.mul(DICE_CURSE_MULTIPLIER),
  };
}

export function createAdventureDiceCurse(
  turnsRemaining: number,
): AdventureDiceCurse {
  return {
    turnsRemaining: Math.max(1, Math.floor(turnsRemaining)),
  };
}

export function advanceAdventureDiceCurse(
  curse: AdventureDiceCurse,
): AdventureDiceCurse | null {
  const turnsRemaining = curse.turnsRemaining - 1;
  return turnsRemaining > 0 ? { ...curse, turnsRemaining } : null;
}
