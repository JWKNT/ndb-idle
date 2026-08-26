import { useEffect, useRef, useState } from "react";
import {
  adventureEnemyName,
  currentAdventureRoom,
  enemyKindForAdventure,
  fireBeamIsActive,
  isAdventurePlayerTurn,
  isInAdventureWeaponSkillRange,
  type AdventureState,
} from "@/game/adventure";
import { adventureFloorTexture } from "@/content/adventure-floor-textures";
import { forgeRecipeMarkerAt } from "@/content/forge-recipes";
import { formatWholeAmount } from "@/game/numbers";
import {
  availableAdventureTargetRings,
  availableAdventureStrategies,
  effectiveAdventureStrategy,
  getPartyMember,
  memberEquipment,
  memberMaxHp,
  memberMaxStamina,
  type ProgressionState,
} from "@/game/progression";
import type { AdventureAutoPauseRoom, AdventureDungeonId, PortalType, Position } from "@/game/types";
import { Sprite } from "@/features/shared/Sprite";
import { GameDropdown } from "@/features/shared/GameDropdown";
import {
  AttackEffectOverlay,
  attackEffectHasArea,
} from "@/features/shared/AttackEffectOverlay";
import { getPlayer } from "@/content/players";
import { STORY_DIALOGUE } from "@/content/story-dialogue";
import type { AdventureSession } from "@/game/adventure/session";
import type { AdventureStrategy, PlayerId } from "@/game/types";
import { FISH_META, FISH_STATS } from "@/game/items";
import type { StatKey } from "@/game/types";
import { ESCAPE_ROPE_LEVELS, type EscapeRopeLevel } from "@/game/escape-ropes";
import type { QuestId } from "@/content/quests";
import { DungeonMap } from "./DungeonMap";
import { adventureViewport } from "./adventure-viewport";
import {
  AdvancedAdventureOptions,
  AdventureRestartToggle,
  adventureAreaDropdownOptions,
  adventureStrategyDropdownOptions,
  discoveredLandmarkOptions,
} from "./AdventureControls";
import { QuestLog } from "./QuestLog";
import {
  LotteryWheelOverlay,
  canPlayerAttackTile,
  describeTile,
  forgeRecipeMarkerSprite,
  isAdjacent,
  isProjectileTile,
  positionsEqual,
  roomDecorationSprite,
  tileContents,
} from "./AdventureTileVisuals";
import {
  BlacksmithShopPopover,
  AnglerPopover,
  NpcPopover,
  OddityBrewerPopover,
  PotionmasterPopover,
} from "./AdventureNpcPopovers";

interface AdventureViewProps {
  adventure: AdventureState | null;
  adventureSession: AdventureSession | null;
  progression: ProgressionState;
  memberActivities: Partial<Record<PlayerId, string>>;
  onStart: (dungeonId: AdventureDungeonId) => void;
  onUseEscapeRope: () => void;
  onMove: (position: Position) => void;
  onSecondaryAttack: (position: Position) => void;
  onPass: () => void;
  onToggleAuto: () => void;
  onChooseStrategy: (strategy: AdventureStrategy) => void;
  onChooseTargetRing: (ring: number) => void;
  onChooseRouteTarget: (roomKey: string) => void;
  onFocusMember: (memberId: PlayerId) => void;
  onSelectMember: (memberId: PlayerId, selected: boolean) => void;
  onToggleRestart: (enabled: boolean) => void;
  onToggleIgnoreGold: (enabled: boolean) => void;
  onTogglePortalType: (portalType: PortalType, enabled: boolean) => void;
  onToggleAutoPauseRoom: (room: AdventureAutoPauseRoom, enabled: boolean) => void;
  onOfferFish: (tileStat: StatKey, fishStat: StatKey) => void;
  onActivateQuest: (questId: QuestId) => void;
  onActivateCartographerQuest: () => void;
  onActivateHammerQuest: () => void;
  onPurchaseHammerQuest: () => void;
  onPurchaseBlacksmithPotion: () => void;
  onPurchasePickaxe: () => void;
  onDeliverForgeBlueprints: () => void;
  onPurchaseCraftingTable: () => void;
  onCompletePotionmasterQuest: () => void;
  onCompleteOddityBrewerExchange: () => void;
  onDeliverAnglerMaterials: () => void;
  onDeliverAnglerFish: () => void;
}

export function AdventureView({
  adventure,
  adventureSession,
  progression,
  memberActivities,
  onStart,
  onUseEscapeRope,
  onMove,
  onSecondaryAttack,
  onToggleAuto,
  onChooseStrategy,
  onChooseTargetRing,
  onChooseRouteTarget,
  onFocusMember,
  onSelectMember,
  onToggleRestart,
  onToggleIgnoreGold,
  onTogglePortalType,
  onToggleAutoPauseRoom,
  onOfferFish,
  onActivateQuest,
  onActivateCartographerQuest,
  onActivateHammerQuest,
  onPurchaseHammerQuest,
  onPurchaseBlacksmithPotion,
  onPurchasePickaxe,
  onDeliverForgeBlueprints,
  onPurchaseCraftingTable,
  onCompletePotionmasterQuest,
  onCompleteOddityBrewerExchange,
  onDeliverAnglerMaterials,
  onDeliverAnglerFish,
}: AdventureViewProps) {
  const [selectedOfferingFish, setSelectedOfferingFish] = useState<StatKey>("hp");
  const [blacksmithPopupRoomKey, setBlacksmithPopupRoomKey] = useState<string | null>(null);
  const [potionmasterPopupRoomKey, setPotionmasterPopupRoomKey] = useState<string | null>(null);
  const [oddityBrewerPopupRoomKey, setOddityBrewerPopupRoomKey] = useState<string | null>(null);
  const [shopkeeperPopupRoomKey, setShopkeeperPopupRoomKey] = useState<string | null>(null);
  const [cartographerPopupRoomKey, setCartographerPopupRoomKey] = useState<string | null>(null);
  const [anglerPopupRoomKey, setAnglerPopupRoomKey] = useState<string | null>(null);
  const [lotteryAnimationRoomKey, setLotteryAnimationRoomKey] = useState<string | null>(null);
  const [diceAnimationRoomKey, setDiceAnimationRoomKey] = useState<string | null>(null);
  const [diceAnimationTick, setDiceAnimationTick] = useState(0);
  const [escapeConfirmationOpen, setEscapeConfirmationOpen] = useState(false);
  const [selectedDungeon, setSelectedDungeon] = useState<AdventureDungeonId>("starting");
  const lotterySpinHistory = useRef(new Map<string, boolean>());
  const visibleRoom = adventure ? currentAdventureRoom(adventure) : null;
  const memberId = adventure?.playerId ?? progression.selectedAdventureMembers[0] ?? "knight";
  const equippedWeaponId = memberEquipment(progression, memberId).sword;
  const equippedWeapon = progression.inventory.find((item) => item.id === equippedWeaponId);
  const hasTrident = equippedWeapon?.definitionId === "trident";
  const weaponAbilityId = equippedWeapon?.weaponAbilityId;
  const cartographerQuestAvailable = Boolean(adventure?.cartographerSurveyTargets?.length);
  const strategyOptions = availableAdventureStrategies(progression, cartographerQuestAvailable);
  const selectedStrategy = effectiveAdventureStrategy(progression, Boolean(adventure?.cartographerQuestActive));
  const targetRingOptions = adventureAreaDropdownOptions(availableAdventureTargetRings(progression));
  const selectedTargetRing = targetRingOptions.some((option) => option.value === progression.targetAdventureRing)
    ? progression.targetAdventureRing
    : targetRingOptions.at(-1)?.value ?? 1;
  const routeTargetOptions = adventure
    ? discoveredLandmarkOptions(adventure)
    : [{ label: "None", value: "" }];
  const selectedRouteTarget = routeTargetOptions.some(
    (option) => option.value === (adventureSession?.routeTargetRoomKey ?? ""),
  )
    ? adventureSession?.routeTargetRoomKey ?? ""
    : "";

  useEffect(() => {
    setBlacksmithPopupRoomKey(null);
    setPotionmasterPopupRoomKey(null);
    setOddityBrewerPopupRoomKey(null);
    setShopkeeperPopupRoomKey(null);
    setCartographerPopupRoomKey(null);
    setAnglerPopupRoomKey(null);
  }, [adventure?.currentRoomKey]);

  useEffect(() => {
    if (!visibleRoom || visibleRoom.kind !== "lottery") {
      setLotteryAnimationRoomKey(null);
      return;
    }
    const spun = Boolean(visibleRoom.lotterySpun);
    const previouslySpun = lotterySpinHistory.current.get(visibleRoom.key);
    lotterySpinHistory.current.set(visibleRoom.key, spun);
    if (previouslySpun !== false || !spun) {
      setLotteryAnimationRoomKey(null);
      return;
    }
    setLotteryAnimationRoomKey(visibleRoom.key);
    const timer = window.setTimeout(() => setLotteryAnimationRoomKey(null), 1_200);
    return () => window.clearTimeout(timer);
  }, [visibleRoom?.key, visibleRoom?.kind, visibleRoom?.lotterySpun]);

  useEffect(() => {
    if (!visibleRoom || visibleRoom.kind !== "dice") {
      setDiceAnimationRoomKey(null);
      return;
    }
    setDiceAnimationRoomKey(visibleRoom.diceRolling ? visibleRoom.key : null);
  }, [visibleRoom?.key, visibleRoom?.kind, visibleRoom?.diceRolling]);

  useEffect(() => {
    if (!diceAnimationRoomKey) return;
    setDiceAnimationTick(0);
    const timer = window.setInterval(() => setDiceAnimationTick((tick) => tick + 1), 150);
    return () => window.clearInterval(timer);
  }, [diceAnimationRoomKey]);

  if (!adventure) {
    return (
      <main className="simple-page adventure-setup-view">
        <header className="page-heading">
          <h1>Adventure</h1>
        </header>
        <div className="adventure-setup-layout">
          <section className="info-box">
          <h2>Expedition setup</h2>
          {progression.greatTowerUnlocked && (
            <div className="adventure-dungeon-picker">
              <span>Dungeon</span>
              <GameDropdown
                ariaLabel="Choose dungeon"
                className="dungeon-game-dropdown"
                onChange={(dungeonId) => {
                  setSelectedDungeon(dungeonId);
                  if (dungeonId === "great-tower" && progression.restartAdventureOnFullHp) {
                    onToggleRestart(false);
                  }
                }}
                options={[
                  { label: "Starting Dungeon", value: "starting" },
                  { label: "Great Tower", value: "great-tower" },
                ]}
                value={selectedDungeon}
              />
              {selectedDungeon === "great-tower" && (
                <p className="adventure-dungeon-notice">
                  The Tower Key opened this path. Great Tower expeditions are not yet available.
                </p>
              )}
            </div>
          )}
          <fieldset>
            <legend>Adventuring party</legend>
            {Object.keys(progression.party).map((id) => {
              const partyId = id as PlayerId;
              const progress = getPartyMember(progression, partyId);
              const activity = memberActivities[partyId];
              return (
                <label className="plain-option" key={partyId}>
                  <input
                    checked={progression.selectedAdventureMembers.includes(partyId)}
                    disabled={Boolean(activity)}
                    onChange={(event) => onSelectMember(partyId, event.target.checked)}
                    type="checkbox"
                  />
                  {getPlayer(partyId).name} — HP {formatWholeAmount(progress.hp)}/{formatWholeAmount(memberMaxHp(progression, partyId))}, {" "}
                  Stamina {formatWholeAmount(progress.stamina)}/{formatWholeAmount(memberMaxStamina(progression, partyId))}
                  {activity ? ` — ${activity}` : ""}
                </label>
              );
            })}
          </fieldset>
          {strategyOptions.length > 0 && (
            <div className="plain-option adventure-strategy-picker">
              <span>Auto strategy</span>
              <GameDropdown
                ariaLabel="Auto strategy"
                className="strategy-game-dropdown"
                onChange={onChooseStrategy}
                options={adventureStrategyDropdownOptions(strategyOptions, true)}
                value={selectedStrategy}
              />
            </div>
          )}
          {selectedStrategy === "ring" && (
            <div className="plain-option adventure-zone-picker">
              <span>Area</span>
              <GameDropdown
                ariaLabel="Explore area"
                className="zone-game-dropdown"
                onChange={onChooseTargetRing}
                options={targetRingOptions}
                value={selectedTargetRing}
              />
            </div>
          )}
          <AdventureRestartToggle
            checked={progression.restartAdventureOnFullHp}
            onChange={onToggleRestart}
          />
          <AdvancedAdventureOptions
            progression={progression}
            onToggleIgnoreGold={onToggleIgnoreGold}
            onToggleAutoPauseRoom={onToggleAutoPauseRoom}
            onTogglePortalType={onTogglePortalType}
          />
          <button
            disabled={selectedDungeon === "great-tower" || !progression.selectedAdventureMembers.some((id) =>
              !memberActivities[id]
            )}
            onClick={() => onStart(selectedDungeon)}
            type="button"
          >
            {selectedDungeon === "great-tower" ? "Great Tower — coming soon" : "Enter dungeon"}
          </button>
          </section>
          <aside className="adventure-setup-quest">
            <QuestLog
              progression={progression}
              onActivateQuest={onActivateQuest}
              onActivateCartographerQuest={onActivateCartographerQuest}
              onActivateHammerQuest={onActivateHammerQuest}
            />
          </aside>
        </div>
      </main>
    );
  }

  const room = visibleRoom!;
  const roomEnemyName = room.kind === "rescue"
    ? adventureEnemyName("spider")
    : room.kind === "mermanThrone"
      ? adventureEnemyName("merman")
    : adventureEnemyName(enemyKindForAdventure(adventure, room));
  const playerTurn = isAdventurePlayerTurn(adventure);
  const escapeRopeLevel = adventureSession ? Math.max(1, ...adventureSession.order.flatMap((id) => {
    const explorer = adventureSession.explorers[id];
    if (!explorer) return [];
    return explorer.dungeonTheme === "water" ? [2] : [currentAdventureRoom(explorer).ring];
  })) : 1;
  const supportedEscapeRope = ESCAPE_ROPE_LEVELS.includes(escapeRopeLevel as EscapeRopeLevel);
  const ownedEscapeRopes = supportedEscapeRope
    ? progression.escapeRopes[escapeRopeLevel as EscapeRopeLevel]
    : 0;
  const viewport = adventureViewport(room, adventure.playerPosition);
  const tiles = Array.from({ length: viewport.height }, (_, viewportY) => {
    const y = viewport.minimumY + viewportY;
    return Array.from({ length: viewport.width }, (_, viewportX) => {
      const x = viewport.minimumX + viewportX;
      return { tile: room.tiles[y][x], x, y };
    });
  }).flat();
  const hasBlacksmith = tiles.some(({ tile }) => tile.kind === "blacksmith");
  const hasPotionmaster = tiles.some(({ tile }) => tile.kind === "potionmaster");
  const hasOddityBrewer = tiles.some(({ tile }) => tile.kind === "oddityBrewer");
  const hasCartographer = tiles.some(({ tile }) => tile.kind === "cartographer");
  const hasAngler = tiles.some(({ tile }) => tile.kind === "angler");
  const attackEffectTarget = adventure.lastProjectile?.to
    ?? averagePosition(adventure.lastImpact)
    ?? adventure.lastAttackOrigin;

  return (
    <main className="adventure-view">
      <div>
        <header className="page-heading">
          <h1>Adventure</h1>
        </header>

        {adventureSession && adventureSession.order.length > 1 && (
          <div className="member-selector" aria-label="Active explorers">
            {adventureSession.order.map((id) => {
              const explorer = adventureSession.explorers[id];
              if (!explorer) return null;
              return (
                <button
                  className={id === adventureSession.focusedMemberId ? "is-active" : ""}
                  key={id}
                  onClick={() => onFocusMember(id)}
                  type="button"
                >
                  {getPlayer(id).name} — Room {currentAdventureRoom(explorer).number}
                </button>
              );
            })}
          </div>
        )}

        <div className="activity-screen-frame adventure-screen-frame">
          <div
            className={`adventure-board room-${room.kind}`}
            role="grid"
            aria-label={`Dungeon room ${room.number}`}
            style={{
              gridTemplateColumns: `repeat(${viewport.width}, 1fr)`,
              gridTemplateRows: `repeat(${viewport.height}, 1fr)`,
            }}
          >
          {adventure.lastAttackVisual
            && adventure.lastAttackOrigin
            && attackEffectTarget
            && (adventure.lastProjectile || adventure.lastImpact?.length) && (
              <AttackEffectOverlay
                visual={adventure.lastAttackVisual}
                from={adventure.lastAttackOrigin}
                to={attackEffectTarget}
                minimumX={viewport.minimumX}
                minimumY={viewport.minimumY}
                columns={viewport.width}
                rows={viewport.height}
                effectKey={`${adventure.log[0] ?? "attack"}-${adventure.lastAttackOrigin.x}-${adventure.lastAttackOrigin.y}`}
              />
            )}
          {tiles.map(({ tile, x, y }) => {
            const position = { x, y };
            const hasPlayer = positionsEqual(adventure.playerPosition, position);
            const otherExplorerId = adventureSession?.order.find((id) => {
              if (id === memberId) return false;
              const explorer = adventureSession.explorers[id];
              return explorer?.currentRoomKey === room.key
                && positionsEqual(explorer.playerPosition, position);
            }) ?? null;
            const occupantId = hasPlayer ? memberId : otherExplorerId;
            const occupantFacing = hasPlayer
              ? adventure.playerFacing ?? "right"
              : otherExplorerId
                ? adventureSession?.explorers[otherExplorerId]?.playerFacing ?? "right"
                : null;
            const unitFacingClass = occupantFacing
              ? `unit-facing-${occupantFacing}`
              : tile.kind === "enemy"
                ? `unit-facing-${tile.spriteFacing ?? "left"}`
                : "";
            const occupantName = occupantId ? getPlayer(occupantId).name : "";
            const occupantHpPercent = occupantId
              ? Math.max(0, Math.min(100, getPartyMember(progression, occupantId).hp
                .div(memberMaxHp(progression, occupantId)).mul(100).toNumber()))
              : null;
            const adjacent = isAdjacent(adventure.playerPosition, position);
            const walkable = tile.kind !== "wall"
              && tile.kind !== "cage"
              && tile.kind !== "shopkeeperCage"
              && tile.kind !== "shopkeeper"
              && tile.kind !== "rodKeeper"
              && tile.kind !== "blacksmith"
              && tile.kind !== "blacksmithForge"
              && tile.kind !== "blacksmithAnvil"
              && tile.kind !== "blacksmithWorkbench"
              && tile.kind !== "blacksmithToolRack"
              && tile.kind !== "blacksmithSupplies"
              && tile.kind !== "potionmaster"
              && tile.kind !== "oddityBrewer"
              && tile.kind !== "potionCauldron"
              && tile.kind !== "potionShelf"
              && tile.kind !== "potionTable"
              && tile.kind !== "cartographer"
              && tile.kind !== "mapTable"
              && tile.kind !== "angler"
              && tile.kind !== "anglerNet"
              && tile.kind !== "diceDisplay"
              && tile.kind !== "gardenTree"
              && tile.kind !== "gardenFountain"
              && tile.kind !== "gardenStatue"
              && tile.kind !== "gardenWater"
              && tile.kind !== "gardenFlowers"
              && tile.kind !== "gardenBench"
              && tile.kind !== "towerWall"
              && tile.kind !== "towerDoor"
              && tile.kind !== "miner"
              && tile.kind !== "caveRock"
              && tile.kind !== "caveGem"
              && tile.kind !== "lotteryGate"
              && tile.kind !== "diceGate"
              && tile.kind !== "forgeGate"
              && tile.kind !== "clayGate"
              && tile.kind !== "clayBoulder"
              && !(tile.kind === "woodenDoor" && (!tile.doorOpen || tile.bossBarrier));
            const blacksmithInteractable = tile.kind === "blacksmith"
              && adjacent
              && playerTurn
              && !progression.adventureAutoMode;
            const minerInteractable = tile.kind === "miner"
              && adjacent
              && playerTurn
              && !progression.adventureAutoMode;
            const potionmasterInteractable = tile.kind === "potionmaster"
              && adjacent
              && playerTurn
              && !progression.adventureAutoMode;
            const oddityBrewerInteractable = tile.kind === "oddityBrewer"
              && adjacent
              && playerTurn
              && !progression.adventureAutoMode;
            const shopkeeperInteractable = tile.kind === "shopkeeper"
              && adjacent
              && playerTurn
              && !progression.adventureAutoMode;
            const rodKeeperInteractable = tile.kind === "rodKeeper"
              && adjacent
              && playerTurn
              && !progression.adventureAutoMode;
            const cartographerInteractable = tile.kind === "cartographer" && adjacent && playerTurn && !progression.adventureAutoMode;
            const anglerInteractable = tile.kind === "angler" && adjacent && playerTurn && !progression.adventureAutoMode;
            const towerDoorInteractable = tile.kind === "towerDoor"
              && adjacent
              && playerTurn
              && !progression.adventureAutoMode;
            const basicAttackable = tile.kind === "enemy" && canPlayerAttackTile(
              adventure,
              room,
              position,
              false,
              false,
            );
            const secondaryAttackable = Boolean(
              tile.kind === "enemy"
              && weaponAbilityId
              && (weaponAbilityId !== "trident-throw" || progression.weaponThrowUnlocked)
              && isInAdventureWeaponSkillRange(
              adventure,
              room,
              position,
              weaponAbilityId,
              hasTrident,
              )
            );
            const attackable = basicAttackable || secondaryAttackable;
            const projectile = isProjectileTile(adventure, position);
            const impact = !attackEffectHasArea(adventure.lastAttackVisual)
              && adventure.lastImpact?.some((candidate) => positionsEqual(candidate, position));
            const attackOrigin = Boolean(
              adventure.lastAttackOrigin
              && positionsEqual(adventure.lastAttackOrigin, position),
            );
            const attackVisualClass = adventure.lastAttackVisual
              ? `attack-visual-${adventure.lastAttackVisual}`
              : "";
            const fireBeamPhase = tile.kind === "trap"
              && tile.revealed
              && tile.trapStyle === "fire-beam"
                ? fireBeamIsActive(room, tile) ? "fire-beam-active" : "fire-beam-inactive"
                : "";
            const visibleKind = tile.kind === "trap" && !tile.revealed ? "floor" : tile.kind;
            const floorTexture = adventureFloorTexture(
              room,
              tile,
              x,
              y,
              adventure.dungeonTheme ?? "earth",
            );
            const forgeRecipeMarker = room.forgeRecipeId
              ? forgeRecipeMarkerAt(room.forgeRecipeId, x, y)
              : null;
            return (
              <button
                className={`adventure-tile tile-${visibleKind} ${unitFacingClass} ${occupantId ? "has-party-occupant" : ""} ${tile.kind === "enemy" && tile.enemyKind === "mummy" && tile.enemyPart === 0 ? "mummy-anchor" : ""} ${tile.kind === "enemy" && (tile.enemyKind === "fire-alligator" || tile.enemyKind === "alligator") && tile.enemyPart === 0 ? `two-tile-enemy-anchor facing-${tile.enemyFacing ?? "south"}` : ""} ${tile.kind === "trap" && tile.trapBeamDirection === "vertical" ? "fire-beam-vertical" : ""} ${fireBeamPhase} ${projectile ? `projectile-path projectile-${adventure.lastProjectile?.kind ?? "water"}` : ""} ${attackOrigin ? `adventure-attack-origin ${attackVisualClass}` : ""} ${impact ? `adventure-impact impact-${adventure.lastProjectile?.kind ?? "physical"} ${attackVisualClass}` : ""} ${((adjacent && walkable && !otherExplorerId || attackable) && playerTurn && !progression.adventureAutoMode) || blacksmithInteractable || minerInteractable || potionmasterInteractable || oddityBrewerInteractable || shopkeeperInteractable || rodKeeperInteractable || cartographerInteractable || anglerInteractable || towerDoorInteractable ? "actionable" : ""}`}
                disabled={(!walkable && !blacksmithInteractable && !minerInteractable && !potionmasterInteractable && !oddityBrewerInteractable && !shopkeeperInteractable && !rodKeeperInteractable && !cartographerInteractable && !anglerInteractable && !towerDoorInteractable) || Boolean(otherExplorerId)}
                key={`${x}-${y}`}
                onClick={() => {
                  if (
                    blacksmithInteractable
                  ) {
                    if (progression.forgeBlueprintsRecovered && !progression.forgeBlueprintsDelivered) {
                      onDeliverForgeBlueprints();
                    }
                    setBlacksmithPopupRoomKey(room.key);
                    return;
                  }
                  if (potionmasterInteractable) setPotionmasterPopupRoomKey(room.key);
                  if (oddityBrewerInteractable) setOddityBrewerPopupRoomKey(room.key);
                  if (shopkeeperInteractable) setShopkeeperPopupRoomKey(room.key);
                  if (cartographerInteractable) setCartographerPopupRoomKey(room.key);
                  if (anglerInteractable) setAnglerPopupRoomKey(room.key);
                  onMove(position);
                }}
                onContextMenu={(event) => {
                  event.preventDefault();
                  if (tile.kind === "enemy" && playerTurn && !progression.adventureAutoMode) {
                    onSecondaryAttack(position);
                  }
                }}
                type="button"
                role="gridcell"
                aria-label={occupantId ? `${occupantName} on ${describeTile(tile, room.ring)}` : describeTile(tile, room.ring)}
              >
                {floorTexture && (
                  <span aria-hidden="true" className="floor-texture">
                    <Sprite name={floorTexture} />
                  </span>
                )}
                {forgeRecipeMarker && (
                  <span
                    aria-hidden="true"
                    className={`forge-recipe-marker forge-recipe-${forgeRecipeMarker.toLowerCase()}`}
                  >
                    <Sprite name={forgeRecipeMarkerSprite(forgeRecipeMarker)} />
                  </span>
                )}
                {roomDecorationSprite(tile.decoration) && (
                  <span aria-hidden="true" className={`room-decoration room-decoration-${tile.decoration}`}>
                    <Sprite name={roomDecorationSprite(tile.decoration)!} />
                  </span>
                )}
                {tileContents(
                  fireBeamPhase === "fire-beam-inactive" ? { ...tile, kind: "floor" } : tile,
                  room.ring,
                  occupantId,
                  occupantName,
                  occupantHpPercent,
                  adventure.dungeonTheme ?? "earth",
                  tile.offeringStat ? progression.waterShrineOfferings[tile.offeringStat] : undefined,
                  diceAnimationRoomKey === room.key,
                  room.diceValue,
                  room.diceValues,
                  diceAnimationTick,
                )}
              </button>
            );
          })}
          {room.kind === "lottery" && (
            <LotteryWheelOverlay
              animate={lotteryAnimationRoomKey === room.key}
              spun={Boolean(room.lotterySpun)}
              outcome={room.lotteryOutcome}
              color={room.lotteryColor}
              size={room.width}
            />
          )}
          {room.kind === "blacksmith"
            && hasBlacksmith
            && blacksmithPopupRoomKey === room.key && (
              <BlacksmithShopPopover
                progression={progression}
                onClose={() => setBlacksmithPopupRoomKey(null)}
                onPurchaseHammerQuest={onPurchaseHammerQuest}
                onPurchasePotion={onPurchaseBlacksmithPotion}
                onPurchasePickaxe={onPurchasePickaxe}
                onPurchaseCraftingTable={onPurchaseCraftingTable}
              />
            )}
          {room.kind === "potionmaster"
            && hasPotionmaster
            && potionmasterPopupRoomKey === room.key && (
              <PotionmasterPopover
                progression={progression}
                onClose={() => setPotionmasterPopupRoomKey(null)}
                onComplete={onCompletePotionmasterQuest}
              />
            )}
          {room.kind === "oddityBrewer"
            && hasOddityBrewer
            && oddityBrewerPopupRoomKey === room.key && (
              <OddityBrewerPopover
                progression={progression}
                onClose={() => setOddityBrewerPopupRoomKey(null)}
                onComplete={onCompleteOddityBrewerExchange}
              />
            )}
          {room.kind === "shopkeeper"
            && shopkeeperPopupRoomKey === room.key && (
              <NpcPopover
                name="Shopkeeper"
                sprite="shopkeeper"
                onClose={() => setShopkeeperPopupRoomKey(null)}
              >
                <p>{STORY_DIALOGUE.npcs.shopkeeper}</p>
              </NpcPopover>
            )}
          {room.kind === "cartographer" && hasCartographer && cartographerPopupRoomKey === room.key && (
            <NpcPopover name="Lost Cartographer" sprite="cartographer" onClose={() => setCartographerPopupRoomKey(null)}>
              <p>{progression.cartographerQuestCompleted
                ? STORY_DIALOGUE.npcs.cartographer.complete
                : STORY_DIALOGUE.npcs.cartographer.surveying(
                    adventure.cartographerSurveyVisited?.length ?? 0,
                    adventure.cartographerSurveyTargets?.length ?? 3,
                  )}</p>
            </NpcPopover>
          )}
          {room.kind === "angler" && hasAngler && anglerPopupRoomKey === room.key && (
            <AnglerPopover progression={progression} onClose={() => setAnglerPopupRoomKey(null)} onDeliverMaterials={onDeliverAnglerMaterials} onDeliverFish={onDeliverAnglerFish} />
          )}
          </div>
        </div>

        <div className="adventure-controls">
          <div className="adventure-control-toolbar">
            <button className="adventure-auto-button" onClick={onToggleAuto} type="button">
              Auto: {progression.adventureAutoMode ? "on" : "off"} (Q)
            </button>
            {strategyOptions.length > 0 && (
              <div className="adventure-control-picker">
                <span>Strategy</span>
                <GameDropdown
                  ariaLabel="Active auto strategy"
                  className="strategy-game-dropdown"
                  onChange={onChooseStrategy}
                  options={adventureStrategyDropdownOptions(strategyOptions, false)}
                  value={selectedStrategy}
                />
              </div>
            )}
            {selectedStrategy === "ring" && (
              <div className="adventure-zone-picker">
                <span>Area</span>
                <GameDropdown
                  ariaLabel="Explore area"
                  className="zone-game-dropdown"
                  onChange={onChooseTargetRing}
                  options={targetRingOptions}
                  value={selectedTargetRing}
                />
              </div>
            )}
            {routeTargetOptions.length > 1 && (
              <div className="adventure-route-picker">
                <span>Route to</span>
                <GameDropdown
                  ariaLabel="Route expedition to a discovered landmark"
                  className="route-game-dropdown"
                  onChange={onChooseRouteTarget}
                  options={routeTargetOptions}
                  value={selectedRouteTarget}
                />
              </div>
            )}
          </div>
          <AdventureRestartToggle
            checked={progression.restartAdventureOnFullHp}
            onChange={onToggleRestart}
          />
          <AdvancedAdventureOptions
            progression={progression}
            onToggleIgnoreGold={onToggleIgnoreGold}
            onToggleAutoPauseRoom={onToggleAutoPauseRoom}
            onTogglePortalType={onTogglePortalType}
          />
          <div className="adventure-control-footer">
            <button
              disabled={!supportedEscapeRope || ownedEscapeRopes <= 0}
              onClick={() => setEscapeConfirmationOpen(true)}
              type="button"
            >
              {supportedEscapeRope
                ? `Use Level ${escapeRopeLevel} Escape Rope (${ownedEscapeRopes})`
                : `No rope reaches ${escapeRopeLevel} room${escapeRopeLevel === 1 ? "" : "s"} from the entrance`}
            </button>
          {!progression.adventureAutoMode && (
            <span>
              {playerTurn
                ? adventure.playerMustPass
                  ? "The acting member must pass to recover their thrown weapon."
                  : `Move with WASD/arrows. Left-click a ${roomEnemyName} for a basic attack; right-click for the weapon's secondary attack.`
                : `A ${roomEnemyName} is taking its turn.`}
            </span>
          )}
          </div>
        </div>
        {room.kind === "offering" && (() => {
          const standingTile = room.tiles[adventure.playerPosition.y]?.[adventure.playerPosition.x];
          if (standingTile?.kind !== "offering" || !standingTile.offeringStat || progression.adventureAutoMode) return null;
          const previous = progression.waterShrineOfferings[standingTile.offeringStat];
          return (
            <section className="offering-prompt" aria-label="Fish offering">
              <strong>Give an offering?</strong>
              <span>{previous ? `${FISH_META[previous].name} is currently placed here.` : "The colored tile is empty."}</span>
              <select
                aria-label="Fish to offer"
                onChange={(event) => setSelectedOfferingFish(event.target.value as StatKey)}
                value={selectedOfferingFish}
              >
                {FISH_STATS.map((stat) => (
                  <option key={stat} value={stat}>
                    {FISH_META[stat].name} ×{progression.fish[stat]}
                  </option>
                ))}
              </select>
              <button
                disabled={progression.fish[selectedOfferingFish] <= 0}
                onClick={() => onOfferFish(standingTile.offeringStat!, selectedOfferingFish)}
                type="button"
              >
                Place fish
              </button>
            </section>
          );
        })()}
        {escapeConfirmationOpen && (
          <div className="reward-popup-backdrop" role="presentation">
            <section
              aria-labelledby="escape-confirmation-title"
              aria-modal="true"
              className="reward-popup escape-rope-confirmation"
              role="dialog"
            >
              <h2 id="escape-confirmation-title">Use Escape Rope?</h2>
              <p>Leave this dungeon and bank all carried gold?</p>
              <div className="escape-confirmation-actions">
                <button
                  autoFocus
                  onClick={() => {
                    setEscapeConfirmationOpen(false);
                    onUseEscapeRope();
                  }}
                  type="button"
                >
                  Yes
                </button>
                <button onClick={() => setEscapeConfirmationOpen(false)} type="button">No</button>
              </div>
            </section>
          </div>
        )}
      </div>

      <aside className="adventure-sidebar">
        <QuestLog
          locked
          progression={progression}
          cartographerQuestActive={Boolean(adventure.cartographerQuestActive)}
          cartographerQuestAvailable={Boolean(adventure.cartographerSurveyTargets?.length)}
          hammerQuestActive={adventure.questTarget?.questId === "retrieve-hammer"}
          hammerQuestAvailable={room.kind === "blacksmith"}
          onActivateQuest={onActivateQuest}
          onActivateCartographerQuest={onActivateCartographerQuest}
          onActivateHammerQuest={onActivateHammerQuest}
        />
        <DungeonMap adventure={adventure} />
        <section className="adventure-party-status" aria-label="Adventuring party status">
          <h2>Party</h2>
          <div className="adventure-party-health">
            {(adventureSession?.order ?? [memberId]).flatMap((id) => {
              if (adventureSession && !adventureSession.explorers[id]) return [];
              const member = getPartyMember(progression, id);
              const maximum = memberMaxHp(progression, id);
              return [(
                <span key={id}>
                  <strong>{getPlayer(id).name}</strong> {formatWholeAmount(member.hp)}/{formatWholeAmount(maximum)} HP
                  {" · "}{formatWholeAmount(member.stamina)}/{formatWholeAmount(memberMaxStamina(progression, id))} Stamina
                </span>
              )];
            })}
            <span><strong>Carried gold</strong> {formatWholeAmount(adventureSession?.carriedGold ?? progression.gold.mul(0))}</span>
          </div>
        </section>
        <section>
          <h2>Adventure log</h2>
          <ul>
            {adventure.log.map((entry, index) => <li key={`${entry}-${index}`}>{entry}</li>)}
          </ul>
        </section>
      </aside>
    </main>
  );
}

function averagePosition(positions: Position[] | undefined): Position | null {
  if (!positions?.length) return null;
  return {
    x: positions.reduce((total, position) => total + position.x, 0) / positions.length,
    y: positions.reduce((total, position) => total + position.y, 0) / positions.length,
  };
}
