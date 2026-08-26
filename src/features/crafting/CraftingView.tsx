import { useMemo, useState, type DragEvent } from "react";
import { MATERIAL_IDS, MATERIAL_META, type MaterialId } from "@/game/items";
import type { ProgressionState } from "@/game/progression";
import { inventoryStackCapacity } from "@/game/progression";
import { MATERIAL_SPRITES } from "@/content/inventory-sprites";
import { Sprite } from "@/features/shared/Sprite";
import { InventoryCard } from "@/features/inventory/InventoryCard";
import {
  CRAFTING_GRID_CELLS,
  matchCraftingRecipe,
  type CraftingGrid,
  type CraftingResult,
} from "@/game/crafting";
import { gearSprite } from "@/content/inventory-sprites";

export function CraftingView({
  progression,
  onCraft,
}: {
  progression: ProgressionState;
  onCraft: (grid: CraftingGrid) => CraftingResult;
}) {
  const [grid, setGrid] = useState<CraftingGrid>(() => Array(CRAFTING_GRID_CELLS).fill(null));
  const [message, setMessage] = useState("");
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialId | null>(null);
  const inventoryMaterials = MATERIAL_IDS.filter((id) => progression.materials[id] > 0);
  const placedCounts = useMemo(() => grid.reduce<Partial<Record<MaterialId, number>>>((counts, id) => {
    if (id) counts[id] = (counts[id] ?? 0) + 1;
    return counts;
  }, {}), [grid]);
  const match = matchCraftingRecipe(grid);
  const placedTotal = grid.filter(Boolean).length;
  const remaining = (id: MaterialId) => progression.materials[id] - (placedCounts[id] ?? 0);
  const placeMaterial = (index: number, id: MaterialId) => {
    setGrid((current) => {
      const currentlyInSlot = current[index];
      const alreadyPlaced = current.reduce((total, item) => total + (item === id ? 1 : 0), 0);
      if (currentlyInSlot !== id && alreadyPlaced >= progression.materials[id]) return current;
      return current.map((item, itemIndex) => itemIndex === index ? id : item);
    });
    setMessage("");
  };
  const handleDrop = (event: DragEvent<HTMLButtonElement>, index: number) => {
    event.preventDefault();
    const id = event.dataTransfer.getData("application/x-idle-material") as MaterialId;
    if (MATERIAL_IDS.includes(id) && progression.materials[id] > 0) placeMaterial(index, id);
  };
  const handleSlotClick = (index: number) => {
    if (grid[index]) {
      setGrid((current) => current.map((item, itemIndex) => itemIndex === index ? null : item));
      return;
    }
    if (selectedMaterial) placeMaterial(index, selectedMaterial);
  };
  const craft = () => {
    const result = onCraft(grid);
    if (result.error) {
      setMessage(result.error);
      return;
    }
    setMessage(`${result.item?.name ?? (result.keyItem === "tower-key" ? "Tower Key" : "Item")} crafted.`);
    setGrid(Array(CRAFTING_GRID_CELLS).fill(null));
  };
  return (
    <main className="simple-page crafting-view">
      <header className="page-heading crafting-heading">
        <h1>Crafting</h1>
      </header>
      <div className="crafting-layout">
        <section className="crafting-bench" aria-label="Crafting table">
          <header className="crafting-bench-heading">
            <div>
              <h2>Pattern Bench</h2>
            </div>
            {placedTotal > 0 && (
              <button
                onClick={() => {
                  setGrid(Array(CRAFTING_GRID_CELLS).fill(null));
                  setMessage("");
                }}
                type="button"
              >
                Clear
              </button>
            )}
          </header>
          <div className="crafting-pattern-column">
            <div className="crafting-grid">
              {grid.map((item, index) => (
                <button
                  aria-label={item ? `${MATERIAL_META[item].name} in crafting slot ${index + 1}; click to remove` : `Empty crafting slot ${index + 1}`}
                  className={`crafting-slot${item ? " is-filled" : ""}`}
                  key={index}
                  onClick={() => handleSlotClick(index)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => handleDrop(event, index)}
                  type="button"
                >
                  {item && <Sprite name={MATERIAL_SPRITES[item]} />}
                </button>
              ))}
            </div>
          </div>
          <span className="crafting-arrow" aria-hidden="true">→</span>
          <div className="crafting-result-column">
            <div
              aria-label={match ? `Crafting result: ${match.name}` : "No known pattern"}
              className={`crafting-output${match ? "" : " is-empty"}`}
            >
              {match ? (
                <>
                  <Sprite name={match.recipeId === "tower-key"
                    ? "towerKey"
                    : gearSprite({
                        id: "crafting-preview",
                        name: match.name,
                        slot: match.slot!,
                        ring: match.level,
                        power: match.level + 1,
                        bonuses: {},
                        weaponAbilityId: match.recipeId === "heavy-sword" ? "heavy-slam" : match.recipeId === "sword" ? "sweep" : undefined,
                      })} />
                  <strong>{match.name}</strong>
                  <button onClick={craft} type="button">Craft</button>
                </>
              ) : null}
            </div>
          </div>
        </section>
      </div>
      <section className="crafting-inventory" aria-label="Crafting inventory">
        <header className="crafting-inventory-heading">
          <div>
            <h2>Materials</h2>
          </div>
        </header>
        <div className="inventory-grid crafting-inventory-grid">
          {inventoryMaterials.map((id) => {
            const quantity = remaining(id);
            return (
              <InventoryCard
                capacity={inventoryStackCapacity(progression)}
                className="crafting-inventory-item"
                description=""
                disabled={quantity <= 0}
                draggable={quantity > 0}
                key={id}
                name={MATERIAL_META[id].name}
                onClick={() => setSelectedMaterial((current) => current === id ? null : id)}
                onDragStart={(event) => {
                  event.dataTransfer.setData("application/x-idle-material", id);
                  event.dataTransfer.effectAllowed = "copy";
                  setSelectedMaterial(id);
                }}
                quantity={quantity}
                selected={selectedMaterial === id}
                sprite={MATERIAL_SPRITES[id]}
                type="material"
              />
            );
          })}
        </div>
        {inventoryMaterials.length === 0 && (
          <div className="crafting-inventory-empty">
            <Sprite name="blacksmithSupplies" />
            <strong>No materials</strong>
          </div>
        )}
      </section>
      {message && <p className="crafting-message" role="status">{message}</p>}
    </main>
  );
}
