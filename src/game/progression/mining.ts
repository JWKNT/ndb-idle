import type { PlayerId } from "@/game/types";
import { MAX_MINING_ROOM } from "@/game/mining/generation";
import type { ProgressionState } from "./types";

export function setMiningAutoMode(
  state: ProgressionState,
  enabled: boolean,
): ProgressionState {
  return { ...state, miningAutoMode: enabled };
}

export function setMiningMember(
  state: ProgressionState,
  memberId: PlayerId,
): ProgressionState {
  if (!state.party[memberId]) return state;
  return { ...state, selectedMiningMemberId: memberId };
}

export function setRestartMiningOnFullHp(
  state: ProgressionState,
  enabled: boolean,
): ProgressionState {
  return { ...state, restartMiningOnFullHp: enabled };
}

export function recordMiningRoomReached(
  state: ProgressionState,
  roomNumber: number,
): ProgressionState {
  const room = Math.max(0, Math.min(MAX_MINING_ROOM, Math.floor(roomNumber)));
  if (room <= state.highestMiningRoomReached) return state;
  return { ...state, highestMiningRoomReached: room };
}
