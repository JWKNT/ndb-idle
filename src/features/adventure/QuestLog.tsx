import { quests, type QuestId } from "@/content/quests";
import type { ProgressionState } from "@/game/progression";

export function QuestLog({
  progression,
  onActivateQuest,
  onActivateCartographerQuest,
  onActivateHammerQuest,
  locked = false,
  hammerQuestActive = false,
  hammerQuestAvailable = false,
  cartographerQuestActive = false,
  cartographerQuestAvailable = false,
}: {
  progression: ProgressionState;
  onActivateQuest: (questId: QuestId) => void;
  onActivateCartographerQuest: () => void;
  onActivateHammerQuest: () => void;
  locked?: boolean;
  hammerQuestActive?: boolean;
  hammerQuestAvailable?: boolean;
  cartographerQuestActive?: boolean;
  cartographerQuestAvailable?: boolean;
}) {
  const purchasedQuests = progression.purchasedQuestIds
    .map((id) => quests.find((quest) => quest.id === id))
    .filter((quest): quest is (typeof quests)[number] => Boolean(quest));
  const earlyPurchasedQuests = purchasedQuests.filter((quest) =>
    quest.id === "rescue-shopkeeper" || quest.id === "rescue-me" || quest.id === "retrieve-lost-item"
  );
  const latePurchasedQuests = purchasedQuests.filter((quest) =>
    quest.id === "find-miner" || quest.id === "enter-tower"
  );
  if (purchasedQuests.length === 0 && !progression.hammerQuestPurchased && !cartographerQuestAvailable) return null;

  const renderPurchasedQuest = (quest: (typeof quests)[number]) => {
    const complete = progression.completedQuestIds.includes(quest.id);
    const active = progression.activeQuestId === quest.id;
    const blueprintDelivery = quest.id === "enter-tower"
      && progression.forgeBlueprintsRecovered
      && !progression.forgeBlueprintsDelivered;
    return (
      <div className={`quest-log-entry ${active ? "is-active" : ""}`} key={quest.id}>
        <span>{quest.name}</span>
        {complete ? (
          <strong>Complete</strong>
        ) : blueprintDelivery ? (
          <strong>Deliver Blueprints to Blacksmith</strong>
        ) : active ? (
          <strong>Active</strong>
        ) : (
          <button
            disabled={locked}
            onClick={() => onActivateQuest(quest.id)}
            title={locked ? "Finish the current expedition before changing quests." : undefined}
            type="button"
          >
            Make active
          </button>
        )}
      </div>
    );
  };

  return (
    <details className="quest-log" aria-label="Quest log">
      <summary>Quest log</summary>
      {earlyPurchasedQuests.map(renderPurchasedQuest)}
      {cartographerQuestAvailable && !progression.cartographerQuestCompleted && (
        <div className={`quest-log-entry ${cartographerQuestActive ? "is-active" : ""}`}>
          <span>Cartographer Survey</span>
          {cartographerQuestActive ? (
            <strong>Active</strong>
          ) : (
            <button onClick={onActivateCartographerQuest} type="button">Follow survey</button>
          )}
        </div>
      )}
      {progression.hammerQuestPurchased && (
        <div className={`quest-log-entry ${hammerQuestActive || progression.hammerQuestAttemptActive ? "is-active" : ""} ${progression.hammerQuestFailed ? "is-failed" : ""}`}>
          <span>Retrieve Hammer</span>
          {progression.hammerReturned ? (
            <strong>Complete</strong>
          ) : progression.hammerRecovered ? (
            <strong>Return to Blacksmith</strong>
          ) : hammerQuestActive || progression.hammerQuestAttemptActive ? (
            <strong>Active</strong>
          ) : progression.hammerQuestFailed ? (
            <span className="quest-log-status">
              <strong>Failed</strong>
              {hammerQuestAvailable && (
                <button onClick={onActivateHammerQuest} type="button">Retry quest</button>
              )}
            </span>
          ) : hammerQuestAvailable ? (
            <button onClick={onActivateHammerQuest} type="button">Accept quest</button>
          ) : (
            <strong>Visit Blacksmith</strong>
          )}
        </div>
      )}
      {latePurchasedQuests.map(renderPurchasedQuest)}
    </details>
  );
}
