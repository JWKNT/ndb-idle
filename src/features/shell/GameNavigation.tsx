import {
  adventureTabUnlocked,
  fishingTabUnlocked,
  hasNewShopContent,
  shopTabUnlocked,
  trainingTabUnlocked,
  type ProgressionState,
} from "@/game/progression";
import { formatWholeAmount } from "@/game/numbers";

export type GameView =
  | "adventure"
  | "party"
  | "battle"
  | "shop"
  | "training"
  | "fishing"
  | "mining"
  | "bestiary"
  | "crafting";

interface GameNavigationProps {
  progression: ProgressionState;
  view: GameView;
  onNavigate: (view: GameView) => void;
  onOpenHelp: () => void;
  onSaveAndQuit: () => void;
}

export function GameNavigation({
  progression,
  view,
  onNavigate,
  onOpenHelp,
  onSaveAndQuit,
}: GameNavigationProps) {
  const item = (target: GameView, label: string) => (
    <button
      className={view === target ? "is-active" : ""}
      onClick={() => onNavigate(target)}
      type="button"
    >
      {label}
    </button>
  );

  return (
    <header className="app-header">
      <nav className="primary-nav" aria-label="Main sections">
        {item("battle", "Battle")}
        {item("party", "Party")}
        {adventureTabUnlocked(progression) && item("adventure", "Adventure")}
        {shopTabUnlocked(progression) && (
          <button
            className={view === "shop" ? "is-active" : ""}
            onClick={() => onNavigate("shop")}
            type="button"
          >
            Shop {hasNewShopContent(progression) && <span className="new-marker">NEW</span>}
          </button>
        )}
        {trainingTabUnlocked(progression) && item("training", "Training")}
        {fishingTabUnlocked(progression) && item("fishing", "Fishing")}
        {progression.completedRaids.includes(7) && item("bestiary", "Bestiary")}
        {progression.miningUnlocked && item("mining", "Mining")}
        {progression.craftingUnlocked && item("crafting", "Crafting")}
      </nav>
      <div className="resource-display">
        <span>Gold: {formatWholeAmount(progression.gold)}</span>
        <button type="button" onClick={onOpenHelp}>Help</button>
        <button type="button" onClick={onSaveAndQuit}>Save &amp; quit to title</button>
      </div>
    </header>
  );
}
