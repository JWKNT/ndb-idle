import Decimal from "break_eternity.js";
import {
  addAdventureExplorer,
  createAdventureHeadings,
  currentAdventureRoom,
  refreshAdventureTimeline,
  startForgeAdventure,
  startWaterAdventure,
  type AdventureExplorerPosition,
  type AdventureState,
} from "@/game/adventure";
import {
  effectiveAdventureStrategy,
  getPartyMember,
  memberEquipment,
  memberStats,
  type ProgressionState,
} from "@/game/progression";
import {
  advanceAdventureDiceCurse,
  createAdventureDiceCurse,
  diceCursedAdventureStats,
  type AdventureSession,
} from "@/game/adventure/session";
import type { MiningState } from "@/game/mining";
import type { PlayerId, Position } from "@/game/types";
import { retireForgeBlueprintObjective } from "@/game/adventure/forgeBlueprints";

export function memberHasTrident(progression: ProgressionState, id: PlayerId): boolean {
  const equipment = memberEquipment(progression, id);
  return progression.inventory.find((item) => item.id === equipment.sword)?.definitionId === "trident";
}

export function memberWeaponAbility(progression: ProgressionState, id: PlayerId) {
  const equipment = memberEquipment(progression, id);
  return progression.inventory.find((item) => item.id === equipment.sword)?.weaponAbilityId;
}

export function memberHasShamanRing(progression: ProgressionState, id: PlayerId): boolean {
  const equipment = memberEquipment(progression, id);
  return progression.inventory.find((item) => item.id === equipment.accessory)?.definitionId === "shaman-ring";
}

export function memberHasSuctionCups(progression: ProgressionState, id: PlayerId): boolean {
  const equipment = memberEquipment(progression, id);
  return progression.inventory.find((item) => item.id === equipment.accessory)?.definitionId === "suction-cups";
}

export function adventureMemberStats(
  progression: ProgressionState,
  session: AdventureSession | null,
  memberId: PlayerId,
) {
  return diceCursedAdventureStats(
    memberStats(progression, memberId),
    session?.diceCurse,
  );
}

export function retimeAdventureSession(
  session: AdventureSession,
  progression: ProgressionState,
): AdventureSession {
  const explorers: AdventureSession["explorers"] = { ...session.explorers };
  for (const memberId of session.order) {
    const explorer = explorers[memberId];
    if (!explorer) continue;
    explorers[memberId] = refreshAdventureTimeline(
      explorer,
      adventureMemberStats(progression, session, memberId),
    );
  }
  return { ...session, explorers };
}

export function refreshAdventureRoomTimelines(
  session: AdventureSession,
  roomKey: string,
  progression: ProgressionState,
): AdventureSession {
  const explorers: AdventureSession["explorers"] = { ...session.explorers };
  for (const memberId of session.order) {
    const explorer = explorers[memberId];
    if (!explorer || explorer.currentRoomKey !== roomKey) continue;
    explorers[memberId] = refreshAdventureTimeline(
      explorer,
      adventureMemberStats(progression, session, memberId),
    );
  }
  return { ...session, explorers };
}

export function startAdventureDiceCurse(
  session: AdventureSession,
  turnsRemaining: number,
  progression: ProgressionState,
): AdventureSession {
  return retimeAdventureSession({
    ...session,
    diceCurse: createAdventureDiceCurse(turnsRemaining),
  }, progression);
}

export function advanceSessionDiceCurse(
  session: AdventureSession,
  progression: ProgressionState,
): AdventureSession {
  if (!session.diceCurse) return session;
  const diceCurse = advanceAdventureDiceCurse(session.diceCurse);
  const next = { ...session, diceCurse };
  return diceCurse ? next : retimeAdventureSession(next, progression);
}

export function activeAdventureMemberIds(session: AdventureSession | null): PlayerId[] {
  return session?.order.filter((id) => Boolean(session.explorers[id])) ?? [];
}

export function memberAssignedOutsideBattle(
  memberId: PlayerId,
  progression: ProgressionState,
  session: AdventureSession | null,
  mining: MiningState | null,
  pendingMiningRestartMemberId: PlayerId | null,
): boolean {
  return progression.fishingAssignment?.memberId === memberId
    || activeAdventureMemberIds(session).includes(memberId)
    || miningMemberIds(mining, pendingMiningRestartMemberId).includes(memberId);
}

export function activeMiningMemberId(
  mining: MiningState | null,
  pendingMiningRestartMemberId: PlayerId | null,
): PlayerId | null {
  return mining?.memberId ?? pendingMiningRestartMemberId;
}

export function miningMemberIds(
  mining: MiningState | null,
  pendingMiningRestartMemberId: PlayerId | null,
): PlayerId[] {
  const id = activeMiningMemberId(mining, pendingMiningRestartMemberId);
  return id ? [id] : [];
}

export function unavailableBattleMemberIds(
  session: AdventureSession | null,
  mining: MiningState | null,
  pendingMiningRestartMemberId: PlayerId | null,
): PlayerId[] {
  return [...new Set([
    ...activeAdventureMemberIds(session),
    ...miningMemberIds(mining, pendingMiningRestartMemberId),
  ])];
}

export function playerIdSetKey(ids: PlayerId[]): string {
  return [...ids].sort().join(",");
}

export function updateAdventureSession(
  session: AdventureSession,
  memberId: PlayerId,
  nextState: AdventureState | null,
): AdventureSession | null {
  const explorers: Partial<Record<PlayerId, AdventureState>> = { ...session.explorers };
  if (!nextState) {
    delete explorers[memberId];
  } else {
    for (const id of session.order) {
      const explorer = explorers[id];
      if (!explorer || id === memberId) continue;
      explorers[id] = {
        ...explorer,
        dungeonSeed: nextState.dungeonSeed,
        rooms: nextState.rooms,
        questTarget: nextState.questTarget,
        hammerQuestPurchased: nextState.hammerQuestPurchased,
        hammerRecovered: nextState.hammerRecovered,
        forgeArenasCleared: nextState.forgeArenasCleared,
        forgeBlueprintTarget: nextState.forgeBlueprintTarget,
        forgeBlueprintObjectiveEnabled: nextState.forgeBlueprintObjectiveEnabled,
        cartographerSurveyTargets: nextState.cartographerSurveyTargets,
        cartographerSurveyVisited: nextState.cartographerSurveyVisited,
        cartographerSurveyPaths: nextState.cartographerSurveyPaths,
        cartographerQuestActive: nextState.cartographerQuestActive,
        chalkRevealedPositions: nextState.chalkRevealedPositions,
        chalkMappedExits: nextState.chalkMappedExits,
      };
    }
    explorers[memberId] = nextState;
  }
  const order = session.order.filter((id) => explorers[id]);
  if (order.length === 0) return null;
  return {
    explorers,
    order,
    headingByMember: session.headingByMember ?? {},
    routeTargetRoomKey: session.routeTargetRoomKey ?? null,
    forgeRallyRoomKey: session.forgeRallyRoomKey ?? null,
    returnSession: session.returnSession ?? null,
    portalSessions: session.portalSessions,
    returnToDungeonPortal: session.returnToDungeonPortal ?? false,
    carriedGold: session.carriedGold,
    diceCurse: session.diceCurse ?? null,
    focusedMemberId: explorers[session.focusedMemberId]
      ? session.focusedMemberId
      : order[0],
  };
}

export function requiredEscapeRopeLevel(session: AdventureSession): number {
  return Math.max(1, ...session.order.flatMap((id) => {
    const explorer = session.explorers[id];
    if (!explorer) return [];
    return explorer.dungeonTheme === "water"
      ? [2]
      : explorer.dungeonTheme === "forge"
        ? [4]
        : [currentAdventureRoom(explorer).ring];
  }));
}

export function otherAdventureExplorerPositions(
  session: AdventureSession,
  memberId: PlayerId,
): AdventureExplorerPosition[] {
  return session.order.flatMap((id) => {
    const explorer = id === memberId ? null : session.explorers[id];
    return explorer
      ? [{ roomKey: explorer.currentRoomKey, position: { ...explorer.playerPosition } }]
      : [];
  });
}

export function allExplorersOnPortal(session: AdventureSession): boolean {
  return session.order.length > 0 && session.order.every((id) => {
    const explorer = session.explorers[id];
    if (!explorer) return false;
    const room = currentAdventureRoom(explorer);
    return room.kind === "portal"
      && room.tiles[explorer.playerPosition.y]?.[explorer.playerPosition.x]?.kind === "portal";
  });
}

export function createWaterAdventureSession(
  memberIds: PlayerId[],
  progression: ProgressionState,
  carriedGold: Decimal,
  diceCurse: AdventureSession["diceCurse"] = null,
  returnSession: AdventureSession | null = null,
): AdventureSession {
  return createPortalSession("water", memberIds, progression, carriedGold, diceCurse, returnSession);
}

export function createForgeAdventureSession(
  memberIds: PlayerId[],
  progression: ProgressionState,
  carriedGold: Decimal,
  diceCurse: AdventureSession["diceCurse"] = null,
  returnSession: AdventureSession | null = null,
): AdventureSession {
  return createPortalSession("forge", memberIds, progression, carriedGold, diceCurse, returnSession);
}

function createPortalSession(
  theme: "water" | "forge",
  memberIds: PlayerId[],
  progression: ProgressionState,
  carriedGold: Decimal,
  diceCurse: AdventureSession["diceCurse"],
  returnSession: AdventureSession | null,
): AdventureSession {
  const firstId = memberIds[0];
  const firstMember = getPartyMember(progression, firstId);
  const firstStats = diceCursedAdventureStats(memberStats(progression, firstId), diceCurse);
  const first = theme === "water"
    ? startWaterAdventure(firstStats, Math.random, firstMember.staminaActions, firstId, {
        visitNumber: progression.waterDungeonVisits,
        fishingRodRecovered: progression.fishingRod,
        shrineSolved: progression.waterShrineSolved,
        tridentTrialCompleted: progression.tridentTrialCompleted,
        fishInventory: progression.fish,
        anglerRoomEnabled: progression.fishingRod && !progression.tackleBoxOwned,
      })
    : startForgeAdventure(
        firstStats,
        Math.random,
        firstMember.staminaActions,
        firstId,
        !progression.forgeBlueprintsRecovered && !progression.forgeBlueprintsDelivered,
      );
  const explorers: Partial<Record<PlayerId, AdventureState>> = { [firstId]: first };
  for (const id of memberIds.slice(1)) {
    const member = getPartyMember(progression, id);
    const occupied = Object.values(explorers)
      .filter((explorer): explorer is AdventureState => Boolean(explorer))
      .map((explorer) => explorer.playerPosition);
    explorers[id] = addAdventureExplorer(
      first,
      id,
      diceCursedAdventureStats(memberStats(progression, id), diceCurse),
      member.staminaActions,
      occupied,
    );
  }
  return {
    explorers,
    order: memberIds,
    focusedMemberId: firstId,
    headingByMember: createAdventureHeadings(memberIds, effectiveAdventureStrategy(progression)),
    routeTargetRoomKey: null,
    forgeRallyRoomKey: null,
    returnSession,
    returnToDungeonPortal: false,
    carriedGold,
    diceCurse,
  };
}

export function restoreMainDungeonSession(
  parent: AdventureSession,
  activeMemberIds: PlayerId[],
  progression: ProgressionState,
  carriedGold: Decimal,
  diceCurse: AdventureSession["diceCurse"],
): AdventureSession {
  const explorers: AdventureSession["explorers"] = {};
  const occupiedByRoom = new Map<string, Position[]>();
  for (const memberId of activeMemberIds) {
    const source = parent.explorers[memberId];
    if (!source) continue;
    const room = currentAdventureRoom(source);
    const occupied = occupiedByRoom.get(room.key) ?? [];
    const standingTile = room.tiles[source.playerPosition.y]?.[source.playerPosition.x];
    let playerPosition = { ...source.playerPosition };
    if (standingTile?.kind === "portal" || standingTile?.kind === "waterPortal" || standingTile?.kind === "forgePortal") {
      const candidates = room.tiles.flatMap((row, y) => row.flatMap((tile, x) =>
        tile.kind === "floor" ? [{ x, y }] : []
      )).sort((left, right) =>
        Math.abs(left.x - source.playerPosition.x) + Math.abs(left.y - source.playerPosition.y)
        - Math.abs(right.x - source.playerPosition.x) - Math.abs(right.y - source.playerPosition.y)
      );
      playerPosition = candidates.find((candidate) =>
        !occupied.some((position) => position.x === candidate.x && position.y === candidate.y)
      ) ?? playerPosition;
    }
    occupiedByRoom.set(room.key, [...occupied, playerPosition]);
    explorers[memberId] = {
      ...source,
      playerPosition,
      staminaActionProgress: getPartyMember(progression, memberId).staminaActions,
      questTarget: source.questTarget?.questId === "enter-tower" && progression.forgeBlueprintsRecovered
        ? null
        : source.questTarget,
    };
  }
  const order = activeMemberIds.filter((memberId) => Boolean(explorers[memberId]));
  const restored: AdventureSession = {
    ...parent,
    explorers,
    order,
    focusedMemberId: explorers[parent.focusedMemberId] ? parent.focusedMemberId : order[0],
    routeTargetRoomKey: null,
    forgeRallyRoomKey: null,
    returnToDungeonPortal: false,
    carriedGold,
    diceCurse,
  };
  return retimeAdventureSession(restored, progression);
}

/** Resume the exact Water/Forge layout already visited in this expedition. */
export function restorePortalDungeonSession(
  cached: AdventureSession,
  parent: AdventureSession,
  progression: ProgressionState,
): AdventureSession {
  const blueprintObtained = progression.forgeBlueprintsRecovered
    || progression.forgeBlueprintsDelivered;
  const cachedForProgression = blueprintObtained
    ? {
        ...cached,
        explorers: Object.fromEntries(Object.entries(cached.explorers).map(([id, explorer]) => [
          id,
          explorer ? retireForgeBlueprintObjective(explorer) : explorer,
        ])),
      }
    : cached;
  const restored = restoreMainDungeonSession(
    cachedForProgression,
    parent.order,
    progression,
    parent.carriedGold,
    parent.diceCurse,
  );
  return {
    ...restored,
    returnSession: parent,
    portalSessions: undefined,
  };
}
