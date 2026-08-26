import { useState } from "react";
import { getPlayer } from "@/content/players";
import { trainingMultiplier } from "@/game/combat";
import {
  formatDecimal,
  getPartyMember,
  memberStats,
  partyMemberIds,
  trainingCost,
  type ProgressionState,
} from "@/game/progression";
import { formatWholeAmount } from "@/game/numbers";
import { STAT_KEYS, STAT_META, type PlayerId, type StatKey } from "@/game/types";

interface TrainingViewProps {
  progression: ProgressionState;
  onTrain: (memberId: PlayerId, stat: StatKey) => void;
  onReturnToBattle: () => void;
}

export function TrainingView({ progression, onTrain, onReturnToBattle }: TrainingViewProps) {
  const members = partyMemberIds(progression);
  const [selectedMember, setSelectedMember] = useState<PlayerId>(members[0] ?? "knight");
  const memberId = members.includes(selectedMember) ? selectedMember : members[0] ?? "knight";
  const progress = getPartyMember(progression, memberId);
  const stats = memberStats(progression, memberId);
  return (
    <main className="training-view">
      <header className="page-heading">
        <h1>Training</h1>
        <p>Victories: {progression.victories} · Available gold: {formatWholeAmount(progression.gold)}</p>
      </header>

      <section className="member-selector" aria-label="Training member">
        {members.map((id) => (
          <button
            className={id === memberId ? "is-active" : ""}
            key={id}
            onClick={() => setSelectedMember(id)}
            type="button"
          >
            {getPlayer(id).name}
          </button>
        ))}
      </section>

      <section>
        <h2>{getPlayer(memberId).name} stats</h2>
        <table className="training-table">
          <thead>
            <tr><th>Training</th><th>Level</th><th>Value</th></tr>
          </thead>
          <tbody>
            {STAT_KEYS.map((stat) => {
              const level = progress.training[stat];
              const cost = trainingCost(progression, memberId, stat);
              const multiplier = trainingMultiplier(level);
              return (
                <tr key={stat}>
                  <td>
                    <button disabled={progression.gold.lt(cost)} onClick={() => onTrain(memberId, stat)} type="button">
                      Buy {STAT_META[stat].label} for {formatWholeAmount(cost)} Gold
                    </button>
                  </td>
                  <td>Level {level + 1} (×{multiplier.lt(1_000) ? multiplier.toFixed(3) : formatDecimal(multiplier)})</td>
                  <td>{formatDecimal(stats[stat])}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <button onClick={onReturnToBattle} type="button">Return to battle</button>
    </main>
  );
}
