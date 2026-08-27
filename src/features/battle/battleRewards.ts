import { enemySprite } from "@/content/enemy-sprites";
import { battleFirstClearContract } from "@/content/battle-first-clear";
import { getLevel } from "@/content/levels";
import type { RewardPopupContent } from "@/features/shell/RewardPopup";

/** Click-through victory sequence for every first Battle clear. */
export function battleRewardPopups(level: number, rewardDiscarded = false): RewardPopupContent[] {
  const definition = getLevel(level);
  const boss = definition.enemies.find((spawn) => spawn.unit.isRaidBoss)
    ?? definition.enemies.at(-1);
  const defeated: RewardPopupContent = {
    title: `Defeated ${definition.name}`,
    sprite: enemySprite(boss?.unit.id ?? "goblin"),
    description: "",
  };
  const notice = battleFirstClearContract(level).reward;
  const discarded = rewardDiscarded ? notice?.discarded : undefined;
  const reward: RewardPopupContent | null = notice ? {
    title: discarded?.title ?? notice.title,
    sprite: notice.sprite,
    description: discarded?.description ?? notice.description,
  } : null;

  return reward ? [defeated, reward] : [defeated];
}
