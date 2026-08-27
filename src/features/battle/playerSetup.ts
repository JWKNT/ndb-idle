import {
  getPartyMember,
  memberEquipment,
  memberStats,
  partyMemberIds,
  type ProgressionState,
} from "@/game/progression";
import type { PlayerBattleSetup } from "@/game/combat";
import { milestoneGearHasEffect } from "@/game/gear";
import type { PlayerId } from "@/game/types";

/** Converts persistent party/loadout state into isolated Battle actors. */
export function battlePartySetup(
  progression: ProgressionState,
  unavailableMembers: PlayerId[] = [],
): PlayerBattleSetup[] {
  const unavailable = new Set(unavailableMembers);
  return partyMemberIds(progression).filter((id) =>
    progression.fishingAssignment?.memberId !== id
    && !unavailable.has(id)
  ).map((id) => {
    const member = getPartyMember(progression, id);
    const equipment = memberEquipment(progression, id);
    const weapon = progression.inventory.find((item) => item.id === equipment.sword);
    const accessory = progression.inventory.find((item) => item.id === equipment.accessory);
    return {
      id,
      training: member.training,
      fishBonuses: member.fishBonuses,
      startingHp: member.hp,
      inventory: progression.inventory,
      equipment,
      stats: memberStats(progression, id),
      weaponThrowUnlocked: progression.weaponThrowUnlocked
        && milestoneGearHasEffect(weapon, "weapon-secondary"),
      hasTrident: milestoneGearHasEffect(weapon, "weapon-secondary"),
      weaponAbilityId: weapon?.weaponAbilityId,
      hasUndeadGem: milestoneGearHasEffect(accessory, "undead-ward-bypass"),
      hasSuctionCups: milestoneGearHasEffect(accessory, "retaliatory-paralysis"),
    };
  });
}
