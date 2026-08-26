import { getPlayer } from "@/content/players";
import { gearSprite } from "@/content/inventory-sprites";
import { Sprite } from "@/features/shared/Sprite";
import { GEAR_SLOTS, gearSlotLabel, type GearItem, type GearSlot } from "@/game/gear";
import { formatWholeAmount } from "@/game/numbers";
import {
  getPartyMember,
  memberEquipment,
  memberMaxHp,
  memberMaxStamina,
  memberStats,
  partyMemberIds,
  type ProgressionState,
} from "@/game/progression";
import { STAT_META, type PlayerId, type StatKey } from "@/game/types";
import type { PotionId } from "@/game/potions";
import { InventoryGrid } from "./InventoryGrid";

interface PartyViewProps {
  progression: ProgressionState;
  onEquip: (memberId: PlayerId, itemId: string) => void;
  onFeedFish: (memberId: PlayerId, stat: StatKey) => void;
  onConsumePotion: (potionId: PotionId) => void;
  onUseBlacksmithPotion: (memberId: PlayerId) => void;
  onUseMapmakerChalk: (memberId: PlayerId) => void;
  onUnequip: (memberId: PlayerId, slot: GearSlot) => void;
}

export function PartyView({ progression, onConsumePotion, onEquip, onFeedFish, onUnequip, onUseBlacksmithPotion, onUseMapmakerChalk }: PartyViewProps) {
  return (
    <main className="party-view">
      <header className="page-heading">
        <h1>Party</h1>
      </header>

      <section className="party-member-list">
        {partyMemberIds(progression).map((id) => {
          const definition = getPlayer(id);
          const member = getPartyMember(progression, id);
          const stats = memberStats(progression, id);
          return (
            <article className="party-member" key={id}>
              <div className="member-heading">
                <Sprite name={id} />
                <h2>{definition.name}</h2>
              </div>
              <p>
                HP: {formatWholeAmount(member.hp)} / {formatWholeAmount(memberMaxHp(progression, id))} · {" "}
                Stamina: {formatWholeAmount(member.stamina)} / {formatWholeAmount(memberMaxStamina(progression, id))}
              </p>
              <p>
                ATK {formatWholeAmount(stats.attack)} · DEF {formatWholeAmount(stats.defense)} · {" "}
                SPA {formatWholeAmount(stats.spAttack)} · SPD {formatWholeAmount(stats.spDefense)} · {" "}
                SPE {formatWholeAmount(stats.speed)} · LCK {formatWholeAmount(stats.luck)}
              </p>
              <details className="member-equipment">
                <summary>Equipment</summary>
                <table className="equipment-table">
                  <thead><tr><th>Slot</th><th>Equipped item</th><th>Bonuses</th><th>Action</th></tr></thead>
                  <tbody>
                    {GEAR_SLOTS.map((slot) => {
                      const item = equippedItem(progression, id, slot);
                      return (
                        <tr key={slot}>
                          <th scope="row">{gearSlotLabel(slot)}</th>
                          <td>
                            <span className="equipped-item-label">
                              {item && <Sprite name={gearSprite(item)} />}
                              <span>{item?.name ?? "Empty"}</span>
                            </span>
                          </td>
                          <td>{item ? formatBonuses(item) : "—"}</td>
                          <td>
                            {item && (
                              <button onClick={() => onUnequip(id, slot)} type="button">Unequip</button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </details>
            </article>
          );
        })}
      </section>
      <InventoryGrid
        progression={progression}
        onConsumePotion={onConsumePotion}
        onEquip={onEquip}
        onFeedFish={onFeedFish}
        onUseBlacksmithPotion={onUseBlacksmithPotion}
        onUseMapmakerChalk={onUseMapmakerChalk}
      />
    </main>
  );
}

function equippedItem(
  progression: ProgressionState,
  memberId: PlayerId,
  slot: GearSlot,
): GearItem | undefined {
  return progression.inventory.find((item) => item.id === memberEquipment(progression, memberId)[slot]);
}

function formatBonuses(item: GearItem): string {
  return Object.entries(item.bonuses)
    .map(([stat, value]) => `+${value} ${STAT_META[stat as StatKey].shortLabel}`)
    .join(", ");
}
