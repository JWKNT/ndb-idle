import {
  adventureTabUnlocked,
  fishingTabUnlocked,
  hasNewShopContent,
  shopTabUnlocked,
  trainingTabUnlocked,
  type ProgressionState,
} from "@/game/progression";
import { formatWholeAmount } from "@/game/numbers";

export const GAME_VIEW_IDS = [
  "battle",
  "party",
  "adventure",
  "shop",
  "training",
  "fishing",
  "bestiary",
  "mining",
  "crafting",
] as const;
export type GameView = (typeof GAME_VIEW_IDS)[number];

export const GAME_VIEW_NAVIGATION: Record<GameView, {
  label: string;
  unlocked: (progression: ProgressionState) => boolean;
  hasNewContent?: (progression: ProgressionState) => boolean;
}> = {
  battle: { label: "Battle", unlocked: () => true },
  party: { label: "Party", unlocked: () => true },
  adventure: { label: "Adventure", unlocked: adventureTabUnlocked },
  shop: { label: "Shop", unlocked: shopTabUnlocked, hasNewContent: hasNewShopContent },
  training: { label: "Training", unlocked: trainingTabUnlocked },
  fishing: { label: "Fishing", unlocked: fishingTabUnlocked },
  bestiary: { label: "Bestiary", unlocked: (progression) => progression.completedRaids.includes(7) },
  mining: { label: "Mining", unlocked: (progression) => progression.miningUnlocked },
  crafting: { label: "Crafting", unlocked: (progression) => progression.craftingUnlocked },
};

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
  return (
    <header className="app-header">
      <nav className="primary-nav" aria-label="Main sections">
        {GAME_VIEW_IDS.map((target) => {
          const item = GAME_VIEW_NAVIGATION[target];
          if (!item.unlocked(progression)) return null;
          return (
            <button
              className={view === target ? "is-active" : ""}
              key={target}
              onClick={() => onNavigate(target)}
              type="button"
            >
              {item.label}
              {item.hasNewContent?.(progression) && <> <span className="new-marker">NEW</span></>}
            </button>
          );
        })}
      </nav>
      <div className="resource-display">
        <span>Gold: {formatWholeAmount(progression.gold)}</span>
        <button type="button" onClick={onOpenHelp}>Help</button>
        <button type="button" onClick={onSaveAndQuit}>Save &amp; quit to title</button>
      </div>
    </header>
  );
}
