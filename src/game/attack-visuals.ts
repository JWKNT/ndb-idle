import type { AttackType, AttackVisualId, PlayerId } from "./types";

const PLAYER_BASIC_VISUALS: Record<PlayerId, AttackVisualId> = {
  knight: "knight-slash",
  worm: "worm-acid",
  miner: "miner-pick",
};

export function playerBasicAttackVisual(playerId: PlayerId): AttackVisualId {
  return PLAYER_BASIC_VISUALS[playerId];
}

export function basicAttackVisual(
  definitionId: string,
  attackName: string,
  attackType: AttackType,
): AttackVisualId {
  if (definitionId === "knight" || definitionId === "worm" || definitionId === "miner") {
    return playerBasicAttackVisual(definitionId);
  }
  if (/acid|corros/i.test(attackName)) return "worm-acid";
  if (/fire|flame|magma|cinder/i.test(attackName)) return "fire";
  if (/throw|trident/i.test(attackName)) return "trident-throw";
  if (/abyssal|mire|sludge|ooze/i.test(attackName)) return "abyssal";
  return attackType === "special" ? "magic" : "physical";
}
