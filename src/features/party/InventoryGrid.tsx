import { getPlayer } from "@/content/players";
import {
  FISH_SPRITES,
  ESCAPE_ROPE_SPRITES,
  gearSprite,
  KEY_ITEM_SPRITES,
  MATERIAL_SPRITES,
  POTION_SPRITES,
} from "@/content/inventory-sprites";
import { ESCAPE_ROPE_LEVELS } from "@/game/escape-ropes";
import { FISH_META, FISH_STATS, MATERIAL_IDS, MATERIAL_META, type MaterialId } from "@/game/items";
import { gearSlotLabel, type GearItem } from "@/game/gear";
import {
  activePotionRemainingMs,
  fishBonusCap,
  getPartyMember,
  inventorySlotCapacity,
  inventoryStackCapacity,
  inventoryUsedSlots,
  memberEquipment,
  partyMemberIds,
  type ProgressionState,
} from "@/game/progression";
import { POTION_IDS, POTION_META, mysteryPotionEffectDescription, type PotionId } from "@/game/potions";
import { STAT_META, type PlayerId, type StatKey } from "@/game/types";
import { weaponSkill } from "@/game/weapon-skills";
import { InventoryCard } from "@/features/inventory/InventoryCard";

interface InventoryGridProps {
  progression: ProgressionState;
  onEquip: (memberId: PlayerId, itemId: string) => void;
  onFeedFish: (memberId: PlayerId, stat: StatKey) => void;
  onConsumePotion: (potionId: PotionId) => void;
  onUseBlacksmithPotion: (memberId: PlayerId) => void;
  onUseMapmakerChalk: (memberId: PlayerId) => void;
}

export function InventoryGrid({ progression, onConsumePotion, onEquip, onFeedFish, onUseBlacksmithPotion, onUseMapmakerChalk }: InventoryGridProps) {
  const ownedMaterials = MATERIAL_IDS.filter((id) => progression.materials[id] > 0);
  const ownedPotions = POTION_IDS.filter((id) => (progression.potions?.[id] ?? 0) > 0);
  const ownedEscapeRopes = ESCAPE_ROPE_LEVELS.filter((level) => (progression.escapeRopes?.[level] ?? 0) > 0);
  const activePotions = POTION_IDS.filter((id) => activePotionRemainingMs(progression, id) > 0);
  const activeMysteryPotions = (progression.activeMysteryPotions ?? [])
    .filter((effect) => effect.expiresAt > Date.now());
  const ownedFish = progression.fishingRod
    ? FISH_STATS.filter((stat) => progression.fish[stat] > 0)
    : [];
  const equippedItemIds = new Set(
    partyMemberIds(progression).flatMap((id) =>
      Object.values(memberEquipment(progression, id)).filter((itemId): itemId is string => Boolean(itemId))
    ),
  );
  const unequippedGear = progression.inventory.filter((item) => !equippedItemIds.has(item.id));
  const usedSlots = inventoryUsedSlots(progression);
  const slotCapacity = inventorySlotCapacity(progression);
  const emptySlots = Math.max(0, slotCapacity - usedSlots);
  const hasKeyItems = progression.adventureUnlocked
    || progression.fishingRod
    || progression.hammerRecovered
    || progression.pickaxeOwned
    || progression.forgeBlueprintsRecovered
    || progression.towerKeyOwned
    || progression.tackleBoxOwned
    || progression.craftingUnlocked
    || progression.completedRaids.includes(7);

  return (
    <section className="party-inventory" aria-label="Inventory">
      <h2>Inventory</h2>
      {(activePotions.length > 0 || activeMysteryPotions.length > 0) && (
        <div className="active-potion-list">
          <h3>Active potion effects</h3>
          <ul>
            {activePotions.map((id) => (
              <li key={id}>
                {POTION_META[id].name}: {formatRemainingTime(activePotionRemainingMs(progression, id))} remaining
              </li>
            ))}
            {activeMysteryPotions.map((effect, index) => (
              <li key={`${effect.expiresAt}-${index}`}>
                Mystery Potion: {mysteryPotionEffectDescription(effect)} · 5% dodge · {formatRemainingTime(effect.expiresAt - Date.now())} remaining
              </li>
            ))}
          </ul>
        </div>
      )}
      {hasKeyItems && (
        <section className="inventory-key-items" aria-label="Key items">
          <h3>Key items</h3>
          <div className="inventory-grid key-item-grid">
          {progression.adventureUnlocked && (
            <InventoryCard
              description="Stolen Undertaker rope. Unlocks Adventure! The top end is tied to SOMETHING. It squeaks whenever you look down."
              name="Lowering Rope"
              sprite={KEY_ITEM_SPRITES.loweringRope}
              type="key"
            />
          )}
          {progression.fishingRod && (
            <InventoryCard
              description="Unlocks Fishing! Put dead monster on the hook, throw it in dungeon water, and eat whatever makes the worst decision."
              name="Fishing Rod"
              sprite={KEY_ITEM_SPRITES.fishingRod}
              type="key"
            />
          )}
          {progression.completedRaids.includes(7) && (
            <InventoryCard
              description="A scrapbook of your victims. Hover over a portrait for stats and several facts the creature wishes you did not know."
              name="Bestiary"
              sprite={KEY_ITEM_SPRITES.bestiary}
              type="key"
            />
          )}
          {progression.hammerRecovered && (
            <InventoryCard
              description="The Blacksmith's stolen Hammer. Return it THIS expedition or the dungeon swallows it again. Continuity is hungry."
              name="Blacksmith's Hammer"
              sprite={KEY_ITEM_SPRITES.blacksmithHammer}
              type="key"
            />
          )}
          {progression.pickaxeOwned && (
            <InventoryCard
              description={progression.completedQuestIds.includes("find-miner")
                ? "The Miner's Pickaxe. Turns rocks into gold, keys, smaller rocks, and Bats that were somehow airtight until now."
                : "A Pickaxe for the Miner in the Clay Catacombs. Give it to him before his forehead develops a second forehead."}
              name="Pickaxe"
              sprite={KEY_ITEM_SPRITES.pickaxe}
              type="key"
            />
          )}
          {progression.forgeBlueprintsRecovered && (
            <InventoryCard
              description="The Blacksmith's Blueprints. Burnt edges, wet center, huge butt on page four. The butt is NOT load-bearing."
              name="Blacksmith's Blueprints"
              sprite={KEY_ITEM_SPRITES.blacksmithBlueprints}
              type="key"
            />
          )}
          {progression.craftingUnlocked && (
            <InventoryCard
              description="Arrange monster organs in the 4×4 grid. If they form the sacred Helmet Shape, a completely dry Helmet comes out."
              name="Crafting Table"
              sprite={KEY_ITEM_SPRITES.craftingTable}
              type="key"
            />
          )}
          {progression.towerKeyOwned && (
            <InventoryCard
              description="A stupidly huge Key for the stupidly huge Tower. Insert Key, turn Key, release whatever management was hiding."
              name="Tower Key"
              sprite={KEY_ITEM_SPRITES.towerKey}
              type="key"
            />
          )}
          {progression.tackleBoxOwned && (
            <InventoryCard
              description="A box of hooks, wet string, and one moving compartment. Favors one fish family without changing total catch chance."
              name="Tackle Box"
              sprite={KEY_ITEM_SPRITES.tackleBox}
              type="key"
            />
          )}
          </div>
        </section>
      )}

      <div className="inventory-capacity-line">
        <h3>Backpack</h3>
        <strong>{usedSlots} / {slotCapacity} slots</strong>
      </div>
      <div className="inventory-grid">
          {progression.healingPotions > 0 && (
            <InventoryCard
              capacity={inventoryStackCapacity(progression)}
              description="Restores 200 HP during Adventure. Tastes like hot cherries, cold iron, and one tiny floating beard hair."
              name="Blacksmith Healing Potion"
              quantity={progression.healingPotions}
              sprite="blacksmithHealingPotion"
              type="potion"
            >
              <div className="inventory-tooltip-actions">
                {partyMemberIds(progression).map((id) => (
                  <button key={id} onClick={() => onUseBlacksmithPotion(id)} type="button">
                    Heal {getPlayer(id).name}
                  </button>
                ))}
              </div>
            </InventoryCard>
          )}

          {ownedEscapeRopes.map((level) => (
            <InventoryCard
              capacity={inventoryStackCapacity(progression)}
              description={`A Level ${level} rope that escapes from ${level} room${level === 1 ? "" : "s"} away from the entrance${level === 1 ? " or the starting room" : ""} and banks carried Gold. A smaller rope would snap there because rope understands math.`}
              key={`escape-rope-${level}`}
              name={`Level ${level} Escape Rope`}
              quantity={progression.escapeRopes[level]}
              sprite={ESCAPE_ROPE_SPRITES[level]}
              type="supply"
            />
          ))}

          {ownedMaterials.map((id) => {
            const material = MATERIAL_META[id];
            return (
              <InventoryCard
                capacity={inventoryStackCapacity(progression)}
                description={progression.fishingRod ? material.description : materialFlavorDescription(id)}
                key={id}
                name={material.name}
                quantity={progression.materials[id]}
                sprite={MATERIAL_SPRITES[id]}
                type="material"
              >
                {id === "mapmaker-chalk" && (
                  <div className="inventory-tooltip-actions">
                    {partyMemberIds(progression).map((memberId) => (
                      <button key={memberId} onClick={() => onUseMapmakerChalk(memberId)} type="button">
                        Use on {getPlayer(memberId).name}
                      </button>
                    ))}
                  </div>
                )}
                {progression.fishingRod && (
                  <p>{material.reusableBait
                    ? "Reusable fishing bait; catches Driftwood (2%) or Seaweed (1%)."
                    : material.catchChance > 0
                      ? `1 fishing cast · ${Math.round(material.catchChance * 100)}% catch chance.`
                      : "Not usable as fishing bait."}</p>
                )}
                {progression.shopUnlocked && (
                  <p>{material.sellPrice > 0 ? `Sells for ${material.sellPrice} gold each.` : "Cannot be sold."}</p>
                )}
              </InventoryCard>
            );
          })}

          {ownedPotions.map((id) => {
            const potion = POTION_META[id];
            const remaining = activePotionRemainingMs(progression, id);
            return (
              <InventoryCard
                capacity={inventoryStackCapacity(progression)}
                description={id === "mystery-1"
                  ? potion.description
                  : `${potion.description} Additional uses extend this level's duration. If both levels are active, only the stronger effect applies.`}
                key={id}
                name={potion.name}
                quantity={progression.potions?.[id] ?? 0}
                sprite={POTION_SPRITES[id]}
                type="potion"
              >
                {remaining > 0 && <p>Active: {formatRemainingTime(remaining)} remaining.</p>}
                <div className="inventory-tooltip-actions">
                  <button onClick={() => onConsumePotion(id)} type="button">
                    Consume
                  </button>
                </div>
              </InventoryCard>
            );
          })}

          {ownedFish.map((stat) => {
            const fish = FISH_META[stat];
            return (
              <InventoryCard
                capacity={inventoryStackCapacity(progression)}
                description={`${fish.description} Gold training multiplies this base increase.`}
                key={stat}
                name={fish.name}
                quantity={progression.fish[stat]}
                sprite={FISH_SPRITES[stat]}
                type="fish"
              >
                <p>Sells for {fish.sellPrice} gold.</p>
                <div className="inventory-tooltip-actions">
                  {partyMemberIds(progression).map((id) => (
                    <button
                      disabled={
                        progression.fish[stat] <= 0
                        || getPartyMember(progression, id).fishBonuses[stat] >= fishBonusCap(progression)
                      }
                      key={id}
                      onClick={() => onFeedFish(id, stat)}
                      type="button"
                    >
                      Feed {getPlayer(id).name} ({getPartyMember(progression, id).fishBonuses[stat]}/{fishBonusCap(progression)})
                    </button>
                  ))}
                </div>
              </InventoryCard>
            );
          })}

          {unequippedGear.map((item) => (
            <GearSlot
              item={item}
              key={item.id}
              onEquip={onEquip}
              progression={progression}
            />
          ))}
          {Array.from({ length: emptySlots }, (_, index) => (
            <article
              aria-label="Empty inventory slot"
              className="inventory-slot inventory-slot-empty"
              key={`empty-${index}`}
            >
              <span aria-hidden="true">·</span>
            </article>
          ))}
        </div>
    </section>
  );
}

function GearSlot({
  item,
  progression,
  onEquip,
}: {
  item: GearItem;
  progression: ProgressionState;
  onEquip: InventoryGridProps["onEquip"];
}) {
  const equippedMember = partyMemberIds(progression).find((id) =>
    memberEquipment(progression, id)[item.slot] === item.id
  );
  const skill = weaponSkill(item.weaponAbilityId);
  return (
    <InventoryCard
      description={item.definitionId === "trident"
        ? "A Merman threw this at your head, so legally it is yours. Right-click to throw it! Bonuses join base stats before Gold training."
        : item.definitionId === "undead-gem"
          ? "Turns off the Skele-King's coward bubble. Does nothing to living Kings, medium-dead Kings, or stains. Bonuses join base stats before Gold training."
        : item.definitionId === "shaman-ring"
          ? "20% chance to teleport away from Adventure damage. 80% chance to remain damp Goblin jewelry touching your skin. Bonuses join base stats before Gold training."
        : item.definitionId === "suction-cups"
          ? "15% chance to grab and paralyze a non-boss attacker. WHERE the Cups grab it is between the Cups and several lawyers. Bonuses join base stats before Gold training."
        : `Level ${item.ring} ${gearSlotLabel(item.slot)}. Wear it to convert small numbers into slightly fatter numbers. Truly, the fantasy of power.`}
      name={item.name}
                sprite={gearSprite(item)}
      type="gear"
    >
      <p>Power {item.power} · {formatBonuses(item)}</p>
      {skill && (
        <p>{skill.name}: {skill.attackType === "special" ? "Sp. Attack" : "Attack"}, range {skill.range}, {skill.cooldownTurns}-turn cooldown.</p>
      )}
      <p>{equippedMember ? `Equipped by ${getPlayer(equippedMember).name}.` : "Not equipped."}</p>
      <div className="inventory-tooltip-actions">
        {partyMemberIds(progression).map((id) => (
          <button
            disabled={equippedMember === id}
            key={id}
            onClick={() => onEquip(id, item.id)}
            type="button"
          >
            {equippedMember === id ? `Equipped: ${getPlayer(id).name}` : `Equip ${getPlayer(id).name}`}
          </button>
        ))}
      </div>
    </InventoryCard>
  );
}

function formatRemainingTime(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1_000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function formatBonuses(item: GearItem): string {
  return Object.entries(item.bonuses)
    .map(([stat, value]) => `+${value} ${STAT_META[stat as StatKey].shortLabel}`)
    .join(" · ");
}

function materialFlavorDescription(id: MaterialId): string {
  if (id === "rat-pelt") return "One complete Rat Pelt. The remaining Rat is now smooth, pink, furious, and classified as somebody else's problem.";
  if (id === "ant-chitin") return "Ant shell, peeled in one suspiciously clean piece. Crunchy is a texture, NOT an instruction.";
  if (id === "ink-sac") return "Octopus Ink Sac. Squeeze for ink, regret, and a stain shaped exactly like your most expensive shirt.";
  if (id === "fire-alligator-hide") return "Fire Alligator skin. Still warm. Smells like a boot somebody cooked because the recipe said sole food.";
  if (id === "clay") return "A damp fistful of Clay Golem. You killed pottery and now pottery is in your pocket.";
  if (id === "rotten-tentacle") return "A rotten Squid arm. The tooltip cannot transmit smell yet. This is the strongest argument against future technology.";
  if (id === "driftwood") return "You caught wood while fishing. The wood fought bravely. The wood lost. Eat a fish instead.";
  if (id === "seaweed") return "Wet dungeon grass wearing a thin coat of pond. Almost certainly edible exactly once.";
  return MATERIAL_META[id].description;
}
