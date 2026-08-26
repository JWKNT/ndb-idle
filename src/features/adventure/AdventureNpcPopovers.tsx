import type { ReactNode } from "react";
import { MATERIAL_META } from "@/game/items";
import { formatWholeAmount } from "@/game/numbers";
import {
  ANGLER_MATERIAL_COST,
  anglerMaterialsReady,
  ODDITY_BREWER_MATERIAL_COST,
  ODDITY_BREWER_POTION_REWARD,
  oddityBrewerRequiredMaterials,
  oddityBrewerRequirementsMet,
  potionmasterMaterialCost,
  potionmasterRequiredMaterials,
  potionmasterRequirementsMet,
  type ProgressionState,
} from "@/game/progression";
import { FISH_META, type MaterialId } from "@/game/items";
import { FISH_SPRITES, MATERIAL_SPRITES } from "@/content/inventory-sprites";
import type { SpriteName } from "@/content/sprites";
import { Sprite } from "@/features/shared/Sprite";
import { STORY_DIALOGUE } from "@/content/story-dialogue";

export function BlacksmithShopPopover({
  progression,
  onClose,
  onPurchaseHammerQuest,
  onPurchasePotion,
  onPurchasePickaxe,
  onPurchaseCraftingTable,
}: {
  progression: ProgressionState;
  onClose: () => void;
  onPurchaseHammerQuest: () => void;
  onPurchasePotion: () => void;
  onPurchasePickaxe: () => void;
  onPurchaseCraftingTable: () => void;
}) {
  return (
    <section
      aria-label="Blacksmith shop"
      className="blacksmith-shop-popover"
    >
      <header>
        <div>
          <h2>Blacksmith</h2>
          <span>{progression.materials.clay} Clay · {progression.materials.driftwood} Driftwood · {formatWholeAmount(progression.gold)} Gold</span>
        </div>
        <button aria-label="Close Blacksmith shop" onClick={onClose} type="button">×</button>
      </header>
      <div className="blacksmith-offer">
        <Sprite name="questScroll" />
        <div>
          <strong>Quest: Retrieve Hammer</strong>
          <small>20 Clay</small>
        </div>
        <button
          disabled={progression.hammerQuestPurchased || progression.materials.clay < 20}
          onClick={onPurchaseHammerQuest}
          type="button"
        >
          {progression.hammerReturned ? "Complete" : progression.hammerQuestPurchased ? "Purchased" : "Purchase"}
        </button>
      </div>
      <div className="blacksmith-offer">
        <Sprite name="blacksmithHealingPotion" />
        <div>
          <strong>Healing Potion</strong>
          <small>Restores 200 HP in Adventure · 50 Clay · Owned {progression.healingPotions}</small>
        </div>
        <button
          disabled={progression.materials.clay < 50}
          onClick={onPurchasePotion}
          type="button"
        >Buy</button>
      </div>
      {progression.hammerReturned && (
        <div className="blacksmith-offer">
          <Sprite name="pickaxe" />
          <div>
            <strong>Pickaxe</strong>
            <small>2,000 Gold · 20 Clay · 20 Driftwood</small>
          </div>
          <button
            disabled={progression.pickaxeOwned || progression.gold.lt(2_000) || progression.materials.clay < 20 || progression.materials.driftwood < 20}
            onClick={onPurchasePickaxe}
            type="button"
          >{progression.pickaxeOwned ? "Owned" : "Buy"}</button>
        </div>
      )}
      {progression.forgeBlueprintsDelivered && (
        <div className="blacksmith-offer">
          <Sprite name="craftingTable" />
          <div>
            <strong>Crafting Table</strong>
            <small>200,000 Gold · 20 Rusty Metal · 100 Clay · 10 Seaweed</small>
          </div>
          <button
            disabled={progression.craftingUnlocked
              || progression.gold.lt(200_000)
              || progression.materials["rusty-metal"] < 20
              || progression.materials.clay < 100
              || progression.materials.seaweed < 10}
            onClick={onPurchaseCraftingTable}
            type="button"
          >{progression.craftingUnlocked ? "Owned" : "Buy"}</button>
        </div>
      )}
    </section>
  );
}

export function AnglerPopover({
  progression,
  onClose,
  onDeliverMaterials,
  onDeliverFish,
}: {
  progression: ProgressionState;
  onClose: () => void;
  onDeliverMaterials: () => void;
  onDeliverFish: () => void;
}) {
  const requested = progression.anglerRequestedFish;
  return (
    <section aria-label="Angler's shack" className="blacksmith-shop-popover npc-popover angler-popover">
      <header><h2>Angler's Shack</h2><button aria-label="Close Angler" onClick={onClose} type="button">×</button></header>
      <div className="potionmaster-portrait"><Sprite name="angler" /><p>{STORY_DIALOGUE.npcs.angler}</p></div>
      {!progression.anglerMaterialsDelivered ? (
        <>
          <div className="potionmaster-materials">
            {Object.entries(ANGLER_MATERIAL_COST).map(([id, cost]) => (
              <div className={progression.materials[id as MaterialId] >= (cost ?? 0) ? "is-ready" : ""} key={id}>
                <Sprite name={MATERIAL_SPRITES[id as MaterialId]} />
                <span>{MATERIAL_META[id as MaterialId].name}</span>
                <strong>{Math.min(cost ?? 0, progression.materials[id as MaterialId])}/{cost}</strong>
              </div>
            ))}
          </div>
          <button disabled={!anglerMaterialsReady(progression)} onClick={onDeliverMaterials} type="button">Hand over materials</button>
        </>
      ) : !progression.tackleBoxOwned && requested ? (
        <div className="blacksmith-offer">
          <Sprite name={FISH_SPRITES[requested]} />
          <div><strong>{FISH_META[requested].name}</strong><small>Catch one from this fish family · Owned {progression.fish[requested]}</small></div>
          <button disabled={progression.fish[requested] <= 0} onClick={onDeliverFish} type="button">Hand over fish</button>
        </div>
      ) : (
        <div className="blacksmith-offer"><Sprite name="tackleBox" /><div><strong>Tackle Box earned</strong><small>Favor one fish family before casting without changing the total catch chance.</small></div></div>
      )}
    </section>
  );
}

export function NpcPopover({
  name,
  sprite,
  onClose,
  children,
}: {
  name: string;
  sprite: SpriteName;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <section aria-label={name} className="blacksmith-shop-popover npc-popover">
      <header>
        <h2>{name}</h2>
        <button aria-label={`Close ${name}`} onClick={onClose} type="button">×</button>
      </header>
      <div className="potionmaster-portrait">
        <Sprite name={sprite} />
        <div>{children}</div>
      </div>
    </section>
  );
}

export function PotionmasterPopover({
  progression,
  onClose,
  onComplete,
}: {
  progression: ProgressionState;
  onClose: () => void;
  onComplete: () => void;
}) {
  const complete = progression.potionmasterQuestCompleted;
  return (
    <section aria-label="Lost Potionmaster" className="blacksmith-shop-popover potionmaster-popover">
      <header>
        <div>
          <h2>Lost Potionmaster</h2>
        </div>
        <button aria-label="Close Potionmaster" onClick={onClose} type="button">×</button>
      </header>
      <div className="potionmaster-portrait">
        <Sprite name="potionmaster" />
        <p>{STORY_DIALOGUE.npcs.potionmaster}</p>
      </div>
      <div className="potionmaster-materials">
        {potionmasterRequiredMaterials().map((id) => {
          const cost = potionmasterMaterialCost(id);
          return (
            <div className={progression.materials[id] >= cost ? "is-ready" : ""} key={id}>
              <Sprite name={id === "rat-pelt" ? "ratPelt" : id === "ant-chitin" ? "antChitin" : id === "ink-sac" ? "inkSac" : "fireAlligatorHide"} />
              <span>{MATERIAL_META[id].name}</span>
              <strong>{Math.min(cost, progression.materials[id])}/{cost}</strong>
            </div>
          );
        })}
      </div>
      <div className="blacksmith-offer potionmaster-reward">
        <Sprite name="magicBait" />
        <div>
          <strong>{complete ? "Delivery complete" : "Reward"}</strong>
          <small>4 random Level 2 Potions · 100 Magic Bait (5% fish chance each)</small>
        </div>
        <button
          disabled={complete || !potionmasterRequirementsMet(progression)}
          onClick={onComplete}
          type="button"
        >{complete ? "Complete" : "Deliver"}</button>
      </div>
    </section>
  );
}

export function OddityBrewerPopover({
  progression,
  onClose,
  onComplete,
}: {
  progression: ProgressionState;
  onClose: () => void;
  onComplete: () => void;
}) {
  const complete = progression.oddityBrewerCompleted;
  return (
    <section aria-label="The Crooked Still" className="blacksmith-shop-popover potionmaster-popover">
      <header>
        <div><h2>The Crooked Still</h2></div>
        <button aria-label="Close Charles" onClick={onClose} type="button">×</button>
      </header>
      <div className="potionmaster-portrait">
        <Sprite name="oddityBrewer" />
        <p>{STORY_DIALOGUE.npcs.charles}</p>
      </div>
      <div className="potionmaster-materials">
        {oddityBrewerRequiredMaterials().map((id) => (
          <div className={progression.materials[id] >= ODDITY_BREWER_MATERIAL_COST ? "is-ready" : ""} key={id}>
            <Sprite name={MATERIAL_SPRITES[id]} />
            <span>{MATERIAL_META[id].name}</span>
            <strong>{Math.min(ODDITY_BREWER_MATERIAL_COST, progression.materials[id])}/{ODDITY_BREWER_MATERIAL_COST}</strong>
          </div>
        ))}
      </div>
      <div className="blacksmith-offer potionmaster-reward">
        <Sprite name="potionMystery" />
        <div>
          <strong>{complete ? "Batch complete" : "Reward"}</strong>
          <small>{ODDITY_BREWER_POTION_REWARD} Level 1 Mystery Potions</small>
        </div>
        <button disabled={complete || !oddityBrewerRequirementsMet(progression)} onClick={onComplete} type="button">
          {complete ? "Complete" : "Brew"}
        </button>
      </div>
    </section>
  );
}
