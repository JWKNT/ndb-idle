import type { AdventureState, DungeonRoom } from "@/game/adventure";
import {
  type ProgressionState,
} from "@/game/progression";
import type {
  AdventureAutoPauseRoom,
  AdventureStrategy,
  PortalType,
} from "@/game/types";
import { type GameDropdownOption } from "@/features/shared/GameDropdown";

const STRATEGY_LABELS: Record<AdventureStrategy, { compact: string; detailed: string }> = {
  none: { compact: "None", detailed: "None" },
  quest: { compact: "Quest", detailed: "Aim for active quest" },
  together: { compact: "Stay together", detailed: "Stay together" },
  split: { compact: "Split apart", detailed: "Split apart" },
  ring: { compact: "Explore area", detailed: "Explore area" },
};

const ADVENTURE_AREA_NAMES: Record<number, string> = {
  1: "The Underdrain",
  2: "Overgrown Galleries",
  3: "Clay Catacombs",
  4: "Cinder Warrens",
};

const LANDMARK_ROUTE_LABELS: Partial<Record<DungeonRoom["kind"], string>> = {
  portal: "Quest portal",
  waterPortal: "Water portal",
  forgePortal: "Forge portal",
  blacksmith: "Blacksmith",
  potionmaster: "Potionmaster",
  oddityBrewer: "Charles",
  towerExterior: "Tower",
  cartographer: "Cartographer",
  angler: "Angler's Shack",
};

export function adventureStrategyDropdownOptions(
  available: AdventureStrategy[],
  detailed: boolean,
): GameDropdownOption<AdventureStrategy>[] {
  return available.map((strategy) => ({
    label: detailed ? STRATEGY_LABELS[strategy].detailed : STRATEGY_LABELS[strategy].compact,
    value: strategy,
  }));
}

export function adventureAreaDropdownOptions(areas: number[]): GameDropdownOption<number>[] {
  return areas.map((area) => ({
    label: ADVENTURE_AREA_NAMES[area] ?? `Area ${area}`,
    value: area,
  }));
}

export function discoveredLandmarkOptions(
  adventure: AdventureState,
): GameDropdownOption<string>[] {
  const seenKinds = new Set<DungeonRoom["kind"]>();
  const routeableRooms = Object.values(adventure.rooms)
    .filter((room) => {
      if (!LANDMARK_ROUTE_LABELS[room.kind] || seenKinds.has(room.kind)) return false;
      seenKinds.add(room.kind);
      return true;
    })
    .sort((a, b) => a.number - b.number);
  return [
    { label: "None", value: "" },
    ...routeableRooms.map((room) => ({
      label: LANDMARK_ROUTE_LABELS[room.kind]!,
      value: room.key,
    })),
  ];
}

export function AdventureRestartToggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (enabled: boolean) => void;
}) {
  return (
    <label className={`adventure-restart-option ${checked ? "is-enabled" : ""}`}>
      <input
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
      <span className="adventure-restart-copy">
        <strong>Restart adventure at full HP</strong>
        <small>Begin another expedition when the selected party has recovered.</small>
      </span>
    </label>
  );
}

export function AdvancedAdventureOptions({
  progression,
  onToggleIgnoreGold,
  onToggleAutoPauseRoom,
  onTogglePortalType,
}: {
  progression: ProgressionState;
  onToggleIgnoreGold: (enabled: boolean) => void;
  onToggleAutoPauseRoom: (room: AdventureAutoPauseRoom, enabled: boolean) => void;
  onTogglePortalType: (portalType: PortalType, enabled: boolean) => void;
}) {
  const showWaterPortal = progression.fishingRod;
  const showForgePortal = progression.forgeDungeonVisited;
  const showBlacksmith = progression.blacksmithDiscovered;
  const showPotionmaster = progression.potionmasterDiscovered;
  const showOddityBrewer = progression.oddityBrewerDiscovered;
  const showCartographer = progression.cartographerDiscovered;
  const showAngler = progression.anglerDiscovered;
  const showTower = progression.towerDoorDiscovered;
  return (
    <details className="adventure-advanced-options">
      <summary>Advanced</summary>
      <div className="adventure-advanced-list">
        {progression.completedRaids.includes(8) && (
          <label className="plain-option">
            <input
              checked={progression.adventureIgnoreGold}
              onChange={(event) => onToggleIgnoreGold(event.target.checked)}
              type="checkbox"
            />
            Ignore gold on auto
          </label>
        )}
        {showWaterPortal && (
          <label className="plain-option">
            <input
              checked={progression.autoEnterPortalTypes.includes("water")}
              onChange={(event) => onTogglePortalType("water", event.target.checked)}
              type="checkbox"
            />
            Enter water portals on auto
          </label>
        )}
        {showForgePortal && (
          <label className="plain-option">
            <input
              checked={progression.autoEnterPortalTypes.includes("forge")}
              onChange={(event) => onTogglePortalType("forge", event.target.checked)}
              type="checkbox"
            />
            Enter Forge portals on auto
          </label>
        )}
        {showBlacksmith && (
          <label className="plain-option">
            <input
              checked={progression.autoPauseAdventureRooms.includes("blacksmith")}
              onChange={(event) => onToggleAutoPauseRoom("blacksmith", event.target.checked)}
              type="checkbox"
            />
            Turn off auto at Blacksmith
          </label>
        )}
        {showPotionmaster && (
          <label className="plain-option">
            <input
              checked={progression.autoPauseAdventureRooms.includes("potionmaster")}
              onChange={(event) => onToggleAutoPauseRoom("potionmaster", event.target.checked)}
              type="checkbox"
            />
            Turn off auto at Potionmaster
          </label>
        )}
        {showOddityBrewer && (
          <label className="plain-option">
            <input
              checked={progression.autoPauseAdventureRooms.includes("oddityBrewer")}
              onChange={(event) => onToggleAutoPauseRoom("oddityBrewer", event.target.checked)}
              type="checkbox"
            />
            Turn off auto at Charles
          </label>
        )}
        {showCartographer && (
          <label className="plain-option">
            <input
              checked={progression.autoPauseAdventureRooms.includes("cartographer")}
              onChange={(event) => onToggleAutoPauseRoom("cartographer", event.target.checked)}
              type="checkbox"
            />
            Turn off auto at Cartographer
          </label>
        )}
        {showAngler && (
          <label className="plain-option">
            <input
              checked={progression.autoPauseAdventureRooms.includes("angler")}
              onChange={(event) => onToggleAutoPauseRoom("angler", event.target.checked)}
              type="checkbox"
            />
            Turn off auto at Angler
          </label>
        )}
        {showTower && (
          <label className="plain-option">
            <input
              checked={progression.autoPauseAdventureRooms.includes("towerExterior")}
              onChange={(event) => onToggleAutoPauseRoom("towerExterior", event.target.checked)}
              type="checkbox"
            />
            Turn off auto at Tower entrance
          </label>
        )}
      </div>
    </details>
  );
}
