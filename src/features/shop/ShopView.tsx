import { useState, type ReactNode } from "react";
import { quests, type QuestId } from "@/content/quests";
import {
  FISH_META,
  FISH_STATS,
  MATERIAL_IDS,
  MATERIAL_META,
  bulkSellAmounts,
  type MaterialId,
} from "@/game/items";
import {
  gearSellPrice,
  inventorySlotCapacity,
  inventorySlotUpgradeCost,
  inventoryStackCapacity,
  inventoryStackUpgradeCost,
  hasNewShopContent,
  UNDEAD_GEM_COST,
  type ProgressionState,
} from "@/game/progression";
import { formatWholeAmount } from "@/game/numbers";
import { POTION_IDS, POTION_META, type PotionId } from "@/game/potions";
import { STAT_META, type StatKey } from "@/game/types";
import {
  ESCAPE_ROPES,
  ESCAPE_ROPE_LEVELS,
  maximumPurchasableEscapeRopeLevel,
  type EscapeRopeLevel,
} from "@/game/escape-ropes";
import { createUndeadGemGear, isMilestoneGear } from "@/game/gear";
import { ESCAPE_ROPE_SPRITES, POTION_SPRITES } from "@/content/inventory-sprites";
import type { SpriteName } from "@/content/sprites";
import { Sprite } from "@/features/shared/Sprite";

interface ShopViewProps {
  progression: ProgressionState;
  onPurchaseQuest: (questId: QuestId) => void;
  onPurchasePotion: (potionId: PotionId) => void;
  onPurchaseEscapeRope: (level: EscapeRopeLevel) => void;
  onPurchaseInventorySlots: () => void;
  onPurchaseStackSize: () => void;
  onPurchaseUndeadGem: () => void;
  onSellMaterial: (materialId: MaterialId, amount: number) => void;
  onSellFish: (stat: StatKey, amount: number) => void;
  onSellGear: (itemId: string) => void;
  onAcknowledgeCategory: (category: "quests" | "potions") => void;
}

type ShopMode = "buy" | "sell" | null;
type BuyCategory = "accessories" | "quests" | "potions" | "storage" | "supplies" | null;

export function ShopView({
  progression,
  onPurchasePotion,
  onPurchaseEscapeRope,
  onPurchaseInventorySlots,
  onPurchaseStackSize,
  onPurchaseUndeadGem,
  onPurchaseQuest,
  onSellMaterial,
  onSellFish,
  onSellGear,
  onAcknowledgeCategory,
}: ShopViewProps) {
  const [mode, setMode] = useState<ShopMode>(null);
  const [buyCategory, setBuyCategory] = useState<BuyCategory>(null);
  const unlockedQuests = quests.filter((quest) =>
    quest.shopAvailable
    && progression.completedRaids.includes(quest.unlockBattle)
    && (quest.id !== "enter-tower" || progression.towerQuestAvailable)
  );
  const maximumRopeLevel = maximumPurchasableEscapeRopeLevel(progression.highestAdventureRingVisited);
  const undeadGem = createUndeadGemGear();
  const ownsUndeadGem = progression.inventory.some((item) => item.id === undeadGem.id);
  const ownedMaterials = MATERIAL_IDS.filter((id) => progression.materials[id] > 0 && MATERIAL_META[id].sellPrice > 0);
  const ownedFish = progression.fishingRod
    ? FISH_STATS.filter((stat) => progression.fish[stat] > 0)
    : [];
  const equippedItemIds = new Set(
    Object.values(progression.equipment).flatMap((equipment) =>
      equipment
        ? Object.values(equipment).filter((itemId): itemId is string => Boolean(itemId))
        : []
    ),
  );
  const sellableGear = progression.inventory.filter((item) =>
    !equippedItemIds.has(item.id) && !isMilestoneGear(item)
  );
  const hasSellableInventory = ownedMaterials.length > 0
    || ownedFish.length > 0
    || sellableGear.length > 0;
  const slotUpgradeCost = inventorySlotUpgradeCost(progression.inventorySlotUpgrades);
  const stackUpgradeCost = inventoryStackUpgradeCost(progression.inventoryStackUpgrades);
  const visiblePotionIds = POTION_IDS.filter((id) =>
    POTION_META[id].cost > 0
    && (POTION_META[id].level === 1 || progression.completedRaids.includes(9))
  );

  const chooseMode = (nextMode: Exclude<ShopMode, null>) => {
    setMode(nextMode);
    setBuyCategory(null);
  };

  return (
    <main className="simple-page shop-view">
      <header className="page-heading">
        <h1>Shop</h1>
        <p>Gold: {formatWholeAmount(progression.gold)}</p>
      </header>

      <section className="shopkeeper-stall" aria-label="Shopkeeper counter">
        <span className="shopkeeper-stall-sprite"><Sprite name="shopkeeper" /></span>
        <span className="shopkeeper-counter-front" aria-hidden="true" />
        <div>
          <strong>Shopkeeper</strong>
        </div>
      </section>

      {mode === null ? (
        <section className="shop-choice">
          <h2>What would you like to do?</h2>
          <button onClick={() => chooseMode("buy")} type="button">Buy</button>{" "}
          <button onClick={() => chooseMode("sell")} type="button">Sell</button>
        </section>
      ) : (
        <button onClick={() => setMode(null)} type="button">Back to Buy / Sell</button>
      )}

      {mode === "buy" && buyCategory === null && (
        <section className="shop-choice">
          <h2>Buy category</h2>
          {unlockedQuests.length > 0 && (
            <button onClick={() => { setBuyCategory("quests"); onAcknowledgeCategory("quests"); }} type="button">
              Quests {hasNewShopContent(progression, "quests") && <span className="new-marker">NEW</span>}
            </button>
          )}
          {unlockedQuests.length > 0 && " "}
          <button onClick={() => setBuyCategory("accessories")} type="button">Accessories</button>{" "}
          <button onClick={() => { setBuyCategory("potions"); onAcknowledgeCategory("potions"); }} type="button">
            Potions {hasNewShopContent(progression, "potions") && <span className="new-marker">NEW</span>}
          </button>{" "}
          <button onClick={() => setBuyCategory("supplies")} type="button">Adventure supplies</button>{" "}
          <button onClick={() => setBuyCategory("storage")} type="button">Storage upgrades</button>
        </section>
      )}

      {mode === "buy" && buyCategory && (
        <button onClick={() => setBuyCategory(null)} type="button">Back to categories</button>
      )}

      {mode === "buy" && buyCategory === "quests" && (
        <section className="quest-list">
          <h2>Quests</h2>
          <p>Purchased quests are managed from the Quest log in Adventure.</p>
          {unlockedQuests.map((quest) => {
            const complete = progression.completedQuestIds.includes(quest.id);
            const active = progression.activeQuestId === quest.id;
            const purchased = progression.purchasedQuestIds.includes(quest.id);
            const status = complete ? "Complete" : active ? "Active" : purchased ? "Purchased" : "Available";
            return (
              <article className={`quest-card ${active ? "is-active" : ""}`} key={quest.id}>
                <h3><ShopItemLabel sprite="questScroll">{quest.name}</ShopItemLabel></h3>
                <p>Cost to accept: {formatWholeAmount(quest.cost)} gold</p>
                <p>Status: {status}</p>
                {!complete && !purchased && (
                  <button
                    disabled={progression.gold.lt(quest.cost)}
                    onClick={() => onPurchaseQuest(quest.id)}
                    type="button"
                  >
                    Accept quest
                  </button>
                )}
              </article>
            );
          })}
        </section>
      )}

      {mode === "buy" && buyCategory === "accessories" && (
        <section>
          <h2>Accessories</h2>
          <article className="quest-card">
            <h3><ShopItemLabel sprite="gearUndeadGem">{undeadGem.name}</ShopItemLabel></h3>
            <p>A cold green gem that parts the force field protecting powerful undead.</p>
            <p>Accessory · +4 Sp. Defense · +1 Luck</p>
            <p>Price: {UNDEAD_GEM_COST} gold</p>
            <button
              disabled={ownsUndeadGem || progression.gold.lt(UNDEAD_GEM_COST)}
              onClick={onPurchaseUndeadGem}
              type="button"
            >
              {ownsUndeadGem ? "Owned" : "Buy"}
            </button>
          </article>
        </section>
      )}

      {mode === "buy" && buyCategory === "potions" && (
        <section>
          <h2>Potions</h2>
          <p>Potions are stored in Party inventory until consumed. Reusing the same level extends its duration; when levels overlap, only the stronger effect applies.</p>
          <table className="inventory-table">
            <thead><tr><th>Potion</th><th>Effect</th><th>Owned</th><th>Price</th><th>Action</th></tr></thead>
            <tbody>
              {visiblePotionIds.map((id) => (
                <tr key={id}>
                    <th scope="row"><ShopItemLabel sprite={POTION_SPRITES[id]}>{POTION_META[id].name}</ShopItemLabel></th>
                  <td>{POTION_META[id].description}</td>
                  <td>{progression.potions?.[id] ?? 0}</td>
                  <td>{POTION_META[id].cost.toLocaleString()} gold</td>
                  <td>
                    <button
                      disabled={progression.gold.lt(POTION_META[id].cost)}
                      onClick={() => onPurchasePotion(id)}
                      type="button"
                    >
                      Buy
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {mode === "buy" && buyCategory === "supplies" && (
        <section>
          <h2>Adventure supplies</h2>
          {maximumRopeLevel === 0 ? (
            <p>Travel at least 2 rooms from the entrance to unlock the first Escape Rope.</p>
          ) : (
            <table className="inventory-table">
              <thead><tr><th>Supply</th><th>Works in</th><th>Owned</th><th>Price</th><th>Action</th></tr></thead>
              <tbody>
                {ESCAPE_ROPE_LEVELS.filter((level) => level <= maximumRopeLevel).map((level) => (
                  <tr key={level}>
                    <th scope="row"><ShopItemLabel sprite={ESCAPE_ROPE_SPRITES[level]}>Level {level} Escape Rope</ShopItemLabel></th>
                    <td>{level === 1 ? "Entrance / 1 room away" : `${level} rooms from entrance`}</td>
                    <td>{progression.escapeRopes[level]}</td>
                    <td>{ESCAPE_ROPES[level].cost.toLocaleString()} gold</td>
                    <td>
                      <button
                        disabled={progression.gold.lt(ESCAPE_ROPES[level].cost)}
                        onClick={() => onPurchaseEscapeRope(level)}
                        type="button"
                      >
                        Buy
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}

      {mode === "buy" && buyCategory === "storage" && (
        <section className="storage-upgrade-shop">
          <h2>Storage upgrades</h2>
          <article className="quest-card storage-upgrade-card">
            <h3><ShopItemLabel sprite="inventorySlotsUpgrade">Backpack expansion</ShopItemLabel></h3>
            <p>
              {inventorySlotCapacity(progression)} unique slots now · +2 slots per purchase
            </p>
            <p>Price: {formatWholeAmount(slotUpgradeCost)} gold</p>
            <button
              disabled={progression.gold.lt(slotUpgradeCost)}
              onClick={onPurchaseInventorySlots}
              type="button"
            >
              Buy +2 slots
            </button>
          </article>

          <article className="quest-card storage-upgrade-card">
            <h3><ShopItemLabel sprite="stackSizeUpgrade">Stack capacity</ShopItemLabel></h3>
            <p>
              {inventoryStackCapacity(progression)} items per stack now · +100 to every item stack per purchase
            </p>
            <p>Price: {formatWholeAmount(stackUpgradeCost)} gold</p>
            <button
              disabled={progression.gold.lt(stackUpgradeCost)}
              onClick={onPurchaseStackSize}
              type="button"
            >
              Buy +100 to all stacks
            </button>
          </article>
        </section>
      )}

      {mode === "sell" && (
        <section>
          <h2>Sell inventory</h2>
          {!hasSellableInventory ? <p>You have nothing sellable.</p> : (
            <table className="inventory-table">
              <thead><tr><th>Item</th><th>Owned</th><th>Sell price</th><th>Action</th></tr></thead>
              <tbody>
                {ownedMaterials.map((id) => (
                  <tr key={id}>
                    <th scope="row">{MATERIAL_META[id].name}</th>
                    <td>{progression.materials[id]}</td>
                    <td>{MATERIAL_META[id].sellPrice} gold</td>
                    <td>
                      <BulkSellActions
                        onSell={(amount) => onSellMaterial(id, amount)}
                        quantity={progression.materials[id]}
                      />
                    </td>
                  </tr>
                ))}
                {ownedFish.map((stat) => (
                  <tr key={stat}>
                    <th scope="row">{FISH_META[stat].name} (+3 {STAT_META[stat].label})</th>
                    <td>{progression.fish[stat]}</td>
                    <td>{FISH_META[stat].sellPrice} gold</td>
                    <td>
                      <BulkSellActions
                        onSell={(amount) => onSellFish(stat, amount)}
                        quantity={progression.fish[stat]}
                      />
                    </td>
                  </tr>
                ))}
                {sellableGear.map((item) => (
                  <tr key={item.id}>
                    <th scope="row">{item.name}</th>
                    <td>1</td>
                    <td>{gearSellPrice(item)} gold</td>
                    <td><button onClick={() => onSellGear(item.id)} type="button">Sell</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}
    </main>
  );
}

function ShopItemLabel({
  sprite,
  children,
}: {
  sprite: SpriteName;
  children: ReactNode;
}) {
  return (
    <span className="shop-item-label">
      <Sprite name={sprite} />
      <span>{children}</span>
    </span>
  );
}

function BulkSellActions({
  onSell,
  quantity,
}: {
  onSell: (amount: number) => void;
  quantity: number;
}) {
  const amounts = bulkSellAmounts(quantity);
  const [selectedAmount, setSelectedAmount] = useState(1);
  const effectiveAmount = amounts.includes(selectedAmount)
    ? selectedAmount
    : amounts[amounts.length - 1] ?? 1;
  return (
    <div className="bulk-sell-actions">
      <button onClick={() => onSell(effectiveAmount)} type="button">Sell</button>
      <select
        aria-label="Bulk sell quantity"
        onChange={(event) => setSelectedAmount(Number(event.target.value))}
        value={effectiveAmount}
      >
        {amounts.map((amount) => <option key={amount} value={amount}>{amount}</option>)}
      </select>
      <button onClick={() => onSell(quantity)} type="button">Sell all</button>
    </div>
  );
}
