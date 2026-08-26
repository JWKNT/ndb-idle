import { canStartRaid, maxHp } from "@/game/combat";
import { formatWholeAmount } from "@/game/numbers";
import type { BattleState, Position } from "@/game/types";
import { battleStory } from "@/content/story-dialogue";
import { BattleBoard } from "./BattleBoard";

interface BattleViewProps {
  battle: BattleState;
  autoMode: boolean;
  onToggleAuto: () => void;
  onTile: (position: Position) => void;
  onSecondaryTile: (position: Position) => void;
  onSelectDeploymentUnit: (unitId: string) => void;
  onStartBattle: () => void;
  onRetry: () => void;
}

export function BattleView({
  battle,
  autoMode,
  onToggleAuto,
  onTile,
  onSecondaryTile,
  onSelectDeploymentUnit,
  onStartBattle,
  onRetry,
}: BattleViewProps) {
  const actor = battle.units.find((unit) => unit.id === battle.activeUnitId);
  const manualEnabled = Boolean(actor?.team === "player" && !autoMode && battle.status === "fighting");
  const story = battleStory(battle.level.number);
  const party = battle.units.filter((unit) => unit.team === "player");

  return (
    <main className="battle-view">
      <div>
        <header className="page-heading">
          <h1>Battle {battle.level.number}: {battle.level.name}</h1>
          <div className="battle-party-health">
            {party.map((unit) => (
              <span key={unit.id}>
                <strong>{unit.name}</strong> {formatWholeAmount(unit.hp)}/{formatWholeAmount(maxHp(battle, unit))} HP
              </span>
            ))}
          </div>
        </header>

        <BattleBoard
          battle={battle}
          manualEnabled={manualEnabled}
          onSecondaryTile={onSecondaryTile}
          onTile={onTile}
        />

        <section className={`battle-controls ${battle.status === "deploying" ? "is-deploying" : ""}`}>
          {battle.status === "deploying" && (
            <div className="deployment-controls">
              <strong>Deploy party:</strong>
              {battle.units.filter((unit) => unit.team === "player").map((unit) => (
                <button
                  aria-pressed={unit.position.x >= 0}
                  className={unit.id === battle.deploymentUnitId ? "is-active" : ""}
                  key={unit.id}
                  onClick={() => onSelectDeploymentUnit(unit.id)}
                  type="button"
                >
                  {unit.name}{unit.position.x >= 0 ? " ✓" : ""}
                </button>
              ))}
              {!battle.units.some((unit) => unit.team === "player") && (
                <span>All party members are assigned elsewhere.</span>
              )}
              <button disabled={!canStartRaid(battle)} onClick={onStartBattle} type="button">Start battle</button>
            </div>
          )}
          {battle.status !== "deploying" && (
            <button onClick={onToggleAuto} type="button">
              Auto: {autoMode ? "on" : "off"} (Q)
            </button>
          )}
          <span>
            {battle.status === "deploying"
              ? battle.units.some((unit) => unit.team === "player")
                ? "Click a deployed member to remove them from this battle."
                : "Finish another activity to make a party member available."
              : autoMode
              ? "The battle is running automatically."
              : manualEnabled
                ? "Left-click to move or attack. Right-click an enemy for the weapon's secondary attack."
                : battle.status === "fighting"
                  ? "An enemy is taking its turn."
                  : "Battle complete."}
          </span>
          {battle.status === "lost" && (
            <button onClick={onRetry} type="button">
              Retry battle
            </button>
          )}
        </section>
      </div>

      <aside className="battle-sidebar">
        {story && (
          <section aria-label="Battle prelude" className="battle-story">
            {story.lines.map((line, index) => (
              <p key={index}>
                {line.speaker && <strong>{line.speaker}: </strong>}
                {line.text}
              </p>
            ))}
          </section>
        )}

        {battle.status !== "deploying" && (
          <section className="battle-attack-log">
            <h2>Battle log</h2>
            {battle.attackLog.length > 0 ? (
              <ol>
                {battle.attackLog.map((entry, index) => (
                  <li key={`${battle.actionCount}-${index}`}>{entry}</li>
                ))}
              </ol>
            ) : (
              <p>No attacks yet.</p>
            )}
          </section>
        )}
      </aside>
    </main>
  );
}
