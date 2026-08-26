import type { CSSProperties } from "react";
import {
  adventureEnemyName,
  adventureEnemyStats,
  directionLabel,
  enemyKindForRing,
  type AdventureState,
  type AdventureTile,
  type AdventureTileKind,
  type DungeonRoom,
  type DungeonTheme,
} from "@/game/adventure";
import { FISH_SPRITES } from "@/content/inventory-sprites";
import { sprites, type SpriteName } from "@/content/sprites";
import { enemySprite } from "@/content/enemy-sprites";
import { getPlayer } from "@/content/players";
import { formatWholeAmount } from "@/game/numbers";
import type { PlayerId, Position, StatKey } from "@/game/types";
import type { ForgeRecipeSymbol } from "@/content/forge-recipes";
import { Sprite } from "@/features/shared/Sprite";
import { DiePips } from "@/features/shared/DiePips";

const tileLabel: Record<AdventureTileKind, string> = {
  floor: ".",
  wall: "#",
  gold: "Gold",
  treasureChest: "Chest",
  lostItemChest: "Rodney",
  rodKeeper: "Rodney",
  tridentChest: "Tidecaller Trident chest",
  openedChest: "Opened chest",
  cage: "Cage holding Worm",
  trap: "Trap",
  regen: "Hot spring",
  portal: "Teleport platform",
  waterPortal: "Water Dungeon portal",
  forgePortal: "Forge portal",
  forgeGate: "Sealed Forge arena gate",
  forgeBlueprintChest: "Blacksmith's Blueprints chest",
  offering: "Colored offering tile",
  woodenDoor: "Wooden door",
  shopkeeperCage: "Caged Shopkeeper",
  shopkeeper: "Shopkeeper",
  blacksmith: "Blacksmith",
  blacksmithForge: "Blacksmith forge",
  blacksmithAnvil: "Anvil",
  blacksmithWorkbench: "Workbench",
  blacksmithToolRack: "Tool rack",
  blacksmithSupplies: "Smithing supplies",
  miner: "Miner",
  caveRock: "Cave boulder",
  caveGem: "Gem outcrop",
  hammerChest: "Blacksmith's Hammer chest",
  clayGate: "Sealed clay gate",
  clayBoulder: "Fallen clay boulder",
  lotteryWheel: "Lottery wheel",
  lotteryGate: "Sealed lottery gate",
  dicePedestal: "Cursed dice pedestal",
  diceDisplay: "Enormous cursed die",
  diceGate: "Sealed dice-room gate",
  potionmaster: "Lost Potionmaster",
  oddityBrewer: "Charles",
  potionCauldron: "Bubbling cauldron",
  potionShelf: "Potion shelf",
  potionTable: "Potion worktable",
  cartographer: "Cartographer",
  mapTable: "Map table",
  angler: "Angler",
  anglerNet: "Fishing net",
  gardenTree: "Garden tree",
  gardenFountain: "Garden fountain",
  gardenStatue: "Garden statue",
  gardenWater: "Reflecting pool",
  gardenFlowers: "Flower bed",
  gardenBench: "Garden bench",
  towerWall: "Tower wall",
  towerDoor: "Sealed tower door",
  enemy: "Enemy",
  exit: "Exit",
};

export function describeTile(tile: AdventureTile, ring = 0): string {
  if (tile.kind === "trap" && !tile.revealed) return ".";
  if (tile.kind === "woodenDoor" && tile.bossBarrier) return "Water barrier sealing the opened wooden door";
  if (tile.kind === "exit" && tile.exitDirection) {
    return `${tileLabel.exit} ${directionLabel(tile.exitDirection)}`;
  }
  if (tile.kind === "enemy" && tile.enemyHp) {
    const enemyName = adventureEnemyName(tile.enemyKind ?? enemyKindForRing(ring));
    const terrainNote = tile.underlyingKind === "trap"
      ? " on spikes"
      : tile.underlyingKind === "regen"
        ? " in the hot spring"
        : "";
    return `${enemyName} ${formatWholeAmount(tile.enemyHp)} HP${terrainNote}`;
  }
  return tileLabel[tile.kind];
}

export function tileContents(
  tile: AdventureTile,
  ring: number,
  occupantId: PlayerId | null,
  occupantName: string,
  occupantHpPercent: number | null,
  theme: DungeonTheme,
  offeredFish?: StatKey,
  diceRolling = false,
  diceValue?: number,
  diceValues?: [number, number],
  diceAnimationTick = 0,
) {
  if (tile.kind === "towerDoor" && tile.towerPartX !== undefined && tile.towerPartY !== undefined) {
    return (
      <span
        aria-hidden="true"
        className="tower-door-part"
        style={{
          "--tower-part-x": tile.towerPartX,
          "--tower-part-y": tile.towerPartY,
        } as CSSProperties}
      >
        <Sprite name="towerDoor" />
      </span>
    );
  }
  if (
    tile.kind === "enemy"
    && (tile.enemyParalyzedTurns ?? 0) > 0
    && (tile.enemyPart === undefined || tile.enemyPart === 0)
  ) {
    return (
      <span className="adventure-paralyzed-enemy">
        {tileContents(
          { ...tile, enemyParalyzedTurns: 0 },
          ring,
          occupantId,
          occupantName,
          occupantHpPercent,
          theme,
          offeredFish,
          diceRolling,
          diceValue,
          diceValues,
          diceAnimationTick,
        )}
        <span aria-label={`${adventureEnemyName(tile.enemyKind ?? enemyKindForRing(ring))} is paralyzed`} className="paralysis-status">⚡</span>
      </span>
    );
  }
  if (tile.kind === "regen") {
    return (
      <HotSpringTile
        tile={tile}
        occupant={occupantId}
        occupantTone="friendly"
        occupantHpPercent={occupantHpPercent}
        occupantName={occupantName}
      />
    );
  }
  if (tile.kind === "portal") {
    return (
      <PortalTile
        tile={tile}
        occupant={occupantId}
        occupantHpPercent={occupantHpPercent}
        occupantName={occupantName}
      />
    );
  }
  if (tile.kind === "waterPortal") {
    return tile.portalPartX === undefined || tile.portalPartY === undefined
      ? occupantId
        ? <CombinedTileVisual
            first="teleport"
            firstTone="resource"
            second={occupantId}
            secondTone="friendly"
            secondHpPercent={occupantHpPercent}
            secondHealthLabel={`${occupantName} health`}
          />
        : <TileVisual sprite="teleport" tone="resource" />
      : <PortalTile
          tile={tile}
          occupant={occupantId}
          occupantHpPercent={occupantHpPercent}
          occupantName={occupantName}
      />;
  }
  if (tile.kind === "forgePortal") {
    return tile.portalPartX === undefined || tile.portalPartY === undefined
      ? occupantId
        ? <CombinedTileVisual
            first="teleport"
            firstTone="resource"
            second={occupantId}
            secondTone="friendly"
            secondHpPercent={occupantHpPercent}
            secondHealthLabel={`${occupantName} health`}
          />
        : <TileVisual sprite="teleport" tone="resource" />
      : <PortalTile
          tile={tile}
          occupant={occupantId}
          occupantHpPercent={occupantHpPercent}
          occupantName={occupantName}
        />;
  }
  if (tile.kind === "lotteryWheel") {
    return (
      <LotteryWheelTile
        occupant={occupantId}
        occupantHpPercent={occupantHpPercent}
        occupantName={occupantName}
      />
    );
  }
  if (tile.kind === "lotteryGate") {
    return (
      <span className="lottery-gate-art">
        <Sprite name="lotteryGate" />
      </span>
    );
  }
  if (tile.kind === "diceGate") {
    return (
      <span className="lottery-gate-art">
        <Sprite name="lotteryGate" />
      </span>
    );
  }
  if (tile.kind === "forgeGate") {
    return (
      <span className="lottery-gate-art forge-gate-art">
        <Sprite name="forgeGate" />
      </span>
    );
  }
  if (tile.kind === "dicePedestal") {
    return occupantId ? (
      <TileVisual
        sprite={occupantId}
        tone="friendly"
        hpPercent={occupantHpPercent}
        healthLabel={`${occupantName} health`}
      />
    ) : (
      <span className="dice-trigger-art" data-value={diceValue ?? ""}>
        <Sprite name="diceTrigger" />
      </span>
    );
  }
  if (tile.kind === "diceDisplay") {
    if (tile.dicePartX !== 0 || tile.dicePartY !== 0) return null;
    const index = tile.diceIndex ?? 0;
    const value = diceRolling
      ? 1 + ((diceAnimationTick + index * 3) % 6)
      : diceValues?.[index];
    return (
      <span className={`giant-die ${diceRolling ? "is-rolling" : ""}`} data-value={value ?? "?"}>
        <Sprite name="dice" />
        <DiePips value={value} />
      </span>
    );
  }
  if (tile.kind === "offering" && tile.offeringStat) {
    return (
      <span className={`offering-tile-art offering-${tile.offeringStat}`}>
        {offeredFish && occupantId ? (
          <CombinedTileVisual
            first={FISH_SPRITES[offeredFish]}
            firstTone="resource"
            second={occupantId}
            secondTone="friendly"
            secondHpPercent={occupantHpPercent}
            secondHealthLabel={`${occupantName} health`}
          />
        ) : offeredFish ? (
          <FramedSprite sprite={FISH_SPRITES[offeredFish]} tone="resource" />
        ) : occupantId ? (
          <FramedSprite
            sprite={occupantId}
            tone="friendly"
            hpPercent={occupantHpPercent}
            healthLabel={`${occupantName} health`}
          />
        ) : null}
      </span>
    );
  }
  if (tile.kind === "woodenDoor") {
    return (
      <DoorTile
        tile={tile}
        occupant={occupantId}
        occupantHpPercent={occupantHpPercent}
        occupantName={occupantName}
      />
    );
  }
  if (tile.kind === "wall" && tile.decoration === "waterThrone") {
    return <Sprite name="waterThrone" />;
  }
  if (occupantId) {
    if (tile.kind === "trap" && tile.revealed) {
      return (
        <CombinedTileVisual
          first="trap"
          firstTone="hostile"
          second={occupantId}
          secondTone="friendly"
          secondHpPercent={occupantHpPercent}
          secondHealthLabel={`${occupantName} health`}
        />
      );
    }
    return (
      <TileVisual
        sprite={occupantId}
        tone="friendly"
        hpPercent={occupantHpPercent}
        healthLabel={`${occupantName} health`}
      />
    );
  }
  if (
    tile.kind === "enemy"
    && tile.underlyingKind === "trap"
    && tile.enemyKind !== "fire-alligator"
    && tile.enemyKind !== "alligator"
    && tile.enemyKind !== "mummy"
  ) {
    const kind = tile.enemyKind ?? enemyKindForRing(ring);
    return (
      <CombinedTileVisual
        first="trap"
        firstTone="hostile"
        second={adventureEnemySprite(kind)}
        secondTone="hostile"
        secondHpPercent={enemyHpPercent(tile, ring)}
        secondHealthLabel={`${adventureEnemyName(kind)} health`}
      />
    );
  }
  if (
    tile.kind === "enemy"
    && tile.underlyingKind === "regen"
    && tile.enemyKind !== "fire-alligator"
    && tile.enemyKind !== "alligator"
    && tile.enemyKind !== "mummy"
  ) {
    return (
      <HotSpringTile
        tile={{
          kind: "regen",
          regenPartX: tile.underlyingRegenPartX,
          regenPartY: tile.underlyingRegenPartY,
        }}
        occupant={adventureEnemySprite(tile.enemyKind ?? enemyKindForRing(ring))}
        occupantTone="hostile"
        occupantHpPercent={enemyHpPercent(tile, ring)}
        occupantName={adventureEnemyName(tile.enemyKind ?? enemyKindForRing(ring))}
      />
    );
  }
  if (tile.kind === "enemy" && tile.enemyKind === "mummy") {
    if (tile.enemyPart !== 0) return null;
    return (
      <span className="mummy-entity">
        <FramedSprite
          sprite="mummy"
          tone="hostile"
          hpPercent={enemyHpPercent(tile, ring)}
          healthLabel="Clay Mummy health"
        />
      </span>
    );
  }
  if (
    tile.kind === "enemy"
    && (tile.enemyKind === "fire-alligator" || tile.enemyKind === "alligator")
  ) {
    const isFireAlligator = tile.enemyKind === "fire-alligator";
    const sprite = isFireAlligator ? "fireAlligator" : "alligator";
    const name = isFireAlligator ? "Fire Alligator" : "Alligator";
    if (tile.enemyPart === undefined) {
      return (
        <TileVisual
          sprite={sprite}
          tone="hostile"
          hpPercent={enemyHpPercent(tile, ring)}
          healthLabel={`${name} health`}
        />
      );
    }
    if (tile.enemyPart !== 0) return null;
    return (
      <span className={`two-tile-enemy facing-${tile.enemyFacing ?? "south"}`}>
        <FramedSprite
          sprite={sprite}
          tone="hostile"
          hpPercent={enemyHpPercent(tile, ring)}
          healthLabel={`${name} health`}
        />
      </span>
    );
  }
  const sprite = tileSprite(tile, ring, theme);
  if (!sprite) return null;
  if (tile.kind === "wall") return <Sprite name={sprite} />;
  if (isRoomFixture(tile.kind) || tile.kind === "caveRock" || tile.kind === "caveGem") {
    return <Sprite name={sprite} />;
  }
  if (tile.kind === "miner" || tile.kind === "potionmaster" || tile.kind === "oddityBrewer" || tile.kind === "cartographer" || tile.kind === "angler" || tile.kind === "rodKeeper" || tile.kind === "lostItemChest") return <TileVisual sprite={sprite} tone="friendly" />;
  if (tile.kind === "enemy") {
    const kind = tile.enemyKind ?? enemyKindForRing(ring);
    return (
      <TileVisual
        sprite={sprite}
        tone="hostile"
        hpPercent={enemyHpPercent(tile, ring)}
        healthLabel={`${adventureEnemyName(kind)} health`}
      />
    );
  }
  return <TileVisual sprite={sprite} tone={tile.kind === "trap" ? "hostile" : "resource"} />;
}

function isRoomFixture(kind: AdventureTileKind): boolean {
  return kind === "blacksmithForge"
    || kind === "blacksmithAnvil"
    || kind === "blacksmithWorkbench"
    || kind === "blacksmithToolRack"
    || kind === "blacksmithSupplies"
    || kind === "potionCauldron"
    || kind === "potionShelf"
    || kind === "potionTable"
    || kind === "mapTable"
    || kind === "anglerNet"
    || kind === "gardenTree"
    || kind === "gardenFountain"
    || kind === "gardenStatue"
    || kind === "gardenWater"
    || kind === "gardenFlowers"
    || kind === "gardenBench"
    || kind === "towerWall"
    || kind === "towerDoor";
}

function PortalTile({
  tile,
  occupant,
  occupantHpPercent,
  occupantName,
}: {
  tile: AdventureTile;
  occupant: SpriteName | null;
  occupantHpPercent: number | null;
  occupantName: string;
}) {
  const x = Math.max(0, Math.min(2, tile.portalPartX ?? 0));
  const y = Math.max(0, Math.min(2, tile.portalPartY ?? 0));
  return (
    <span className="hot-spring-part portal-part">
      <svg aria-hidden="true" className="hot-spring-art" preserveAspectRatio="xMidYMid slice" viewBox={`${x * 16} ${y * 16} 16 16`}>
        <image height="48" href={sprites.teleport} width="48" x="0" y="0" />
      </svg>
      {occupant && (
        <FramedSprite
          sprite={occupant}
          tone="friendly"
          hpPercent={occupantHpPercent}
          healthLabel={`${occupantName} health`}
        />
      )}
    </span>
  );
}

function LotteryWheelTile({
  occupant,
  occupantHpPercent,
  occupantName,
}: {
  occupant: SpriteName | null;
  occupantHpPercent: number | null;
  occupantName: string;
}) {
  return (
    <span className="hot-spring-part lottery-wheel-part">
      {occupant && (
        <FramedSprite
          sprite={occupant}
          tone="friendly"
          hpPercent={occupantHpPercent}
          healthLabel={`${occupantName} health`}
        />
      )}
    </span>
  );
}

export function LotteryWheelOverlay({
  animate,
  spun,
  outcome,
  color,
  size,
}: {
  animate: boolean;
  spun: boolean;
  outcome?: "gold" | "enemies";
  color?: DungeonRoom["lotteryColor"];
  size: number;
}) {
  const start = Math.floor(size / 2) - 1;
  return (
    <span
      aria-hidden="true"
      className={`lottery-wheel-overlay ${spun ? "is-spun" : "is-ready"} ${animate ? "is-spinning" : ""} ${outcome ? `outcome-${outcome}` : ""} ${color ? `landed-${color}` : ""}`}
      style={{
        left: `${start / size * 100}%`,
        top: `${start / size * 100}%`,
        width: `${3 / size * 100}%`,
        height: `${3 / size * 100}%`,
      }}
    >
      <img alt="" className="lottery-wheel-disc" src={sprites.lotteryWheelDisc} />
      <img alt="" className="lottery-wheel-frame" src={sprites.lotteryWheelFrame} />
    </span>
  );
}

function DoorTile({
  tile,
  occupant,
  occupantHpPercent,
  occupantName,
}: {
  tile: AdventureTile;
  occupant: PlayerId | null;
  occupantHpPercent: number | null;
  occupantName: string;
}) {
  const part = Math.max(0, Math.min(4, tile.doorPart ?? 0));
  if (tile.bossBarrier) {
    return (
      <span className={`door-part door-${tile.doorDirection ?? "north"} is-water-barrier`}>
        <Sprite name="water" />
      </span>
    );
  }
  const source = tile.doorOpen ? sprites.woodenDoorOpen : sprites.woodenDoor;
  return (
    <span className={`door-part door-${tile.doorDirection ?? "north"} ${tile.doorOpen ? "is-open" : ""}`}>
      <svg aria-hidden="true" className="door-art" preserveAspectRatio="xMidYMid slice" viewBox={`${part * 16} 0 16 16`}>
        <image height="16" href={source} width="80" x="0" y="0" />
      </svg>
      {occupant && (
        <FramedSprite
          sprite={occupant}
          tone="friendly"
          hpPercent={occupantHpPercent}
          healthLabel={`${occupantName} health`}
        />
      )}
    </span>
  );
}

function HotSpringTile({
  tile,
  occupant,
  occupantTone,
  occupantHpPercent,
  occupantName,
}: {
  tile: AdventureTile;
  occupant: SpriteName | null;
  occupantTone: EntityTone;
  occupantHpPercent: number | null;
  occupantName: string;
}) {
  const x = Math.max(0, Math.min(2, tile.regenPartX ?? 0));
  const y = Math.max(0, Math.min(2, tile.regenPartY ?? 0));
  return (
    <span className="hot-spring-part">
      <svg
        aria-hidden="true"
        className="hot-spring-art"
        preserveAspectRatio="xMidYMid slice"
        viewBox={`${x * 16} ${y * 16} 16 16`}
      >
        <image height="48" href={sprites.hotSpring} width="48" x="0" y="0" />
      </svg>
      {occupant && (
        <FramedSprite
          sprite={occupant}
          tone={occupantTone}
          hpPercent={occupantHpPercent}
          healthLabel={`${occupantName} health`}
        />
      )}
    </span>
  );
}

function tileSprite(tile: AdventureTile, ring: number, theme: DungeonTheme): SpriteName | null {
  if (tile.kind === "wall") return tile.wallVariant === "forge"
    ? "forgeWall"
    : tile.wallVariant === "clay-brick"
    ? "clayBrick"
    : theme === "water"
      ? "water"
      : tile.wallVariant === "volcanic" || ring >= 4
        ? "volcanicWall"
        : "wall";
  if (tile.kind === "gold") return "gold";
  if (tile.kind === "treasureChest") return "chest";
  if (tile.kind === "lostItemChest") return "angler";
  if (tile.kind === "rodKeeper") return "angler";
  if (tile.kind === "tridentChest") return "chest";
  if (tile.kind === "forgeBlueprintChest") return "chest";
  if (tile.kind === "openedChest") return "chestOpened";
  if (tile.kind === "cage") return "cage";
  if (tile.kind === "shopkeeperCage") return "shopkeeperCaged";
  if (tile.kind === "shopkeeper") return "shopkeeper";
  if (tile.kind === "blacksmith") return "blacksmith";
  if (tile.kind === "blacksmithForge") return "blacksmithForge";
  if (tile.kind === "blacksmithAnvil") return "blacksmithAnvil";
  if (tile.kind === "blacksmithWorkbench") return "blacksmithWorkbench";
  if (tile.kind === "blacksmithToolRack") return "blacksmithToolRack";
  if (tile.kind === "blacksmithSupplies") return "blacksmithSupplies";
  if (tile.kind === "miner") return "miner";
  if (tile.kind === "potionmaster") return "potionmaster";
  if (tile.kind === "oddityBrewer") return "oddityBrewer";
  if (tile.kind === "potionCauldron") return "potionCauldron";
  if (tile.kind === "potionShelf") return "potionShelf";
  if (tile.kind === "potionTable") return "potionTable";
  if (tile.kind === "cartographer") return "cartographer";
  if (tile.kind === "mapTable") return "mapTable";
  if (tile.kind === "angler") return "angler";
  if (tile.kind === "anglerNet") return "anglerNet";
  if (tile.kind === "gardenTree") return "gardenTree";
  if (tile.kind === "gardenFountain") return "gardenFountain";
  if (tile.kind === "gardenStatue") return "gardenStatue";
  if (tile.kind === "gardenWater") return "gardenWater";
  if (tile.kind === "gardenFlowers") return "gardenFlowers";
  if (tile.kind === "gardenBench") return "gardenBench";
  if (tile.kind === "towerWall") return "towerWall";
  if (tile.kind === "towerDoor") return "towerDoor";
  if (tile.kind === "caveRock") return "caveRock";
  if (tile.kind === "caveGem") return "caveGems";
  if (tile.kind === "hammerChest") return "chest";
  if (tile.kind === "clayGate") return "clayGate";
  if (tile.kind === "forgeGate") return "forgeGate";
  if (tile.kind === "clayBoulder") return "clayBoulder";
  if (tile.kind === "trap") return tile.revealed
    ? tile.trapStyle === "fire-beam"
      ? tile.trapBeamDirection === "cross" ? "fireBeamCross" : "fireBeam"
      : "trap"
    : null;
  if (tile.kind === "enemy") return adventureEnemySprite(tile.enemyKind ?? enemyKindForRing(ring));
  return null;
}

export function roomDecorationSprite(decoration: AdventureTile["decoration"]): SpriteName | null {
  if (decoration === "waterThrone") return null;
  if (decoration === "cobweb") return "cobweb";
  if (decoration === "portalRune") return "portalRune";
  if (decoration === "shopRug") return "shopRug";
  if (decoration === "shopShelf") return "shopShelf";
  if (decoration === "springReeds") return "springReeds";
  if (decoration && decoration in sprites) return decoration as SpriteName;
  return null;
}

export function forgeRecipeMarkerSprite(symbol: ForgeRecipeSymbol): SpriteName {
  const spritesBySymbol: Record<ForgeRecipeSymbol, SpriteName> = {
    X: "forgeRecipeEmpty",
    R: "rustyMetal",
    F: "fireAlligatorHide",
    D: "driftwood",
    G: "rustyGear",
  };
  return spritesBySymbol[symbol];
}

export function isProjectileTile(adventure: AdventureState, position: Position): boolean {
  const projectile = adventure.lastProjectile;
  if (!projectile) return false;
  if (projectile.from.x === projectile.to.x && position.x === projectile.from.x) {
    return position.y >= Math.min(projectile.from.y, projectile.to.y)
      && position.y <= Math.max(projectile.from.y, projectile.to.y);
  }
  if (projectile.from.y === projectile.to.y && position.y === projectile.from.y) {
    return position.x >= Math.min(projectile.from.x, projectile.to.x)
      && position.x <= Math.max(projectile.from.x, projectile.to.x);
  }
  const differenceX = projectile.to.x - projectile.from.x;
  const differenceY = projectile.to.y - projectile.from.y;
  if (Math.abs(differenceX) === Math.abs(differenceY)) {
    const offsetX = position.x - projectile.from.x;
    const offsetY = position.y - projectile.from.y;
    return Math.abs(offsetX) === Math.abs(offsetY)
      && Math.sign(offsetX) === Math.sign(differenceX)
      && Math.sign(offsetY) === Math.sign(differenceY)
      && Math.abs(offsetX) <= Math.abs(differenceX);
  }
  return false;
}

function adventureEnemySprite(kind: ReturnType<typeof enemyKindForRing>): SpriteName {
  return enemySprite(kind);
}

function CombinedTileVisual({
  second,
  secondTone,
  secondHpPercent,
  secondHealthLabel,
}: {
  first: SpriteName;
  second: SpriteName;
  firstTone: EntityTone;
  secondTone: EntityTone;
  secondHpPercent: number | null;
  secondHealthLabel: string;
}) {
  return (
    <TileVisual
      sprite={second}
      tone={secondTone}
      hpPercent={secondHpPercent}
      healthLabel={secondHealthLabel}
    />
  );
}

type EntityTone = "friendly" | "hostile" | "resource";

function TileVisual({
  sprite,
  tone,
  hpPercent,
  healthLabel,
}: {
  sprite: SpriteName;
  tone: EntityTone;
  hpPercent?: number | null;
  healthLabel?: string;
}) {
  return (
    <span className="tile-visual">
      <FramedSprite
        sprite={sprite}
        tone={tone}
        hpPercent={hpPercent}
        healthLabel={healthLabel}
      />
    </span>
  );
}

function FramedSprite({
  sprite,
  tone,
  hpPercent,
  healthLabel,
}: {
  sprite: SpriteName;
  tone: EntityTone;
  hpPercent?: number | null;
  healthLabel?: string;
}) {
  return (
    <span className={`framed-sprite framed-sprite-${tone}`}>
      {hpPercent !== undefined && hpPercent !== null && (
        <span
          aria-label={healthLabel}
          aria-valuemax={100}
          aria-valuemin={0}
          aria-valuenow={Math.round(hpPercent)}
          className="tile-health-bar"
          role="progressbar"
        >
          <span className="tile-health-fill" style={{ width: `${hpPercent}%` }} />
        </span>
      )}
      <span className={`entity-frame entity-${tone}`}>
        <Sprite name={sprite} />
      </span>
    </span>
  );
}

function enemyHpPercent(tile: AdventureTile, ring: number): number {
  if (!tile.enemyHp) return 100;
  const kind = tile.enemyKind ?? enemyKindForRing(ring);
  return Math.max(0, Math.min(100, tile.enemyHp.div(adventureEnemyStats(ring, kind).hp).mul(100).toNumber()));
}

export function positionsEqual(a: Position, b: Position): boolean {
  return a.x === b.x && a.y === b.y;
}

export function canPlayerAttackTile(
  adventure: AdventureState,
  room: DungeonRoom,
  target: Position,
  weaponThrowUnlocked: boolean,
  hasTrident: boolean,
): boolean {
  const range = Math.max(1, getPlayer(adventure.playerId).attackRange ?? 1);
  const player = getPlayer(adventure.playerId);
  const deltaX = Math.abs(adventure.playerPosition.x - target.x);
  const deltaY = Math.abs(adventure.playerPosition.y - target.y);
  const sameAxis = adventure.playerPosition.x === target.x || adventure.playerPosition.y === target.y;
  const diagonal = deltaX === deltaY;
  const eightWay = player.attackPattern === "eight-way";
  const directAttack = (sameAxis || (eightWay && diagonal))
    && Math.max(deltaX, deltaY) >= 1
    && Math.max(deltaX, deltaY) <= range;
  const weaponThrow = weaponThrowUnlocked
    && hasTrident
    && sameAxis
    && deltaX + deltaY >= 1
    && deltaX + deltaY <= 3;
  if (!directAttack && !weaponThrow) return false;
  const distance = sameAxis ? deltaX + deltaY : Math.max(deltaX, deltaY);
  const stepX = Math.sign(target.x - adventure.playerPosition.x);
  const stepY = Math.sign(target.y - adventure.playerPosition.y);
  for (let step = 1; step < distance; step += 1) {
    const tile = room.tiles[
      adventure.playerPosition.y + stepY * step
    ][adventure.playerPosition.x + stepX * step];
    if (
      tile.kind === "wall"
      || tile.kind === "cage"
      || tile.kind === "shopkeeperCage"
      || tile.kind === "lotteryGate"
      || tile.kind === "clayGate"
      || tile.kind === "clayBoulder"
      || tile.kind === "caveRock"
      || tile.kind === "caveGem"
      || tile.kind === "enemy"
      || (tile.kind === "woodenDoor" && (!tile.doorOpen || tile.bossBarrier))
    ) return false;
  }
  return true;
}

export function isAdjacent(a: Position, b: Position): boolean {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y) === 1;
}
