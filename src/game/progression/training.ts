import Decimal from "break_eternity.js";
import type { PlayerId, StatKey } from "@/game/types";
import type { ProgressionState } from "./types";

const TRAINING_COST_BY_LEVEL: Decimal[] = [new Decimal(3)];

export function trainingCost(
  state: ProgressionState,
  memberId: PlayerId,
  stat: StatKey,
): Decimal {
  const member = state.party[memberId];
  if (!member) throw new Error(`Party member ${memberId} is not recruited.`);
  return trainingCostAtLevel(member.training[stat]);
}

export function startTraining(
  state: ProgressionState,
  memberId: PlayerId,
  stat: StatKey,
): { state: ProgressionState; error?: string } {
  const member = state.party[memberId];
  if (!member) return { state, error: "That member is not in the party." };
  const cost = trainingCost(state, memberId, stat);
  if (state.gold.lt(cost)) return { state, error: "Not enough gold." };
  return {
    state: {
      ...state,
      gold: state.gold.sub(cost).floor(),
      party: {
        ...state.party,
        [memberId]: {
          ...member,
          training: { ...member.training, [stat]: member.training[stat] + 1 },
        },
      },
    },
  };
}

function trainingCostAtLevel(level: number): Decimal {
  const targetLevel = Math.max(0, Math.floor(level));
  while (TRAINING_COST_BY_LEVEL.length <= targetLevel) {
    const nextLevel = TRAINING_COST_BY_LEVEL.length;
    const decade = Math.ceil(nextLevel / 10);
    const growth = new Decimal(1).add(new Decimal(decade).mul(0.1));
    TRAINING_COST_BY_LEVEL.push(TRAINING_COST_BY_LEVEL[nextLevel - 1].mul(growth));
  }
  return TRAINING_COST_BY_LEVEL[targetLevel].ceil();
}
