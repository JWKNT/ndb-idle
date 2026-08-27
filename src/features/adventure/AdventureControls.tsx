import type { AdventureState, DungeonRoom } from "@/game/adventure";
import {
  type ProgressionState,
} from "@/game/progression";
import {
  ADVENTURE_AUTO_PAUSE_ROOMS,
  PORTAL_TYPES,
  type AdventureAutoPauseRoom,
  type AdventureStrategy,
  type PortalType,
} from "@/game/types";
import { type GameDropdownOption } from "@/features/shared/GameDropdown";

const STRATEGY_LABELS: Record<AdventureStrategy, { compact: string; detailed: string }> = {
  none: { compact: "None", detailed: "None" },
  quest: { compact: "Quest", detailed: "Aim for active quest" },
  together: { compact: "Stay together", detailed: "Stay together" },
  split: { compact: "Split apart", detailed: "Split apart" },
  ring: { compact: "Explore area", detailed: "Explore area" },
};

const PORTAL_AUTO_OPTIONS: Record<PortalType, {
  label: string;
  unlocked: (progression: ProgressionState) => boolean;
}> = {
  water: { label: "Enter water portals on auto", unlocked: (progression) => progression.fishingRod },
  forge: { label: "Enter Forge portals on auto", unlocked: (progression) => progression.forgeDungeonVisited },
};

const AUTO_PAUSE_OPTIONS: Record<AdventureAutoPauseRoom, {
  label: string;
  unlocked: (progression: ProgressionState) => boolean;
}> = {
  blacksmith: { label: "Turn off auto at Blacksmith", unlocked: (progression) => progression.blacksmithDiscovered },
  potionmaster: { label: "Turn off auto at Potionmaster", unlocked: (progression) => progression.potionmasterDiscovered },
  oddityBrewer: { label: "Turn off auto at Charles", unlocked: (progression) => progression.oddityBrewerDiscovered },
  cartographer: { label: "Turn off auto at Cartographer", unlocked: (progression) => progression.cartographerDiscovered },
  angler: { label: "Turn off auto at Angler", unlocked: (progression) => progression.anglerDiscovered },
  towerExterior: { label: "Turn off auto at Tower entrance", unlocked: (progression) => progression.towerDoorDiscovered },
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
        {PORTAL_TYPES.map((portalType) => PORTAL_AUTO_OPTIONS[portalType].unlocked(progression) && (
          <label className="plain-option" key={portalType}>
            <input
              checked={progression.autoEnterPortalTypes.includes(portalType)}
              onChange={(event) => onTogglePortalType(portalType, event.target.checked)}
              type="checkbox"
            />
            {PORTAL_AUTO_OPTIONS[portalType].label}
          </label>
        ))}
        {ADVENTURE_AUTO_PAUSE_ROOMS.map((room) => AUTO_PAUSE_OPTIONS[room].unlocked(progression) && (
          <label className="plain-option" key={room}>
            <input
              checked={progression.autoPauseAdventureRooms.includes(room)}
              onChange={(event) => onToggleAutoPauseRoom(room, event.target.checked)}
              type="checkbox"
            />
            {AUTO_PAUSE_OPTIONS[room].label}
          </label>
        ))}
      </div>
    </details>
  );
}
