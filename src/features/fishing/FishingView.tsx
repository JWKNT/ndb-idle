import { useEffect, useState } from "react";
import { MATERIAL_SPRITES } from "@/content/inventory-sprites";
import { getPlayer } from "@/content/players";
import type { SpriteName } from "@/content/sprites";
import { FISHING_BAIT_IDS, FISH_META, FISH_STATS, MATERIAL_META, type MaterialId } from "@/game/items";
import { partyMemberIds, type ProgressionState } from "@/game/progression";
import type { PlayerId } from "@/game/types";
import type { StatKey } from "@/game/types";
import { GameDropdown } from "@/features/shared/GameDropdown";
import { Sprite } from "@/features/shared/Sprite";

interface FishingViewProps {
  progression: ProgressionState;
  unavailableMembers: PlayerId[];
  onStart: (memberId: PlayerId, baitId: MaterialId, mode: "manual" | "auto") => void;
  onStop: () => void;
  onChooseFavoredFish: (stat: StatKey | null) => void;
}

export function FishingView({ progression, unavailableMembers, onStart, onStop, onChooseFavoredFish }: FishingViewProps) {
  const availableMembers = partyMemberIds(progression).filter((id) => !unavailableMembers.includes(id));
  const [memberId, setMemberId] = useState<PlayerId>(availableMembers[0] ?? "knight");
  const availableBaitIds = availableFishingBaitIds(progression.materials);
  const [baitId, setBaitId] = useState<MaterialId>(() => availableBaitIds[0] ?? "rat-pelt");
  const assignment = progression.fishingAssignment;
  const sceneMemberId = assignment?.memberId ?? memberId;
  const poolSprites = fishingPoolSprites(assignment?.baitId);
  const selectedBaitId = availableBaitIds.includes(baitId as typeof FISHING_BAIT_IDS[number])
    ? baitId
    : availableBaitIds[0];

  useEffect(() => {
    if (selectedBaitId && selectedBaitId !== baitId) setBaitId(selectedBaitId);
  }, [baitId, selectedBaitId]);

  return (
    <main className="simple-page fishing-view">
      <header className="page-heading">
        <h1>Fishing</h1>
        <p>Each bait funds one cast. Bait quality determines the chance of catching a fish.</p>
      </header>
      <div className="fishing-layout">
        <section className="fishing-main-column">
          <section className={`fishing-scene ${assignment ? "is-fishing" : ""}`} aria-label={assignment ? `${getPlayer(sceneMemberId).name} at the fishing pool` : "Empty fishing pool"}>
            {assignment && (
              <>
                <div className="fishing-bank">
                  <Sprite name={sceneMemberId} />
                  <Sprite name="fishingRod" />
                </div>
                <div className="fishing-line" aria-hidden="true">
                  <Sprite name={MATERIAL_SPRITES[assignment.baitId]} />
                </div>
              </>
            )}
            <div className="fishing-pool" aria-hidden="true">
              <span className="fishing-ripple ripple-one" />
              <span className="fishing-ripple ripple-two" />
              {poolSprites.map((sprite, index) => (
                <Sprite key={`${sprite}-${index}`} name={sprite} />
              ))}
            </div>
          </section>
          {assignment ? (
            <section className="info-box">
              <h2>Fishing now</h2>
              <p>
                {getPlayer(assignment.memberId).name} is using {MATERIAL_META[assignment.baitId].name} · {" "}
                Auto fishing.
              </p>
              <p>Next cast: {(3 - assignment.progressSeconds).toFixed(1)}s</p>
              <p>{MATERIAL_META[assignment.baitId].reusableBait
                ? "This bait is reusable and will fish until stopped."
                : `Bait remaining after the active one: ${progression.materials[assignment.baitId]}`}</p>
              <p>{baitOddsDescription(assignment.baitId)}</p>
              <button onClick={onStop} type="button">Stop fishing</button>
            </section>
          ) : (
            <section className="info-box">
              <h2>Assign fisherman</h2>
              <div className="plain-option">
                <span>Party member</span>
                <GameDropdown
                  ariaLabel="Choose fisherman"
                  className="fishing-member-dropdown"
                  onChange={setMemberId}
                  options={partyMemberIds(progression).map((id) => ({
                    disabled: unavailableMembers.includes(id),
                    label: `${getPlayer(id).name}${unavailableMembers.includes(id) ? " — currently dispatched" : ""}`,
                    value: id,
                  }))}
                  value={memberId}
                />
              </div>
              <div className="plain-option">
                <span>Bait</span>
                <GameDropdown
                  ariaLabel="Choose bait"
                  className="fishing-bait-dropdown"
                  onChange={setBaitId}
                  options={availableBaitIds.map((id) => ({
                    label: `${MATERIAL_META[id].name} ×${progression.materials[id]} — ${baitOddsDescription(id)}`,
                    value: id,
                  }))}
                  value={selectedBaitId ?? baitId}
                />
              </div>
              <button
                disabled={!selectedBaitId || !availableMembers.includes(memberId)}
                onClick={() => selectedBaitId && onStart(memberId, selectedBaitId, "auto")}
                type="button"
              >
                {selectedBaitId && MATERIAL_META[selectedBaitId].reusableBait
                  ? "Auto fish until stopped"
                  : selectedBaitId ? "Auto fish until bait is depleted" : "No bait in inventory"}
              </button>
            </section>
          )}
          {progression.tackleBoxOwned && (
            <section className="info-box tackle-box-panel">
              <div className="tackle-box-heading">
                <Sprite name="tackleBox" />
                <div><h2>Tackle Box</h2><p>Favor one family. Total catch chance stays unchanged.</p></div>
              </div>
              <div className="plain-option">
                <span>Favored fish</span>
                <GameDropdown
                  ariaLabel="Choose favored fish"
                  className="fishing-favored-dropdown"
                  onChange={(value) => onChooseFavoredFish(value ? value as StatKey : null)}
                  options={[
                    { label: "No preference", value: "" },
                    ...FISH_STATS.map((stat) => ({ label: FISH_META[stat].name, value: stat })),
                  ]}
                  value={progression.favoredFishStat ?? ""}
                />
              </div>
            </section>
          )}
        </section>
        <aside className="fishing-sidebar">
          <section className="info-box fishing-log">
            <h2>Fishing log</h2>
            {progression.fishingLog.length > 0 ? (
              <ol>
                {progression.fishingLog.map((entry, index) => (
                  <li key={`${entry}-${index}`}>{entry}</li>
                ))}
              </ol>
            ) : (
              <p className="empty-log">Nothing caught yet.</p>
            )}
          </section>
        </aside>
      </div>
    </main>
  );
}

function fishingPoolSprites(baitId: MaterialId | undefined): SpriteName[] {
  const materialOdds = baitId ? MATERIAL_META[baitId].materialCatchChances : undefined;
  if (materialOdds) {
    const materialSprites = Object.entries(materialOdds)
      .filter(([, chance]) => (chance ?? 0) > 0)
      .map(([materialId]) => MATERIAL_SPRITES[materialId as MaterialId]);
    if (materialSprites.length > 0) return materialSprites.slice(0, 2);
  }
  return ["fishHeartyHalibut", "fishQuickQuillfish"];
}

function baitOddsDescription(id: MaterialId): string {
  const materialOdds = MATERIAL_META[id].materialCatchChances;
  if (materialOdds) {
    return Object.entries(materialOdds)
      .map(([materialId, chance]) => `${MATERIAL_META[materialId as MaterialId].name} ${Math.round((chance ?? 0) * 100)}%`)
      .join(" · ");
  }
  return `${Math.round(MATERIAL_META[id].catchChance * 100)}% fish chance`;
}

export function availableFishingBaitIds(
  materials: ProgressionState["materials"],
): Array<(typeof FISHING_BAIT_IDS)[number]> {
  return FISHING_BAIT_IDS.filter((id) => materials[id] > 0);
}
