import { useCallback, useEffect, useRef, useState } from "react";
import Decimal from "break_eternity.js";
import {
  AdventureView,
  BattleView,
  BestiaryView,
  ConversationBox,
  CraftingView,
  FishingView,
  HelpIndex,
  PartyView,
  RewardPopup,
  ShopView,
  TrainingView,
  MiningView,
  type RewardPopupContent,
} from "./features";
import { conversation, type ConversationId } from "./content/story-dialogue";
import {
  addAdventureExplorer,
  activateHammerQuestAtBlacksmith,
  activateMinerQuestAtBlacksmith,
  allNonWallTilesReachable,
  currentAdventureRoom,
  createAdventureHeadings,
  isAdventurePlayerTurn,
  moveInAdventure,
  openOfferingChamber,
  passAdventureTurn,
  performAdventureEnemyTurn,
  repairAdventureRoomConnectivity,
  revealChalkArea,
  settleDiceRoomRoll,
  shouldPauseAutoForOfferingEntry,
  startAdventure,
  suggestAdventureMove,
  type AdventureState,
} from "./game/adventure";
import { penalizeAdventureGold } from "./game/adventure/session";
import {
  activeUnit,
  battleReservedPlayerIds,
  createBattle,
  deployPlayerUnit,
  isInAttackRange,
  manualCombatAction,
  performAction,
  persistentPlayerHp,
  suggestedAction,
  selectDeploymentUnit,
  startRaid,
  syncDeployingBattleHp,
  undeployPlayerUnit,
  unitAt,
} from "./game/combat";
import {
  addGold,
  addMaterial,
  addPotion,
  activateQuest,
  advanceTimedEffects,
  advanceProgression,
  adventureTabUnlocked,
  adventureSpeedMultiplier,
  beginHammerQuestAttempt,
  effectiveAdventureStrategy,
  completeAdventureRun,
  completeQuest,
  completeTridentTrial,
  clampPartyVitals,
  completePotionmasterQuest,
  completeOddityBrewerExchange,
  completeCartographerQuest,
  completeAnglerRequest,
  consumeMapmakerChalk,
  deliverAnglerMaterials,
  deliverForgeBlueprints,
  discoverAdventureSpecialRoom,
  discoverTowerDoor,
  discoverBlacksmith,
  consumeEscapeRope,
  consumePotion,
  equipGear,
  failHammerQuestAttempt,
  feedFish,
  fishingTabUnlocked,
  formatDecimal,
  getPartyMember,
  healParty,
  loadProgression,
  memberMaxHp,
  memberMaxStamina,
  memberStats,
  mysteryPotionDodgeChance,
  markShopUnlocksSeen,
  nextRaidNumber,
  offerFishAtWaterShrine,
  partyMemberIds,
  trainingTabUnlocked,
  purchaseQuest,
  purchasePotion,
  purchaseUndeadGem,
  purchaseEscapeRope,
  purchaseBlacksmithHealingPotion,
  purchaseInventorySlots,
  purchaseInventoryStackSize,
  purchasePickaxe,
  purchaseCraftingTable,
  purchaseHammerQuest,
  recordMiningRoomReached,
  recoverBlacksmithHammer,
  recoverForgeBlueprints,
  returnBlacksmithHammer,
  recordAdventureRingVisit,
  recordAdventureDeath,
  recordEnemyDefeats,
  recordForgeDungeonVisit,
  recordWaterDungeonVisit,
  recordVictory,
  saveProgression,
  shopTabUnlocked,
  sellFish,
  sellGear,
  sellMaterial,
  setMemberHp,
  setMemberStamina,
  setMemberStaminaActions,
  setMiningAutoMode,
  setMiningMember,
  setRestartMiningOnFullHp,
  setAdventureMemberSelected,
  setAdventureIgnoreGold,
  setAdventureAutoPauseRoom,
  setAdventureStrategy,
  setAdventureTargetRing,
  setFavoredFishStat,
  setAutoEnterPortalType,
  setRestartAdventureOnFullHp,
  settleAdventureGold,
  startTraining,
  startFishing,
  stopFishing,
  tryAddGear,
  unlockGreatTower,
  unlockShopkeeper,
  useBlacksmithHealingPotion,
  unequipGear,
  type ProgressionState,
  type SaveSlot,
} from "./game/progression";
import { getPlayer } from "./content/players";
import { getQuest, type QuestId } from "./content/quests";
import { STAT_META, type AdventureAutoPauseRoom, type AdventureDungeonId, type AdventureStrategy, type BattleState, type CombatAction, type PlayerId, type PortalType, type Position, type StatKey } from "./game/types";
import type { GearSlot } from "./game/gear";
import { FISH_META, MATERIAL_META, type MaterialId } from "./game/items";
import { POTION_META, mysteryPotionEffectDescription, type PotionId } from "./game/potions";
import { ESCAPE_ROPE_LEVELS, type EscapeRopeLevel } from "./game/escape-ropes";
import { craftItem, type CraftingGrid } from "./game/crafting";
import { formatWholeAmount } from "./game/numbers";
import {
  cachePortalDungeonSession,
  type AdventureSession,
} from "./game/adventure/session";
import {
  advanceMining,
  attackMiningEnemy,
  createMiningRoom,
  enterNextMiningRoom,
  selectMiningRock,
  type MiningResult,
  type MiningState,
} from "./game/mining";
import { battleRewardPopups } from "./features/battle/battleRewards";
import { battlePartySetup } from "./features/battle/playerSetup";
import { GameNavigation, type GameView } from "./features/shell/GameNavigation";
import {
  activeAdventureMemberIds,
  activeMiningMemberId,
  advanceSessionDiceCurse,
  adventureMemberStats,
  allExplorersOnPortal,
  createForgeAdventureSession,
  createWaterAdventureSession,
  memberAssignedOutsideBattle,
  memberHasShamanRing,
  memberHasSuctionCups,
  memberHasTrident,
  memberWeaponAbility,
  miningMemberIds,
  otherAdventureExplorerPositions,
  playerIdSetKey,
  refreshAdventureRoomTimelines,
  requiredEscapeRopeLevel,
  restoreMainDungeonSession,
  restorePortalDungeonSession,
  startAdventureDiceCurse,
  unavailableBattleMemberIds,
  updateAdventureSession,
} from "./features/adventure/sessionController";

interface GameProps {
  saveSlot: SaveSlot;
  onQuitToTitle: () => void;
}

export function Game({ saveSlot, onQuitToTitle }: GameProps) {
  const [progression, setProgression] = useState<ProgressionState>(() => loadProgression(saveSlot));
  const progressionRef = useRef(progression);
  const playTimeCheckpointRef = useRef(Date.now());
  const [battle, setBattle] = useState<BattleState>(() =>
    createBattle(nextRaidNumber(progression) ?? progression.highestUnlockedLevel, battlePartySetup(progression)),
  );
  const battleRef = useRef(battle);
  const [adventureSession, setAdventureSession] = useState<AdventureSession | null>(null);
  const adventureSessionRef = useRef<AdventureSession | null>(null);
  const adventureTickRef = useRef(0);
  const [miningState, setMiningState] = useState<MiningState | null>(null);
  const miningStateRef = useRef<MiningState | null>(null);
  const [pendingMiningRestartMemberId, setPendingMiningRestartMemberId] = useState<PlayerId | null>(null);
  const pendingMiningRestartMemberIdRef = useRef<PlayerId | null>(null);
  const [view, setView] = useState<GameView>("battle");
  const viewRef = useRef<GameView>("battle");
  const [rewardPopups, setRewardPopups] = useState<RewardPopupContent[]>([]);
  const [activeConversation, setActiveConversation] = useState<{
    id: ConversationId;
    line: number;
  } | null>(null);
  const conversationActiveRef = useRef(false);
  const conversationContinuationRef = useRef<(() => void) | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const rewardedRef = useRef(false);

  const startConversation = useCallback((
    id: ConversationId,
    onComplete?: () => void,
  ) => {
    conversationActiveRef.current = true;
    conversationContinuationRef.current = onComplete ?? null;
    setActiveConversation({ id, line: 0 });
  }, []);

  const advanceConversation = useCallback(() => {
    if (!activeConversation) return;
    const lines = conversation(activeConversation.id);
    if (activeConversation.line + 1 < lines.length) {
      setActiveConversation({ ...activeConversation, line: activeConversation.line + 1 });
      return;
    }
    conversationActiveRef.current = false;
    const continuation = conversationContinuationRef.current;
    conversationContinuationRef.current = null;
    setActiveConversation(null);
    continuation?.();
  }, [activeConversation]);

  const commitBattle = useCallback((next: BattleState) => {
    battleRef.current = next;
    setBattle(next);
  }, []);

  const commitMiningState = useCallback((next: MiningState | null) => {
    const previousMember = activeMiningMemberId(
      miningStateRef.current,
      pendingMiningRestartMemberIdRef.current,
    );
    miningStateRef.current = next;
    setMiningState(next);
    const nextMember = activeMiningMemberId(next, pendingMiningRestartMemberIdRef.current);
    const currentBattle = battleRef.current;
    if (previousMember !== nextMember && currentBattle.status === "deploying") {
      commitBattle(createBattle(
        currentBattle.level.number,
        battlePartySetup(
          progressionRef.current,
          unavailableBattleMemberIds(
            adventureSessionRef.current,
            next,
            pendingMiningRestartMemberIdRef.current,
          ),
        ),
        { previousBattle: currentBattle, rerollRandomSpawns: false },
      ));
    }
  }, [commitBattle]);

  const commitPendingMiningRestart = useCallback((memberId: PlayerId | null) => {
    const previousMember = activeMiningMemberId(
      miningStateRef.current,
      pendingMiningRestartMemberIdRef.current,
    );
    pendingMiningRestartMemberIdRef.current = memberId;
    setPendingMiningRestartMemberId(memberId);
    const nextMember = activeMiningMemberId(miningStateRef.current, memberId);
    const currentBattle = battleRef.current;
    if (previousMember !== nextMember && currentBattle.status === "deploying") {
      commitBattle(createBattle(
        currentBattle.level.number,
        battlePartySetup(
          progressionRef.current,
          unavailableBattleMemberIds(adventureSessionRef.current, miningStateRef.current, memberId),
        ),
        { previousBattle: currentBattle, rerollRandomSpawns: false },
      ));
    }
  }, [commitBattle]);

  const commitProgression = useCallback((next: ProgressionState) => {
    const previousFishingMember = progressionRef.current.fishingAssignment?.memberId ?? null;
    const nextFishingMember = next.fishingAssignment?.memberId ?? null;
    progressionRef.current = next;
    setProgression(next);
    const currentBattle = battleRef.current;
    if (previousFishingMember !== nextFishingMember && currentBattle.status === "deploying") {
      commitBattle(createBattle(
        currentBattle.level.number,
        battlePartySetup(
          next,
          unavailableBattleMemberIds(
            adventureSessionRef.current,
            miningStateRef.current,
            pendingMiningRestartMemberIdRef.current,
          ),
        ),
        { previousBattle: currentBattle, rerollRandomSpawns: false },
      ));
    } else {
      const synchronizedBattle = syncDeployingBattleHp(
        currentBattle,
        Object.fromEntries(
          partyMemberIds(next).map((id) => [id, getPartyMember(next, id).hp]),
        ),
      );
      if (synchronizedBattle !== currentBattle) commitBattle(synchronizedBattle);
    }
  }, [commitBattle]);

  const commitAdventureSession = useCallback((next: AdventureSession | null) => {
    const previousIds = activeAdventureMemberIds(adventureSessionRef.current);
    const nextIds = activeAdventureMemberIds(next);
    if (next === null && adventureSessionRef.current) {
      const completedRunProgress = completeAdventureRun(progressionRef.current);
      if (completedRunProgress !== progressionRef.current) commitProgression(completedRunProgress);
    }
    adventureSessionRef.current = next;
    setAdventureSession(next);
    const currentBattle = battleRef.current;
    if (
      currentBattle.status === "deploying"
      && playerIdSetKey(previousIds) !== playerIdSetKey(nextIds)
    ) {
      commitBattle(createBattle(
        currentBattle.level.number,
        battlePartySetup(
          progressionRef.current,
          [...new Set([
            ...nextIds,
            ...miningMemberIds(miningStateRef.current, pendingMiningRestartMemberIdRef.current),
          ])],
        ),
        { previousBattle: currentBattle, rerollRandomSpawns: false },
      ));
    }
  }, [commitBattle, commitProgression]);

  const showToast = useCallback((_message: string) => {}, []);

  const recordPlayTime = useCallback((state = progressionRef.current) => {
    const now = Date.now();
    const elapsed = Math.max(0, now - playTimeCheckpointRef.current);
    playTimeCheckpointRef.current = now;
    if (elapsed < 1) return state;
    const next = {
      ...state,
      timePlayedMs: state.timePlayedMs + elapsed,
    };
    progressionRef.current = next;
    setProgression(next);
    return next;
  }, []);

  const saveAndQuitToTitle = useCallback(() => {
    const state = adventureSessionRef.current
      ? completeAdventureRun(failHammerQuestAttempt(progressionRef.current))
      : progressionRef.current;
    saveProgression(recordPlayTime(state), saveSlot);
    onQuitToTitle();
  }, [onQuitToTitle, recordPlayTime, saveSlot]);

  const executeBattleAction = useCallback(
    (action: CombatAction) => {
      const previousBattle = battleRef.current;
      const result = performAction(
        previousBattle,
        action,
        Math.random,
        mysteryPotionDodgeChance(progressionRef.current),
      );
      if (!result.ok) {
        showToast(result.error);
        return;
      }
      let nextProgress = progressionRef.current;
      const defeatedEnemyIds = result.state.units
        .filter((unit) => unit.team === "enemy" && unit.hp.lte(0))
        .filter((unit) => {
          const previous = previousBattle.units.find((candidate) => candidate.id === unit.id);
          return !previous || previous.hp.gt(0);
        })
        .map((unit) => unit.definitionId);
      if (defeatedEnemyIds.length > 0) {
        nextProgress = recordEnemyDefeats(nextProgress, defeatedEnemyIds);
      }
      const newlyDefeated: string[] = [];
      for (const id of partyMemberIds(nextProgress)) {
        const remainingHp = persistentPlayerHp(result.state, id);
        if (remainingHp === null) continue;
        const previousUnit = previousBattle.units.find(
          (unit) => unit.team === "player" && unit.definitionId === id,
        );
        if (previousUnit?.hp.gt(0) && remainingHp.lte(0)) newlyDefeated.push(getPlayer(id).name);
        nextProgress = setMemberHp(nextProgress, id, remainingHp);
      }
      commitProgression(nextProgress);
      commitBattle(result.state);
      if (newlyDefeated.length > 0) {
        showToast(`${newlyDefeated.join(" and ")} defeated! Respawned with 10% HP and all the same bruises.`);
      }
    },
    [commitBattle, commitProgression, showToast],
  );

  const beginLevel = useCallback(
    () => {
      const progress = progressionRef.current;
      const selectedLevel = nextRaidNumber(progress);
      if (selectedLevel === null) return;
      const nextProgress = { ...progress, selectedLevel };
      commitProgression(nextProgress);
      commitBattle(createBattle(
        selectedLevel,
        battlePartySetup(
          nextProgress,
          unavailableBattleMemberIds(
            adventureSessionRef.current,
            miningStateRef.current,
            pendingMiningRestartMemberIdRef.current,
          ),
        ),
        {
          previousBattle: battleRef.current.level.number === selectedLevel
            ? battleRef.current
            : undefined,
        },
      ));
      rewardedRef.current = false;
    },
    [commitBattle, commitProgression],
  );

  const navigate = useCallback(
    (nextView: GameView) => {
      const progress = progressionRef.current;
      if (nextView === "adventure" && !adventureTabUnlocked(progress)) return;
      if (nextView === "training" && !trainingTabUnlocked(progress)) return;
      if (nextView === "shop" && !shopTabUnlocked(progress)) return;
      if (nextView === "fishing" && !fishingTabUnlocked(progressionRef.current)) {
        return;
      }
      if (nextView === "mining" && !progress.miningUnlocked) return;
      if (nextView === "bestiary" && !progress.completedRaids.includes(7)) return;
      if (nextView === "crafting" && !progress.craftingUnlocked) return;
      viewRef.current = nextView;
      setView(nextView);
    },
    [],
  );

  const toggleBattleAuto = useCallback(() => {
    const current = progressionRef.current;
    commitProgression({ ...current, battleAutoMode: !current.battleAutoMode });
  }, [commitProgression]);

  const toggleAdventureAuto = useCallback(() => {
    const current = progressionRef.current;
    commitProgression({ ...current, adventureAutoMode: !current.adventureAutoMode });
  }, [commitProgression]);

  const chooseAdventureStrategy = useCallback((strategy: AdventureStrategy) => {
    const session = adventureSessionRef.current;
    const runQuestActive = Boolean(session?.order.some((id) => session.explorers[id]?.cartographerQuestActive));
    commitProgression(setAdventureStrategy(progressionRef.current, strategy, runQuestActive));
    if (session) {
      commitAdventureSession({
        ...session,
        headingByMember: createAdventureHeadings(session.order, strategy),
      });
    }
  }, [commitAdventureSession, commitProgression]);

  const chooseAdventureTargetRing = useCallback((ring: number) => {
    commitProgression(setAdventureTargetRing(progressionRef.current, ring));
  }, [commitProgression]);

  const chooseAdventureRouteTarget = useCallback((roomKey: string) => {
    const session = adventureSessionRef.current;
    if (!session) return;
    const targetExists = roomKey === "" || session.order.some((id) =>
      Boolean(session.explorers[id]?.rooms[roomKey]),
    );
    if (!targetExists) return;
    commitAdventureSession({
      ...session,
      routeTargetRoomKey: roomKey || null,
    });
  }, [commitAdventureSession]);

  const toggleAdventureMember = useCallback((memberId: PlayerId, selected: boolean) => {
    if (selected && battleReservedPlayerIds(battleRef.current).includes(memberId)) {
      showToast(`${getPlayer(memberId).name} is already in Battle. You only have one of them!`);
      return;
    }
    if (selected && progressionRef.current.fishingAssignment?.memberId === memberId) {
      showToast(`${getPlayer(memberId).name} is already Fishing. Put the rod down first!`);
      return;
    }
    if (selected && miningMemberIds(
      miningStateRef.current,
      pendingMiningRestartMemberIdRef.current,
    ).includes(memberId)) {
      showToast(`${getPlayer(memberId).name} is already Mining. You can't swing a Pickaxe from two rooms at once.`);
      return;
    }
    commitProgression(setAdventureMemberSelected(progressionRef.current, memberId, selected));
  }, [commitProgression, showToast]);

  const toggleAdventureRestart = useCallback((enabled: boolean) => {
    commitProgression(setRestartAdventureOnFullHp(progressionRef.current, enabled));
  }, [commitProgression]);

  const toggleAdventureIgnoreGold = useCallback((enabled: boolean) => {
    commitProgression(setAdventureIgnoreGold(progressionRef.current, enabled));
  }, [commitProgression]);

  const focusAdventureMember = useCallback((memberId: PlayerId) => {
    const session = adventureSessionRef.current;
    if (!session?.explorers[memberId]) return;
    commitAdventureSession({ ...session, focusedMemberId: memberId });
  }, [commitAdventureSession]);

  const handleBattleTile = useCallback(
    (position: Position, input: "primary" | "secondary" = "primary") => {
      const currentBattle = battleRef.current;
      if (currentBattle.status === "deploying") {
        if (input === "secondary") return;
        const occupant = unitAt(currentBattle, position);
        const selected = currentBattle.units.find((unit) => unit.id === currentBattle.deploymentUnitId);
        const selectedId = selected?.definitionId as PlayerId | undefined;
        if (
          !occupant
          && selectedId
          && memberAssignedOutsideBattle(
            selectedId,
            progressionRef.current,
            adventureSessionRef.current,
            miningStateRef.current,
            pendingMiningRestartMemberIdRef.current,
          )
        ) {
          showToast(`${getPlayer(selectedId).name} is busy somewhere else. One person, one horrible activity at a time.`);
          return;
        }
        const result = occupant?.team === "player"
          ? selectDeploymentUnit(currentBattle, occupant.id)
          : deployPlayerUnit(currentBattle, position);
        if (!result.ok) showToast(result.error);
        else commitBattle(result.state);
        return;
      }
      const actor = activeUnit(currentBattle);
      if (
        !actor ||
        actor.team !== "player" ||
        progressionRef.current.battleAutoMode ||
        currentBattle.status !== "fighting"
      ) {
        return;
      }
      const occupant = unitAt(currentBattle, position);
      const action = manualCombatAction(currentBattle, position, input);
      if (action) return executeBattleAction(action);
      if (input === "secondary") {
        showToast(occupant?.team === "enemy"
          ? `${actor.name} has no secondary weapon attack available for that target.`
          : "Right-click an enemy to use the equipped weapon's secondary attack.");
      } else if (occupant?.team === "enemy") {
        showToast(`${actor.name} cannot reach that enemy. Move closer! Your sword is not THAT long.`);
      } else {
        showToast("Move to one of the four highlighted tiles. Diagonal movement exceeded the current movement budget.");
      }
    },
    [commitBattle, executeBattleAction, showToast],
  );

  const handleSelectDeploymentUnit = useCallback((unitId: string) => {
    const unit = battleRef.current.units.find((candidate) => candidate.id === unitId);
    if (unit && unit.position.x >= 0) {
      const result = undeployPlayerUnit(battleRef.current, unitId);
      if (!result.ok) showToast(result.error);
      else commitBattle(result.state);
      return;
    }
    const memberId = unit?.definitionId as PlayerId | undefined;
    if (
      memberId
      && memberAssignedOutsideBattle(
        memberId,
        progressionRef.current,
        adventureSessionRef.current,
        miningStateRef.current,
        pendingMiningRestartMemberIdRef.current,
      )
    ) {
      showToast(`${getPlayer(memberId).name} is already doing something else. Stop trying to duplicate people.`);
      return;
    }
    const result = selectDeploymentUnit(battleRef.current, unitId);
    if (!result.ok) showToast(result.error);
    else commitBattle(result.state);
  }, [commitBattle, showToast]);

  const handleStartRaid = useCallback(() => {
    const conflicting = battleReservedPlayerIds(battleRef.current)
      .find((id) => memberAssignedOutsideBattle(
        id,
        progressionRef.current,
        adventureSessionRef.current,
        miningStateRef.current,
        pendingMiningRestartMemberIdRef.current,
      ));
    if (conflicting) {
      showToast(`${getPlayer(conflicting).name} is busy somewhere else. Bring them back before starting the murder.`);
      return;
    }
    const result = startRaid(battleRef.current);
    if (!result.ok) showToast(result.error);
    else commitBattle(result.state);
  }, [commitBattle, showToast]);

  const handleAdventureMove = useCallback(
    (
      position: Position,
      automatic = false,
      memberId?: PlayerId,
      attackMode: "automatic" | "basic" | "secondary" = automatic ? "automatic" : "basic",
    ) => {
      const session = adventureSessionRef.current;
      const progress = progressionRef.current;
      const explorerId = memberId ?? session?.focusedMemberId;
      const currentAdventure = explorerId ? session?.explorers[explorerId] : null;
      if (
        conversationActiveRef.current
        || !session
        || !explorerId
        || !currentAdventure
        || (progress.adventureAutoMode && !automatic)
      ) return;
      const memberProgress = getPartyMember(progress, explorerId);
      const hasTrident = memberHasTrident(progress, explorerId);
      const result = moveInAdventure(
        currentAdventure,
        position,
        adventureMemberStats(progress, session, explorerId),
        memberProgress.hp,
        memberProgress.stamina,
        Math.random,
        otherAdventureExplorerPositions(session, explorerId),
        progress.weaponThrowUnlocked && hasTrident,
        hasTrident,
        memberHasShamanRing(progress, explorerId),
        memberWeaponAbility(progress, explorerId),
        !progress.completedQuestIds.includes("enter-tower"),
        progress.towerKeyOwned,
        attackMode,
      );
      if (result.error) {
        // A stale target can occur when another explorer changes the shared
        // room between suggestion and execution. Manual input should still
        // report the error, but auto must always advance the clock or the
        // unchanged session will never schedule another tick.
        if (automatic && isAdventurePlayerTurn(currentAdventure)) {
          const recovered = passAdventureTurn(
            currentAdventure,
            adventureMemberStats(progress, session, explorerId),
          );
          commitAdventureSession(updateAdventureSession(session, explorerId, recovered));
          return;
        }
        showToast(result.error);
        return;
      }
      let nextProgress = setMemberHp(progress, explorerId, result.hp);
      nextProgress = setMemberStamina(nextProgress, explorerId, result.stamina);
      nextProgress = setMemberStaminaActions(
        nextProgress,
        explorerId,
        result.state.staminaActionProgress,
      );
      const carriedGold = session.carriedGold.add(result.goldGained);
      const sessionWithGold = carriedGold.eq(session.carriedGold)
        ? session
        : {
            ...session,
            carriedGold,
            carriedGoldByMember: {
              ...session.carriedGoldByMember,
              [explorerId]: (session.carriedGoldByMember?.[explorerId] ?? new Decimal(0)).add(result.goldGained),
            },
          };
      if (result.state.dungeonTheme !== "water") {
        nextProgress = recordAdventureRingVisit(
          nextProgress,
          currentAdventureRoom(result.state).ring,
        );
      }
      const sourceRoom = currentAdventureRoom(currentAdventure);
      const destinationRoom = currentAdventureRoom(result.state);
      const specialRoom = destinationRoom.kind === "blacksmith"
        || destinationRoom.kind === "potionmaster"
        || destinationRoom.kind === "oddityBrewer"
        || destinationRoom.kind === "cartographer"
        || destinationRoom.kind === "angler"
        || destinationRoom.kind === "towerExterior"
        ? destinationRoom.kind
        : null;
      if (specialRoom) {
        nextProgress = discoverAdventureSpecialRoom(nextProgress, specialRoom);
      }
      const pausedForOffering = nextProgress.adventureAutoMode
        && shouldPauseAutoForOfferingEntry(sourceRoom, destinationRoom);
      const pausedForSpecialRoom = nextProgress.adventureAutoMode
        && result.exploredNewRoom
        && specialRoom !== null
        && nextProgress.autoPauseAdventureRooms.includes(specialRoom);
      if (pausedForOffering || pausedForSpecialRoom) {
        nextProgress = { ...nextProgress, adventureAutoMode: false };
      }
      let discardedLoot: string | null = null;
      if (result.gearFound) {
        const alreadyOwned = nextProgress.inventory.some((item) => item.id === result.gearFound?.id);
        const addition = tryAddGear(nextProgress, result.gearFound);
        nextProgress = addition.state;
        if (!addition.added && !alreadyOwned) discardedLoot = result.gearFound.name;
      }
      if (result.potionFound) {
        const addition = addPotion(nextProgress, result.potionFound);
        nextProgress = addition.state;
        if (addition.added === 0) discardedLoot = POTION_META[result.potionFound].name;
      }
      if (result.defeatedEnemyId) {
        nextProgress = recordEnemyDefeats(nextProgress, [result.defeatedEnemyId]);
      }
      if (result.completedTridentTrial) {
        const alreadyOwned = nextProgress.inventory.some((item) => item.definitionId === "trident");
        nextProgress = completeTridentTrial(nextProgress);
        if (!alreadyOwned && !nextProgress.inventory.some((item) => item.definitionId === "trident")) {
          discardedLoot = "Tidecaller Trident";
        }
      }
      if (result.materialGained) {
        const before = nextProgress.materials[result.materialGained];
        nextProgress = addMaterial(nextProgress, result.materialGained);
        if (nextProgress.materials[result.materialGained] === before) {
          discardedLoot = MATERIAL_META[result.materialGained].name;
        }
      }
      if (result.unlockedShopkeeper) nextProgress = unlockShopkeeper(nextProgress);
      if (result.unlockedBlacksmith) nextProgress = discoverBlacksmith(nextProgress);
      if (result.discoveredTowerDoor) nextProgress = discoverTowerDoor(nextProgress);
      if (result.unlockedGreatTower) nextProgress = unlockGreatTower(nextProgress);
      if (result.recoveredHammer) nextProgress = recoverBlacksmithHammer(nextProgress);
      if (result.returnedHammer) nextProgress = returnBlacksmithHammer(nextProgress);
      if (result.recoveredForgeBlueprints) nextProgress = recoverForgeBlueprints(nextProgress);
      if (result.completedCartographerSurvey) nextProgress = completeCartographerQuest(nextProgress);
      if (result.completedQuestId) {
        nextProgress = completeQuest(nextProgress, result.completedQuestId);
        nextProgress = setRestartAdventureOnFullHp(nextProgress, false);
      }
      const cachedPortalSession = result.enteredPortalType
        ? sessionWithGold.portalSessions?.[result.enteredPortalType]
        : null;
      if (result.enteredPortalType === "water" && !cachedPortalSession) {
        nextProgress = recordWaterDungeonVisit(nextProgress);
      }
      if (result.enteredPortalType === "forge" && !cachedPortalSession) {
        nextProgress = recordForgeDungeonVisit(nextProgress);
      }
      const memberName = getPlayer(explorerId).name;
      if (result.unlockedGreatTower) {
        const settlement = settleAdventureGold(nextProgress, carriedGold, true);
        commitProgression(settlement.state);
        commitAdventureSession(null);
        return;
      } else if (result.completedQuestId) {
        const completedQuestId = result.completedQuestId;
        const finishQuest = () => {
          const failedHammer = nextProgress.hammerQuestAttemptActive && !nextProgress.hammerReturned;
          const settledProgress = failHammerQuestAttempt(nextProgress);
          const settlement = settleAdventureGold(settledProgress, carriedGold, true);
          commitProgression(settlement.state);
          commitAdventureSession(null);
          const banked = settlement.banked.gt(0) ? ` Banked ${formatWholeAmount(settlement.banked)} carried gold. You even kept most of it!` : "";
          showToast((completedQuestId === "rescue-me"
            ? "Rescue Me complete! Worm joined the party. You have a Worm now!"
            : completedQuestId === "retrieve-lost-item"
              ? "Retrieve Lost Item complete! Fishing unlocked. Numbers can go up while you stare at water now."
              : completedQuestId === "find-miner"
                ? "Find the Miner complete! Miner joined the party and Mining unlocked. Go hit some rocks!"
                : "Quest complete! Whatever was blinking in the Quest log can stop now.") + banked
                + (failedHammer ? " Retrieve Hammer failed. The Hammer is gone again!" : ""));
        };
        const questConversation: ConversationId | null = completedQuestId === "rescue-shopkeeper"
          ? "shopkeeper-rescued"
          : completedQuestId === "retrieve-lost-item"
            ? "fishing-rod-recovered"
          : completedQuestId === "rescue-me"
            ? "worm-rescued"
            : completedQuestId === "find-miner"
              ? "miner-recruited"
              : null;
        if (questConversation) startConversation(questConversation, finishQuest);
        else finishQuest();
      } else if (result.died) {
        const unlockedTraining = !nextProgress.partyTrainingUnlocked;
        nextProgress = recordAdventureDeath(nextProgress);
        const penalty = penalizeAdventureGold(sessionWithGold, explorerId, 0.3);
        const nextSession = updateAdventureSession(penalty.session, explorerId, null);
        const lostHammerAttempt = currentAdventure.questTarget?.questId === "retrieve-hammer"
          || Boolean(currentAdventure.hammerRecovered);
        if (!nextSession) {
          const failedHammer = nextProgress.hammerQuestAttemptActive && !nextProgress.hammerReturned;
          nextProgress = failHammerQuestAttempt(nextProgress);
          const settlement = settleAdventureGold(nextProgress, penalty.session.carriedGold, true);
          commitProgression(settlement.state);
          commitAdventureSession(null);
          showToast(`${memberName} died! Lost ${formatWholeAmount(penalty.lost)} of their gold and banked ${formatWholeAmount(settlement.banked)}.${unlockedTraining ? " Training unlocked! Dying builds character." : ""}${failedHammer ? " Retrieve Hammer failed." : ""}`);
        } else {
          if (lostHammerAttempt) nextProgress = failHammerQuestAttempt(nextProgress);
          commitProgression(nextProgress);
          commitAdventureSession(nextSession);
          showToast(`${memberName} died and lost ${formatWholeAmount(penalty.lost)} of their gold. The other explorers kept theirs.${unlockedTraining ? " Training unlocked! Dying builds character." : ""}${lostHammerAttempt ? " Retrieve Hammer failed." : ""}`);
        }
      } else if (result.exhausted) {
        const penalty = penalizeAdventureGold(sessionWithGold, explorerId, 0.2);
        const nextSession = updateAdventureSession(penalty.session, explorerId, null);
        const lostHammerAttempt = currentAdventure.questTarget?.questId === "retrieve-hammer"
          || Boolean(currentAdventure.hammerRecovered);
        if (!nextSession) {
          const failedHammer = nextProgress.hammerQuestAttemptActive && !nextProgress.hammerReturned;
          nextProgress = failHammerQuestAttempt(nextProgress);
          const settlement = settleAdventureGold(nextProgress, penalty.session.carriedGold, true);
          commitProgression(settlement.state);
          commitAdventureSession(null);
          showToast(`${memberName} ran out of stamina! Lost ${formatWholeAmount(penalty.lost)} of their gold and banked ${formatWholeAmount(settlement.banked)}.${failedHammer ? " Retrieve Hammer failed." : ""}`);
        } else {
          if (lostHammerAttempt) nextProgress = failHammerQuestAttempt(nextProgress);
          commitProgression(nextProgress);
          commitAdventureSession(nextSession);
          showToast(`${memberName} ran out of stamina and lost ${formatWholeAmount(penalty.lost)} of their gold. The other explorers kept theirs.${lostHammerAttempt ? " Retrieve Hammer failed." : ""}`);
        }
      } else {
        commitProgression(nextProgress);
        let nextSession = updateAdventureSession(sessionWithGold, explorerId, result.state);
        if (nextSession && destinationRoom.kind === "forgeArena") {
          if (result.forgeArenaStarted || result.forgeArenaCleared) {
            nextSession = refreshAdventureRoomTimelines(
              { ...nextSession, forgeRallyRoomKey: null },
              destinationRoom.key,
              nextProgress,
            );
          } else if (!destinationRoom.forgeArenaResolved) {
            nextSession = { ...nextSession, forgeRallyRoomKey: destinationRoom.key };
          }
        }
        if (nextSession?.diceCurse) {
          nextSession = advanceSessionDiceCurse(nextSession, nextProgress);
        }
        if (nextSession && (result.completedTridentTrial || result.recoveredForgeBlueprints)) {
          nextSession = {
            ...nextSession,
            routeTargetRoomKey: "0,0",
            forgeRallyRoomKey: null,
            returnToDungeonPortal: true,
          };
        }
        if (result.returnedPortalType && nextSession?.returnSession) {
          const parentWithPortalCache = cachePortalDungeonSession(
            nextSession.returnSession,
            result.returnedPortalType,
            nextSession,
          );
          const restored = restoreMainDungeonSession(
            parentWithPortalCache,
            nextSession.order,
            nextProgress,
            nextSession.carriedGold,
            nextSession.diceCurse,
          );
          commitAdventureSession(restored);
          showToast(`The expedition returned from ${result.returnedPortalType === "forge" ? "The Forge" : "the Water Dungeon"}. Count your fingers before moving on.`);
          return;
        }
        if (result.enteredPortalType === "water" && nextSession) {
          const cached = nextSession.portalSessions?.water;
          commitAdventureSession(cached
            ? restorePortalDungeonSession(cached, nextSession, nextProgress)
            : createWaterAdventureSession(
                nextSession.order,
                nextProgress,
                nextSession.carriedGold,
                nextSession.diceCurse,
                nextSession,
              ));
          showToast("Entered the Water Dungeon! Your socks are ruined immediately.");
          return;
        }
        if (result.enteredPortalType === "forge" && nextSession) {
          const cached = nextSession.portalSessions?.forge;
          commitAdventureSession(cached
            ? restorePortalDungeonSession(cached, nextSession, nextProgress)
            : createForgeAdventureSession(
                nextSession.order,
                nextProgress,
                nextSession.carriedGold,
                nextSession.diceCurse,
                nextSession,
              ));
          showToast("Entered The Forge! Do not touch anything. This includes the air.");
          return;
        }
        if (
          nextSession
          && nextProgress.activeQuestId === "retrieve-lost-item"
          && allExplorersOnPortal(nextSession)
        ) {
          const cached = nextSession.portalSessions?.water;
          const waterProgress = cached ? nextProgress : recordWaterDungeonVisit(nextProgress);
          commitProgression(waterProgress);
          commitAdventureSession(cached
            ? restorePortalDungeonSession(cached, nextSession, waterProgress)
            : createWaterAdventureSession(
                nextSession.order,
                waterProgress,
                nextSession.carriedGold,
                nextSession.diceCurse,
                nextSession,
              ));
          showToast("Everybody is on the teleport! Entered the Water Dungeon with roughly the correct number of limbs.");
          return;
        }
        commitAdventureSession(discardedLoot && nextSession
          ? updateAdventureSession(nextSession, explorerId, {
              ...result.state,
              log: [
                `${discardedLoot} was discarded because the backpack or item stack is full.`,
                ...result.state.log.filter((entry) => !entry.includes(discardedLoot)),
              ],
            })
          : nextSession);
        if (pausedForOffering) {
          showToast("Offering chamber found! Auto paused so you don't feed the wrong fish to the floor.");
        } else if (discardedLoot) {
          showToast(`${discardedLoot} was discarded because the backpack or stack is full. Make more room, hoarder!`);
        } else if (result.completedTridentTrial) {
          showToast("Tidecaller Trident obtained! Right-click an enemy to throw your brand new pointy stick.");
        } else if (result.materialGained) {
          showToast(`Collected ${MATERIAL_META[result.materialGained].name}. Pick up the squishy end.`);
        } else if (result.returnedHammer) {
          startConversation("blacksmith-hammer-returned");
        } else if (result.recoveredHammer) {
          showToast("Recovered the Blacksmith's Hammer! Return it during this expedition or it disappears again. Don't ask.");
        } else if (result.unlockedBlacksmith && !progress.blacksmithDiscovered) {
          startConversation("blacksmith-met");
        } else if (result.completedCartographerSurvey) {
          startConversation("cartographer-complete");
        }
      }
    },
    [commitAdventureSession, commitProgression, showToast, startConversation],
  );

  const handleAdventureSecondaryAttack = useCallback((position: Position) => {
    handleAdventureMove(position, false, undefined, "secondary");
  }, [handleAdventureMove]);

  const handleWaterShrineOffering = useCallback((tileStat: StatKey, fishStat: StatKey) => {
    const session = adventureSessionRef.current;
    const memberId = session?.focusedMemberId;
    const explorer = memberId ? session?.explorers[memberId] : null;
    if (!session || !memberId || !explorer || progressionRef.current.adventureAutoMode) return;
    const room = currentAdventureRoom(explorer);
    const tile = room.tiles[explorer.playerPosition.y]?.[explorer.playerPosition.x];
    if (room.kind !== "offering" || tile?.kind !== "offering" || tile.offeringStat !== tileStat) {
      showToast("Stand on a colored offering tile first. The floor will not accept fish from over there.");
      return;
    }
    const requiredStats = [...new Set(room.tiles.flatMap((row) => row.flatMap((roomTile) =>
      roomTile.kind === "offering" && roomTile.offeringStat ? [roomTile.offeringStat] : []
    )))];
    const result = offerFishAtWaterShrine(progressionRef.current, tileStat, fishStat, requiredStats);
    if (result.error && !result.solved) return showToast(result.error);
    commitProgression(result.state);
    if (result.solved) {
      const opened = openOfferingChamber(explorer, memberStats(result.state, memberId));
      commitAdventureSession(updateAdventureSession(session, memberId, opened));
      showToast("Four correct fish open the door! Three angry Mermen come out because nothing can ever be simple.");
    } else {
      showToast(`${FISH_META[fishStat].name} placed on the offering tile. The floor eats it. Ew.`);
    }
  }, [commitAdventureSession, commitProgression, showToast]);

  useEffect(() => {
    if (!progression.waterShrineSolved || progression.tridentTrialCompleted || !adventureSession) return;
    const memberId = adventureSession.order.find((id) => {
      const explorer = adventureSession.explorers[id];
      if (!explorer) return false;
      const room = currentAdventureRoom(explorer);
      return room.kind === "offering" && !room.offeringDoorOpened;
    });
    const explorer = memberId ? adventureSession.explorers[memberId] : null;
    if (!memberId || !explorer) return;
    const opened = openOfferingChamber(explorer, memberStats(progression, memberId));
    commitAdventureSession(updateAdventureSession(adventureSession, memberId, opened));
  }, [adventureSession, commitAdventureSession, progression, progression.tridentTrialCompleted, progression.waterShrineSolved]);

  const toggleAutoPortalType = useCallback((portalType: PortalType, enabled: boolean) => {
    commitProgression(setAutoEnterPortalType(progressionRef.current, portalType, enabled));
  }, [commitProgression]);

  const toggleAdventureAutoPauseRoom = useCallback((
    room: AdventureAutoPauseRoom,
    enabled: boolean,
  ) => {
    commitProgression(setAdventureAutoPauseRoom(progressionRef.current, room, enabled));
  }, [commitProgression]);

  const handleTrain = useCallback(
    (memberId: PlayerId, stat: StatKey) => {
      const result = startTraining(progressionRef.current, memberId, stat);
      if (result.error) {
        showToast(result.error);
        return;
      }
      commitProgression(result.state);
      showToast(`${getPlayer(memberId).name}'s ${STAT_META[stat].label} increased! You shoved Gold into the problem until it got better.`);
    },
    [commitProgression, showToast],
  );

  const handleAdventureEnemyAction = useCallback((memberId?: PlayerId) => {
    if (conversationActiveRef.current) return;
    const session = adventureSessionRef.current;
    const progress = progressionRef.current;
    const explorerId = memberId ?? session?.focusedMemberId;
    const currentAdventure = explorerId ? session?.explorers[explorerId] : null;
    if (!session || !explorerId || !currentAdventure || isAdventurePlayerTurn(currentAdventure)) return;
    const memberProgress = getPartyMember(progress, explorerId);
    const stats = adventureMemberStats(progress, session, explorerId);
    const result = performAdventureEnemyTurn(
      currentAdventure,
      stats,
      memberProgress.hp,
      memberProgress.stamina,
      otherAdventureExplorerPositions(session, explorerId)
        .filter((explorer) => explorer.roomKey === currentAdventure.currentRoomKey)
        .map((explorer) => explorer.position),
      memberHasShamanRing(progress, explorerId),
      Math.random,
      memberHasSuctionCups(progress, explorerId),
      mysteryPotionDodgeChance(progress),
    );
    let nextProgress = setMemberHp(progress, explorerId, result.hp);
    nextProgress = setMemberStamina(nextProgress, explorerId, result.stamina);
    nextProgress = setMemberStaminaActions(
      nextProgress,
      explorerId,
      result.state.staminaActionProgress,
    );
    const memberName = getPlayer(explorerId).name;
    if (result.died) {
      const unlockedTraining = !nextProgress.partyTrainingUnlocked;
      nextProgress = recordAdventureDeath(nextProgress);
      const penalty = penalizeAdventureGold(session, explorerId, 0.3);
      const nextSession = updateAdventureSession(penalty.session, explorerId, null);
      const lostHammerAttempt = currentAdventure.questTarget?.questId === "retrieve-hammer"
        || Boolean(currentAdventure.hammerRecovered);
      if (!nextSession) {
        const failedHammer = nextProgress.hammerQuestAttemptActive && !nextProgress.hammerReturned;
        nextProgress = failHammerQuestAttempt(nextProgress);
        const settlement = settleAdventureGold(nextProgress, penalty.session.carriedGold, true);
        commitProgression(settlement.state);
        commitAdventureSession(null);
        showToast(`${memberName} died! Lost ${formatWholeAmount(penalty.lost)} of their gold and banked ${formatWholeAmount(settlement.banked)}.${unlockedTraining ? " Training unlocked! Dying builds character." : ""}${failedHammer ? " Retrieve Hammer failed." : ""}`);
      } else {
        if (lostHammerAttempt) nextProgress = failHammerQuestAttempt(nextProgress);
        commitProgression(nextProgress);
        commitAdventureSession(nextSession);
        showToast(`${memberName} died and lost ${formatWholeAmount(penalty.lost)} of their gold. The other explorers kept theirs.${unlockedTraining ? " Training unlocked! Dying builds character." : ""}${lostHammerAttempt ? " Retrieve Hammer failed." : ""}`);
      }
    } else if (result.exhausted) {
      const penalty = penalizeAdventureGold(session, explorerId, 0.2);
      const nextSession = updateAdventureSession(penalty.session, explorerId, null);
      const lostHammerAttempt = currentAdventure.questTarget?.questId === "retrieve-hammer"
        || Boolean(currentAdventure.hammerRecovered);
      if (!nextSession) {
        const failedHammer = nextProgress.hammerQuestAttemptActive && !nextProgress.hammerReturned;
        nextProgress = failHammerQuestAttempt(nextProgress);
        const settlement = settleAdventureGold(nextProgress, penalty.session.carriedGold, true);
        commitProgression(settlement.state);
        commitAdventureSession(null);
        showToast(`${memberName} ran out of stamina! Lost ${formatWholeAmount(penalty.lost)} of their gold and banked ${formatWholeAmount(settlement.banked)}.${failedHammer ? " Retrieve Hammer failed." : ""}`);
      } else {
        if (lostHammerAttempt) nextProgress = failHammerQuestAttempt(nextProgress);
        commitProgression(nextProgress);
        commitAdventureSession(nextSession);
        showToast(`${memberName} ran out of stamina and lost ${formatWholeAmount(penalty.lost)} of their gold. The other explorers kept theirs.${lostHammerAttempt ? " Retrieve Hammer failed." : ""}`);
      }
    } else {
      commitProgression(nextProgress);
      commitAdventureSession(updateAdventureSession(session, explorerId, result.state));
    }
  }, [commitAdventureSession, commitProgression, showToast]);

  const handleAdventurePass = useCallback((automatic = false, memberId?: PlayerId) => {
    if (conversationActiveRef.current) return;
    const session = adventureSessionRef.current;
    const progress = progressionRef.current;
    const explorerId = memberId ?? session?.focusedMemberId;
    const currentAdventure = explorerId ? session?.explorers[explorerId] : null;
    if (!session || !explorerId || !currentAdventure || (progress.adventureAutoMode && !automatic)) return;
    if (!isAdventurePlayerTurn(currentAdventure)) {
      if (!automatic) showToast("Wait for the enemy to take its turn. Yes, it gets one too.");
      return;
    }
    const next = passAdventureTurn(
      currentAdventure,
      adventureMemberStats(progress, session, explorerId),
    );
    const nextSession = updateAdventureSession(session, explorerId, next);
    commitAdventureSession(nextSession?.diceCurse
      ? advanceSessionDiceCurse(nextSession, progress)
      : nextSession);
  }, [commitAdventureSession, showToast]);

  const handleEquipGear = useCallback((memberId: PlayerId, itemId: string) => {
    const result = equipGear(progressionRef.current, memberId, itemId);
    if (result.error) {
      showToast(result.error);
      return;
    }
    commitProgression(result.state);
    const item = result.state.inventory.find((candidate) => candidate.id === itemId);
    if (item) showToast(`${item.name} equipped to ${getPlayer(memberId).name}. Perfect fit! Dungeon clothes are creepy like that.`);
  }, [commitProgression, showToast]);

  const handleUnequipGear = useCallback((memberId: PlayerId, slot: GearSlot) => {
    const result = unequipGear(progressionRef.current, memberId, slot);
    if (result.error) return showToast(result.error);
    commitProgression(result.state);
    showToast("Gear unequipped and put back in the backpack. It takes up one square no matter how huge it is.");
  }, [commitProgression, showToast]);

  const handlePurchaseQuest = useCallback((questId: QuestId) => {
    const current = progressionRef.current;
    const result = purchaseQuest(current, questId);
    if (result.error) {
      showToast(result.error);
      return;
    }
    commitProgression(result.state);
    showToast(result.state.activeQuestId === questId && current.activeQuestId !== questId
      ? "Quest purchased and set active! You paid money for extra chores."
      : "Quest purchased! Choose it from the Adventure Quest log when you feel like suffering.");
  }, [commitProgression, showToast]);

  const handleActivateQuest = useCallback((questId: QuestId) => {
    if (adventureSessionRef.current) {
      showToast("Finish the current expedition before changing quests. The dungeon cannot move the marker while you're looking.");
      return;
    }
    const result = activateQuest(progressionRef.current, questId);
    if (result.error) {
      showToast(result.error);
      return;
    }
    commitProgression(result.state);
    showToast(`${getQuest(questId)?.name ?? "Quest"} is now active! Follow the weird marker.`);
  }, [commitProgression, showToast]);

  const handleActivateCartographerQuest = useCallback(() => {
    const session = adventureSessionRef.current;
    if (!session || !session.order.some((id) => (session.explorers[id]?.cartographerSurveyTargets?.length ?? 0) > 0)) {
      showToast("Find the Cartographer and accept the survey first. Standing on random spots does not count!");
      return;
    }
    const explorers = { ...session.explorers };
    for (const id of session.order) {
      const explorer = explorers[id];
      if (explorer) explorers[id] = { ...explorer, cartographerQuestActive: true };
    }
    commitProgression(setAdventureStrategy(progressionRef.current, "quest", true));
    commitAdventureSession({
      ...session,
      explorers,
      headingByMember: createAdventureHeadings(session.order, "quest"),
    });
  }, [commitAdventureSession, commitProgression, showToast]);

  const handlePurchasePotion = useCallback((potionId: PotionId) => {
    const result = purchasePotion(progressionRef.current, potionId);
    if (result.error) return showToast(result.error);
    commitProgression(result.state);
    showToast(`${POTION_META[potionId].name} purchased! Try not to confuse it with normal drinking liquid.`);
  }, [commitProgression, showToast]);

  const handlePurchaseUndeadGem = useCallback(() => {
    const result = purchaseUndeadGem(progressionRef.current);
    if (result.error) return showToast(result.error);
    commitProgression(result.state);
    showToast("Undead Gem purchased! Equip it in an accessory slot before fighting the Skele-King.");
  }, [commitProgression, showToast]);

  const handlePurchaseEscapeRope = useCallback((level: EscapeRopeLevel) => {
    const result = purchaseEscapeRope(progressionRef.current, level);
    if (result.error) return showToast(result.error);
    commitProgression(result.state);
    showToast(`Level ${level} Escape Rope purchased! Even running away has levels now.`);
  }, [commitProgression, showToast]);

  const handlePurchaseInventorySlots = useCallback(() => {
    const result = purchaseInventorySlots(progressionRef.current);
    if (result.error) return showToast(result.error);
    commitProgression(result.state);
    showToast("Backpack expanded by 2 slots! It is not physically any bigger. Magic, probably.");
  }, [commitProgression, showToast]);

  const handlePurchaseInventoryStackSize = useCallback(() => {
    const result = purchaseInventoryStackSize(progressionRef.current);
    if (result.error) return showToast(result.error);
    commitProgression(result.state);
    showToast("Every item stack expanded by 100! Put more junk on top of the old junk.");
  }, [commitProgression, showToast]);

  const handlePurchaseHammerQuest = useCallback(() => {
    const result = purchaseHammerQuest(progressionRef.current);
    if (result.error) return showToast(result.error);
    commitProgression(result.state);
    const session = adventureSessionRef.current;
    if (session) {
      const explorers = Object.fromEntries(Object.entries(session.explorers).map(([id, explorer]) => [
        id,
        explorer ? { ...explorer, hammerQuestPurchased: true } : explorer,
      ])) as AdventureSession["explorers"];
      commitAdventureSession({ ...session, explorers });
    }
    showToast("Hammer quest purchased! Accept it from the Quest log while visiting the Blacksmith. Yes, there are TWO steps.");
  }, [commitAdventureSession, commitProgression, showToast]);

  const handleActivateHammerQuest = useCallback(() => {
    const session = adventureSessionRef.current;
    const memberId = session?.focusedMemberId;
    const explorer = memberId ? session?.explorers[memberId] : null;
    if (!session || !memberId || !explorer) {
      showToast("Visit the Blacksmith during an expedition to activate this quest. He wants to complain in person.");
      return;
    }
    const result = activateHammerQuestAtBlacksmith(explorer, Math.random);
    if (result.error) {
      showToast(result.error);
      return;
    }
    commitProgression(beginHammerQuestAttempt(progressionRef.current));
    commitAdventureSession(updateAdventureSession(session, memberId, result.state));
    showToast("Retrieve Hammer accepted! The vault is marked 5–10 rooms away in the Clay Catacombs. Start walking.");
  }, [commitAdventureSession, commitProgression, showToast]);

  const handlePurchaseBlacksmithPotion = useCallback(() => {
    const result = purchaseBlacksmithHealingPotion(progressionRef.current);
    if (result.error) return showToast(result.error);
    commitProgression(result.state);
    showToast("Blacksmith Healing Potion purchased! Contains 200 HP and one small piece of metal you should spit out.");
  }, [commitProgression, showToast]);

  const handleCompletePotionmasterQuest = useCallback(() => {
    const result = completePotionmasterQuest(progressionRef.current, Math.random);
    if (result.error) return showToast(result.error);
    commitProgression(result.state);
    const discarded = result.discarded > 0
      ? ` ${result.discarded} reward item${result.discarded === 1 ? " was" : "s were"} discarded because inventory was full.`
      : "";
    if (discarded) showToast(discarded.trim());
    startConversation("potionmaster-complete");
  }, [commitProgression, showToast, startConversation]);

  const handleCompleteOddityBrewerExchange = useCallback(() => {
    const result = completeOddityBrewerExchange(progressionRef.current);
    if (result.error) return showToast(result.error);
    commitProgression(result.state);
    startConversation("charles-complete");
  }, [commitProgression, showToast, startConversation]);

  const handleDeliverAnglerMaterials = useCallback(() => {
    const result = deliverAnglerMaterials(progressionRef.current, Math.random);
    if (result.error) return showToast(result.error);
    commitProgression(result.state);
    const requested = result.state.anglerRequestedFish;
    if (requested) startConversation("angler-request");
    else showToast("The Angler accepted the bait! Now he wants one very specific fish. Of course he does.");
  }, [commitProgression, showToast, startConversation]);

  const handleDeliverAnglerFish = useCallback(() => {
    const result = completeAnglerRequest(progressionRef.current);
    if (result.error) return showToast(result.error);
    commitProgression(result.state);
    startConversation("angler-complete");
  }, [commitProgression, showToast, startConversation]);

  const handlePurchasePickaxe = useCallback(() => {
    const result = purchasePickaxe(progressionRef.current);
    if (result.error) return showToast(result.error);
    commitProgression(result.state);
    const session = adventureSessionRef.current;
    const memberId = session?.focusedMemberId;
    const explorer = memberId ? session?.explorers[memberId] : null;
    if (session && memberId && explorer && result.state.activeQuestId === "find-miner") {
      const activated = activateMinerQuestAtBlacksmith(explorer, Math.random);
      if (!activated.error) {
        commitAdventureSession(updateAdventureSession(session, memberId, activated.state));
        showToast("Pickaxe purchased! The Miner's cave is marked in the Clay Catacombs. Bring him his pointy rock-hitter.");
        return;
      }
    }
    showToast("Pickaxe purchased! Find the Miner next expedition and make him stop using his forehead.");
  }, [commitAdventureSession, commitProgression, showToast]);

  const handleDeliverForgeBlueprints = useCallback(() => {
    const next = deliverForgeBlueprints(progressionRef.current);
    if (next === progressionRef.current) return showToast("The Blacksmith needs the Blueprints first. He tried guessing the measurements and made a very small table.");
    commitProgression(next);
    startConversation("forge-blueprints-delivered");
  }, [commitProgression, showToast, startConversation]);

  const handlePurchaseCraftingTable = useCallback(() => {
    const result = purchaseCraftingTable(progressionRef.current);
    if (result.error) return showToast(result.error);
    commitProgression(result.state);
    showToast("Crafting Table purchased! Crafting unlocked. Put junk in sixteen squares and hope it becomes hat-shaped.");
  }, [commitProgression, showToast]);

  const handleCraft = useCallback((grid: CraftingGrid) => {
    const result = craftItem(progressionRef.current, grid);
    if (!result.error && result.state !== progressionRef.current) commitProgression(result.state);
    return result;
  }, [commitProgression]);

  const handleAcknowledgeShopCategory = useCallback((category: "quests" | "potions") => {
    commitProgression(markShopUnlocksSeen(progressionRef.current, category));
  }, [commitProgression]);

  const handleUseBlacksmithPotion = useCallback((memberId: PlayerId) => {
    if (!adventureSessionRef.current?.explorers[memberId]) {
      showToast("This potion only works on someone in Adventure. Apparently the bottle knows where it is.");
      return;
    }
    const result = useBlacksmithHealingPotion(progressionRef.current, memberId);
    if (result.error) return showToast(result.error);
    commitProgression(result.state);
    showToast(`${getPlayer(memberId).name} recovered 200 HP! The empty bottle smells like hot cherries.`);
  }, [commitProgression, showToast]);

  const handleUseMapmakerChalk = useCallback((memberId: PlayerId) => {
    const session = adventureSessionRef.current;
    const explorer = session?.explorers[memberId];
    if (!session || !explorer) {
      showToast("Mapmaker's Chalk only works on someone in Adventure. You can't map the dungeon from the Party tab!");
      return;
    }
    const consumed = consumeMapmakerChalk(progressionRef.current);
    if (consumed.error) return showToast(consumed.error);
    commitProgression(consumed.state);
    commitAdventureSession(updateAdventureSession(session, memberId, revealChalkArea(explorer)));
    showToast(`${getPlayer(memberId).name} revealed a 5×5 map area! Chalk is faster than exploring.`);
  }, [commitAdventureSession, commitProgression, showToast]);

  const handleConsumePotion = useCallback((potionId: PotionId) => {
    const result = consumePotion(progressionRef.current, potionId);
    if (result.error) return showToast(result.error);
    commitProgression(clampPartyVitals(result.state));
    showToast(result.mysteryEffect
      ? `Mystery Potion drank! ${mysteryPotionEffectDescription(result.mysteryEffect)}. It tastes like every color at once.`
      : `${POTION_META[potionId].name} active for 30 minutes! Your stomach glows faintly.`);
  }, [commitProgression, showToast]);

  const handleSellMaterial = useCallback((materialId: MaterialId, amount: number) => {
    const result = sellMaterial(progressionRef.current, materialId, amount);
    if (result.error) return showToast(result.error);
    commitProgression(result.state);
  }, [commitProgression, showToast]);

  const handleSellFish = useCallback((stat: StatKey, amount: number) => {
    const result = sellFish(progressionRef.current, stat, amount);
    if (result.error) return showToast(result.error);
    commitProgression(result.state);
  }, [commitProgression, showToast]);

  const handleSellGear = useCallback((itemId: string) => {
    const result = sellGear(progressionRef.current, itemId);
    if (result.error) return showToast(result.error);
    commitProgression(result.state);
  }, [commitProgression, showToast]);

  const handleFeedFish = useCallback((memberId: PlayerId, stat: StatKey) => {
    const result = feedFish(progressionRef.current, memberId, stat);
    if (result.error) return showToast(result.error);
    commitProgression(result.state);
    showToast(`${getPlayer(memberId).name} ate the fish and permanently gained 3 ${STAT_META[stat].label}! Swallow the bones too.`);
  }, [commitProgression, showToast]);

  const handleStartFishing = useCallback((memberId: PlayerId, baitId: MaterialId, mode: "manual" | "auto") => {
    const session = adventureSessionRef.current;
    if (session?.explorers[memberId]) {
      showToast(`${getPlayer(memberId).name} must leave Adventure before Fishing. The dungeon has no good fishing chairs.`);
      return;
    }
    if (battleReservedPlayerIds(battleRef.current).includes(memberId)) {
      showToast(`${getPlayer(memberId).name} must finish Battle before Fishing. The enemy will not wait THAT long.`);
      return;
    }
    if (miningMemberIds(
      miningStateRef.current,
      pendingMiningRestartMemberIdRef.current,
    ).includes(memberId)) {
      showToast(`${getPlayer(memberId).name} must stop Mining before Fishing. Put down the Pickaxe before holding the Rod.`);
      return;
    }
    const result = startFishing(progressionRef.current, memberId, baitId, mode);
    if (result.error) return showToast(result.error);
    commitProgression(result.state);
    showToast(`${getPlayer(memberId).name} started ${mode === "auto" ? "auto Fishing" : "Fishing with one bait"}. Stare at the water until a number happens!`);
  }, [commitProgression, showToast]);

  const handleStopFishing = useCallback(() => {
    commitProgression(stopFishing(progressionRef.current));
    showToast("Fishing stopped. The active bait fell off the hook and is gone forever. Fish probably ate it while you weren't looking.");
  }, [commitProgression, showToast]);

  const handleChooseFavoredFish = useCallback((stat: StatKey | null) => {
    commitProgression(setFavoredFishStat(progressionRef.current, stat));
  }, [commitProgression]);

  const applyMiningResult = useCallback((result: MiningResult) => {
    const memberId = result.state.memberId;
    let nextProgress = setMemberHp(progressionRef.current, memberId, result.hp);
    nextProgress = setMemberStamina(nextProgress, memberId, result.stamina);
    if (result.goldGained.gt(0)) nextProgress = addGold(nextProgress, result.goldGained);
    if (result.defeatedEnemyId) {
      nextProgress = recordEnemyDefeats(nextProgress, [result.defeatedEnemyId]);
    }
    if (result.roomAdvanced) {
      nextProgress = recordMiningRoomReached(nextProgress, result.state.roomNumber);
    }
    commitProgression(nextProgress);
    if (!result.died && !result.exhausted) {
      commitMiningState(result.state);
      return;
    }
    if (nextProgress.restartMiningOnFullHp) commitPendingMiningRestart(memberId);
    else commitPendingMiningRestart(null);
    commitMiningState(null);
    showToast(result.depthLimitReached
      ? `${getPlayer(memberId).name} reached Mining Room 10 and returned exhausted. The next tunnel is blocked by Chapter 2-shaped rocks.`
      : result.died
        ? `${getPlayer(memberId).name} was defeated in Mining and respawned with 10% HP. Never trust a rock with a health bar.`
        : `${getPlayer(memberId).name} ran out of stamina and left the mine. The rocks remain smug.`);
  }, [commitMiningState, commitPendingMiningRestart, commitProgression, showToast]);

  const handleChooseMiningMember = useCallback((memberId: PlayerId) => {
    commitProgression(setMiningMember(progressionRef.current, memberId));
  }, [commitProgression]);

  const handleStartMining = useCallback((memberId: PlayerId) => {
    const current = progressionRef.current;
    if (!current.miningUnlocked || !current.pickaxeOwned) {
      showToast("You need a Pickaxe and the Miner to begin Mining. Bare hands only make the rocks laugh.");
      return;
    }
    if (!current.party[memberId]) {
      showToast("That party member has not joined yet. You cannot send imaginary friends into the mine.");
      return;
    }
    if (adventureSessionRef.current?.explorers[memberId]) {
      showToast(`${getPlayer(memberId).name} must leave Adventure before Mining. They are already in one dark hole.`);
      return;
    }
    if (battleReservedPlayerIds(battleRef.current).includes(memberId)) {
      showToast(`${getPlayer(memberId).name} must finish Battle before Mining. Kill first, rocks second.`);
      return;
    }
    if (current.fishingAssignment?.memberId === memberId) {
      showToast(`${getPlayer(memberId).name} must stop Fishing before Mining. Rod down, Pickaxe up.`);
      return;
    }
    if (getPartyMember(current, memberId).stamina.lte(0)) {
      showToast(`${getPlayer(memberId).name} needs stamina before Mining. Those rocks are not going to hit themselves.`);
      return;
    }
    if (miningStateRef.current || pendingMiningRestartMemberIdRef.current) {
      showToast("Only one party member can Mine at a time. There is only one Pickaxe. Stop trying to share it.");
      return;
    }
    const selected = setMiningMember(current, memberId);
    const next = recordMiningRoomReached(selected, 1);
    commitProgression(next);
    commitPendingMiningRestart(null);
    commitMiningState(createMiningRoom(memberId, 1, memberStats(next, memberId), Math.random));
  }, [commitMiningState, commitPendingMiningRestart, commitProgression, showToast]);

  const handleMiningTile = useCallback((position: Position) => {
    const current = miningStateRef.current;
    if (!current) return;
    const tile = current.tiles[position.y]?.[position.x];
    if (!tile) return;
    if (current.enemy?.position.x === position.x && current.enemy.position.y === position.y) {
      applyMiningResult(attackMiningEnemy(
        current,
        memberStats(progressionRef.current, current.memberId),
        getPartyMember(progressionRef.current, current.memberId).hp,
        getPartyMember(progressionRef.current, current.memberId).stamina,
      ));
      return;
    }
    if (tile.kind === "rock" && tile.rockId) {
      const result = selectMiningRock(current, tile.rockId);
      if (result.error) showToast(result.error);
      else commitMiningState(result.state);
      return;
    }
    if (tile.kind === "door") {
      const result = enterNextMiningRoom(
        current,
        memberStats(progressionRef.current, current.memberId),
        Math.random,
      );
      if (result.error) showToast(result.error);
      else if (result.limitReached) {
        applyMiningResult({
          state: result.state,
          hp: getPartyMember(progressionRef.current, current.memberId).hp,
          stamina: new Decimal(0),
          goldGained: new Decimal(0),
          died: false,
          exhausted: true,
          depthLimitReached: true,
        });
      }
      else {
        commitProgression(recordMiningRoomReached(progressionRef.current, result.state.roomNumber));
        commitMiningState(result.state);
      }
    }
  }, [applyMiningResult, commitMiningState, commitProgression, showToast]);

  const toggleMiningAuto = useCallback(() => {
    const current = progressionRef.current;
    commitProgression(setMiningAutoMode(current, !current.miningAutoMode));
  }, [commitProgression]);

  const toggleMiningRestart = useCallback((enabled: boolean) => {
    commitProgression(setRestartMiningOnFullHp(progressionRef.current, enabled));
    if (!enabled) commitPendingMiningRestart(null);
  }, [commitPendingMiningRestart, commitProgression]);

  const stopMining = useCallback(() => {
    commitPendingMiningRestart(null);
    commitMiningState(null);
    showToast("Mining stopped. Somewhere underground, a rock breathes a tiny sigh of relief.");
  }, [commitMiningState, commitPendingMiningRestart, showToast]);

  const enterDungeon = useCallback((dungeonId: AdventureDungeonId = "starting") => {
    const current = progressionRef.current;
    if (dungeonId === "great-tower") {
      if (!current.greatTowerUnlocked) {
        showToast("The Great Tower is still locked. You need the giant Tower Key for the giant Tower lock."
        );
      }
      return;
    }
    const battleMembers = new Set(battleReservedPlayerIds(battleRef.current));
    const miningMembers = new Set(miningMemberIds(
      miningStateRef.current,
      pendingMiningRestartMemberIdRef.current,
    ));
    const selectedIds = current.selectedAdventureMembers.filter((id) =>
      current.party[id]
      && current.fishingAssignment?.memberId !== id
      && !battleMembers.has(id)
      && !miningMembers.has(id)
    );
    if (selectedIds.length === 0) {
      showToast("Select at least one party member. The dungeon will not explore itself, no matter how long you idle.");
      return;
    }
    const exhausted = selectedIds.find((id) => getPartyMember(current, id).stamina.lte(0));
    if (exhausted) {
      showToast(`${getPlayer(exhausted).name} needs stamina before Adventuring. Let the poor thing breathe.`);
      return;
    }
    const firstId = selectedIds[0];
    const firstProgress = getPartyMember(current, firstId);
    const first = startAdventure(
      memberStats(current, firstId),
      Math.random,
      firstProgress.staminaActions,
      current.activeQuestId,
      firstId,
      current.fishingRod,
      current.activeQuestId === "rescue-shopkeeper" && !current.shopUnlocked,
      current.completedRaids,
      {
        blacksmithRoomEnabled: current.completedRaids.includes(4),
        hammerQuestPurchased: current.hammerQuestPurchased,
        hammerRecovered: current.hammerRecovered,
        potionmasterRoomEnabled: !current.potionmasterQuestCompleted,
        oddityBrewerRoomEnabled: current.completedRaids.includes(7) && !current.oddityBrewerCompleted,
        forgePortalEnabled: current.forgeBlueprintsRecovered || current.forgeBlueprintsDelivered,
        cartographerRoomEnabled: current.completedRaids.includes(5) && !current.cartographerQuestCompleted,
      },
    );
    const explorers: Partial<Record<PlayerId, AdventureState>> = { [firstId]: first };
    for (const id of selectedIds.slice(1)) {
      const member = getPartyMember(current, id);
      const occupied = Object.values(explorers)
        .filter((explorer): explorer is AdventureState => Boolean(explorer))
        .map((explorer) => explorer.playerPosition);
      explorers[id] = addAdventureExplorer(
        first,
        id,
        memberStats(current, id),
        member.staminaActions,
        occupied,
      );
    }
    adventureTickRef.current = 0;
    commitAdventureSession({
      explorers,
      order: selectedIds,
      focusedMemberId: firstId,
      headingByMember: createAdventureHeadings(selectedIds, effectiveAdventureStrategy(current)),
      routeTargetRoomKey: null,
      forgeRallyRoomKey: null,
      carriedGold: new Decimal(0),
      carriedGoldByMember: {},
    });
  }, [commitAdventureSession, showToast]);

  const useEscapeRope = useCallback(() => {
    const session = adventureSessionRef.current;
    if (!session) return;
    const requiredLevel = requiredEscapeRopeLevel(session);
    if (!ESCAPE_ROPE_LEVELS.includes(requiredLevel as EscapeRopeLevel)) {
      showToast(`No Escape Rope reaches ${requiredLevel} room${requiredLevel === 1 ? "" : "s"} from the entrance. You should have bought a rope with a bigger number.`);
      return;
    }
    const consumed = consumeEscapeRope(progressionRef.current, requiredLevel as EscapeRopeLevel);
    if (consumed.error) return showToast(consumed.error);
    const withoutRestart = consumed.state.restartAdventureOnFullHp
      ? setRestartAdventureOnFullHp(consumed.state, false)
      : consumed.state;
    const failedHammer = withoutRestart.hammerQuestAttemptActive && !withoutRestart.hammerReturned;
    const settlement = settleAdventureGold(
      failHammerQuestAttempt(withoutRestart),
      session.carriedGold,
      true,
    );
    commitProgression(settlement.state);
    commitAdventureSession(null);
    showToast(`Level ${requiredLevel} Escape Rope used! Banked ${formatWholeAmount(settlement.banked)} carried gold and climbed away very bravely.${failedHammer ? " Retrieve Hammer failed." : ""}`);
  }, [commitAdventureSession, commitProgression, showToast]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const current = miningStateRef.current;
      if (!current) return;
      const progress = progressionRef.current;
      if (!progress.party[current.memberId]) {
        commitMiningState(null);
        return;
      }
      const result = advanceMining(
        current,
        memberStats(progress, current.memberId),
        getPartyMember(progress, current.memberId).hp,
        getPartyMember(progress, current.memberId).stamina,
        0.2,
        progress.miningAutoMode,
        Math.random,
      );
      if (
        result.state === current
        && result.hp.eq(getPartyMember(progress, current.memberId).hp)
        && result.stamina.eq(getPartyMember(progress, current.memberId).stamina)
        && result.goldGained.eq(0)
        && !result.roomAdvanced
      ) return;
      applyMiningResult(result);
    }, 200);
    return () => window.clearInterval(timer);
  }, [applyMiningResult, commitMiningState]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const timedState = advanceTimedEffects(progressionRef.current);
      const result = advanceProgression(timedState);
      const activeExplorerIds = adventureSessionRef.current?.order.filter(
        (id) => adventureSessionRef.current?.explorers[id],
      ) ?? [];
      const activeMiningIds = miningStateRef.current ? [miningStateRef.current.memberId] : [];
      const activeBattleIds = battleReservedPlayerIds(battleRef.current);
      const activeFishingIds = result.state.fishingAssignment
        ? [result.state.fishingAssignment.memberId]
        : [];
      const next = healParty(result.state, 0.2, [
        ...new Set([
          ...activeExplorerIds,
          ...activeMiningIds,
          ...activeBattleIds,
          ...activeFishingIds,
        ]),
      ]);
      commitProgression(next);
      if (result.completed) showToast(`Caught a ${STAT_META[result.completed].label} fish! Eat it to put the fish inside your stats.`);
      else if (result.materialCompleted) showToast(`Fished up ${MATERIAL_META[result.materialCompleted].name}. Not a fish. The Rod tried its best.`);
      else if (result.inventoryFull) showToast("The catch was discarded because the backpack or stack is full. Somewhere, a fish laughs.");
    }, 200);
    return () => window.clearInterval(timer);
  }, [commitProgression, showToast]);

  useEffect(() => {
    const save = () => {
      saveProgression(recordPlayTime(), saveSlot);
    };
    const timer = window.setInterval(save, 2_000);
    window.addEventListener("beforeunload", save);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("beforeunload", save);
      saveProgression(recordPlayTime(), saveSlot);
    };
  }, [recordPlayTime, saveSlot]);

  useEffect(() => {
    if (battle.status !== "won" || rewardedRef.current) return;
    rewardedRef.current = true;
    const result = recordVictory(
      progressionRef.current,
      battle.level.number,
      battle.level.reward,
    );
    commitProgression(result.state);
    const popups = result.firstClear
      ? battleRewardPopups(battle.level.number, Boolean(result.rewardDiscarded))
      : [];
    if (popups.length > 0) setRewardPopups(popups);
    else showToast(
      !result.firstClear
        ? `Battle ${battle.level.number} won again! No new rewards. You already took everything that wasn't nailed down.`
        : result.unlocked
          ? `Battle ${battle.level.number + 1} unlocked! Oh boy, more enemies!`
          : `Battle ${battle.level.number} cleared! You hit all the correct things.`,
    );
    const nextLevel = nextRaidNumber(result.state);
    if (nextLevel !== null) {
      commitBattle(createBattle(
        nextLevel,
        battlePartySetup(
          result.state,
          unavailableBattleMemberIds(
            adventureSessionRef.current,
            miningStateRef.current,
            pendingMiningRestartMemberIdRef.current,
          ),
        ),
      ));
      rewardedRef.current = false;
    }
  }, [battle.status, battle.level.number, battle.level.reward, commitBattle, commitProgression, showToast]);

  useEffect(() => {
    const actor = activeUnit(battle);
    if (view !== "battle" || !actor || battle.status !== "fighting") return;
    const shouldAct = actor.forcedPasses > 0
      || actor.paralyzedTurns > 0
      || actor.team === "enemy"
      || progression.battleAutoMode;
    if (!shouldAct) return;
    const delay = progression.battleAutoMode ? 360 : 540;
    const timer = window.setTimeout(() => {
      const action = suggestedAction(battleRef.current);
      if (action) executeBattleAction(action);
    }, delay);
    return () => window.clearTimeout(timer);
  }, [battle, progression.battleAutoMode, executeBattleAction, view]);

  const rollingDiceKey = adventureSession?.order.flatMap((id) => {
    const explorer = adventureSession.explorers[id];
    if (!explorer) return [];
    const room = currentAdventureRoom(explorer);
    return room.kind === "dice" && room.diceRolling
      ? [`${id}:${room.key}:${room.diceValues?.join("-") ?? "rolling"}`]
      : [];
  }).join("|") ?? "";

  useEffect(() => {
    if (!rollingDiceKey) return;
    const timer = window.setTimeout(() => {
      const current = adventureSessionRef.current;
      if (!current) return;
      let nextSession = current;
      let curseRoll: number | null = null;
      for (const id of current.order) {
        const explorer = nextSession.explorers[id];
        if (!explorer) continue;
        const room = currentAdventureRoom(explorer);
        if (room.kind !== "dice" || !room.diceRolling) continue;
        const settled = settleDiceRoomRoll(explorer);
        curseRoll ??= currentAdventureRoom(settled).diceValue ?? null;
        nextSession = updateAdventureSession(nextSession, id, settled) ?? nextSession;
      }
      if (curseRoll !== null) {
        nextSession = startAdventureDiceCurse(nextSession, curseRoll, progressionRef.current);
      }
      commitAdventureSession(nextSession);
    }, 5_400);
    return () => window.clearTimeout(timer);
  }, [commitAdventureSession, rollingDiceKey]);

  useEffect(() => {
    if (!adventureSession) return;
    const timer = window.setTimeout(() => {
      const session = adventureSessionRef.current;
      if (!session) return;
      const activeIds = session.order.filter((id) => session.explorers[id]);
      if (activeIds.length === 0) {
        commitProgression(failHammerQuestAttempt(progressionRef.current));
        return commitAdventureSession(null);
      }
      const disconnectedId = activeIds.find((id) => {
        const explorer = session.explorers[id];
        return explorer && !allNonWallTilesReachable(
          currentAdventureRoom(explorer),
          explorer.playerPosition,
        );
      });
      if (disconnectedId) {
        const explorer = session.explorers[disconnectedId];
        if (explorer) {
          commitAdventureSession(updateAdventureSession(
            session,
            disconnectedId,
            repairAdventureRoomConnectivity(explorer),
          ));
        }
        return;
      }
      if (!session.headingByMember) {
        commitAdventureSession({
          ...session,
          headingByMember: createAdventureHeadings(
            activeIds,
            effectiveAdventureStrategy(
              progressionRef.current,
              activeIds.some((id) => Boolean(session.explorers[id]?.cartographerQuestActive)),
            ),
          ),
        });
        return;
      }
      let memberId: PlayerId | undefined;
      if (progressionRef.current.adventureAutoMode) {
        const startIndex = adventureTickRef.current % activeIds.length;
        adventureTickRef.current += 1;
        for (let offset = 0; offset < activeIds.length; offset += 1) {
          const candidateId = activeIds[(startIndex + offset) % activeIds.length];
          const candidate = session.explorers[candidateId];
          if (!candidate) continue;
          if (!isAdventurePlayerTurn(candidate)) {
            handleAdventureEnemyAction(candidateId);
            return;
          }
          try {
            const strategy = effectiveAdventureStrategy(
              progressionRef.current,
              Boolean(candidate.cartographerQuestActive),
            );
            const leadId = activeIds[0];
            const destination = suggestAdventureMove(candidate, {
              prioritizeQuest: strategy === "quest",
              routeRoomKey: session.forgeRallyRoomKey ?? session.routeTargetRoomKey ?? null,
              followRoomKey: strategy === "together" && candidateId !== leadId
                ? session.explorers[leadId]?.currentRoomKey ?? null
                : null,
              avoidRoomKeys: strategy === "split"
                ? activeIds.filter((id) => id !== candidateId).flatMap((id) => session.explorers[id]?.currentRoomKey ?? [])
                : [],
              occupiedPositions: otherAdventureExplorerPositions(session, candidateId)
                .filter((other) => other.roomKey === candidate.currentRoomKey)
                .map((other) => other.position),
              preferredDirection: session.headingByMember?.[candidateId] ?? null,
              enterPortalTypes: progressionRef.current.autoEnterPortalTypes,
              weaponThrowUnlocked: progressionRef.current.weaponThrowUnlocked
                && memberHasTrident(progressionRef.current, candidateId),
              hasTrident: memberHasTrident(progressionRef.current, candidateId),
              weaponAbilityId: memberWeaponAbility(progressionRef.current, candidateId),
              avoidManualInteractions: true,
              targetRing: strategy === "ring" ? progressionRef.current.targetAdventureRing : undefined,
              ignoreGold: progressionRef.current.adventureIgnoreGold,
              requireFullPartyForForgePortal: !progressionRef.current.completedQuestIds.includes("enter-tower"),
              returnToDungeonPortal: session.returnToDungeonPortal ?? false,
            });
            if (destination) {
              handleAdventureMove(destination, true, candidateId);
              return;
            }
          } catch {
            // Treat a failed automatic decision as a pass. Auto should be
            // resilient to one malformed generated-room state.
          }
          handleAdventurePass(true, candidateId);
          return;
        }
        return;
      } else {
        memberId = activeIds.find((id) => {
          const explorer = session.explorers[id];
          return explorer && !isAdventurePlayerTurn(explorer);
        });
      }
      if (!memberId) return;
      const explorer = session.explorers[memberId];
      if (!explorer) return;
      if (isAdventurePlayerTurn(explorer)) {
        const strategy = effectiveAdventureStrategy(
          progressionRef.current,
          Boolean(explorer.cartographerQuestActive),
        );
        const leadId = activeIds[0];
        const destination = suggestAdventureMove(explorer, {
          prioritizeQuest: strategy === "quest",
          routeRoomKey: session.forgeRallyRoomKey ?? session.routeTargetRoomKey ?? null,
          followRoomKey: strategy === "together" && memberId !== leadId
            ? session.explorers[leadId]?.currentRoomKey ?? null
            : null,
          avoidRoomKeys: strategy === "split"
            ? activeIds.filter((id) => id !== memberId).flatMap((id) => session.explorers[id]?.currentRoomKey ?? [])
            : [],
          occupiedPositions: otherAdventureExplorerPositions(session, memberId)
            .filter((other) => other.roomKey === explorer.currentRoomKey)
            .map((other) => other.position),
          preferredDirection: session.headingByMember?.[memberId] ?? null,
          enterPortalTypes: progressionRef.current.autoEnterPortalTypes,
          weaponThrowUnlocked: progressionRef.current.weaponThrowUnlocked
            && memberHasTrident(progressionRef.current, memberId),
          hasTrident: memberHasTrident(progressionRef.current, memberId),
          weaponAbilityId: memberWeaponAbility(progressionRef.current, memberId),
          avoidManualInteractions: true,
          targetRing: strategy === "ring" ? progressionRef.current.targetAdventureRing : undefined,
          ignoreGold: progressionRef.current.adventureIgnoreGold,
          requireFullPartyForForgePortal: !progressionRef.current.completedQuestIds.includes("enter-tower"),
          returnToDungeonPortal: session.returnToDungeonPortal ?? false,
        });
        if (destination) handleAdventureMove(destination, true, memberId);
        else handleAdventurePass(true, memberId);
      } else {
        handleAdventureEnemyAction(memberId);
      }
    }, (progression.adventureAutoMode ? 220 : 300) / adventureSpeedMultiplier(progression));
    return () => window.clearTimeout(timer);
  }, [
    adventureSession,
    commitAdventureSession,
    commitProgression,
    handleAdventureEnemyAction,
    handleAdventureMove,
    handleAdventurePass,
    progression.activePotions?.haste,
    progression.activePotions?.["haste-2"],
    progression.adventureAutoMode,
  ]);

  useEffect(() => {
    if (adventureSession || !progression.restartAdventureOnFullHp) return;
    const unavailable = new Set([
      ...battleReservedPlayerIds(battleRef.current),
      ...miningMemberIds(miningStateRef.current, pendingMiningRestartMemberIdRef.current),
      ...(progression.fishingAssignment ? [progression.fishingAssignment.memberId] : []),
    ]);
    const ids = progression.selectedAdventureMembers.filter((id) =>
      progression.party[id] && !unavailable.has(id)
    );
    if (ids.length === 0) return;
    const ready = ids.every((id) => {
      const member = getPartyMember(progression, id);
      return member.hp.gte(memberMaxHp(progression, id))
        && member.stamina.gte(memberMaxStamina(progression, id));
    });
    if (!ready) return;
    const timer = window.setTimeout(enterDungeon, 120);
    return () => window.clearTimeout(timer);
  }, [adventureSession, enterDungeon, progression]);

  useEffect(() => {
    const memberId = pendingMiningRestartMemberId;
    if (
      !memberId
      || miningState
      || !progression.restartMiningOnFullHp
      || !progression.party[memberId]
    ) return;
    const member = getPartyMember(progression, memberId);
    if (
      member.hp.lt(memberMaxHp(progression, memberId))
      || member.stamina.lt(memberMaxStamina(progression, memberId))
    ) return;
    const timer = window.setTimeout(() => {
      if (pendingMiningRestartMemberIdRef.current !== memberId || miningStateRef.current) return;
      const current = progressionRef.current;
      commitMiningState(createMiningRoom(memberId, 1, memberStats(current, memberId), Math.random));
      commitPendingMiningRestart(null);
      showToast(`${getPlayer(memberId).name} returned to Mining Room 1. All the rocks grew back while nobody was looking.`);
    }, 120);
    return () => window.clearTimeout(timer);
  }, [
    commitMiningState,
    commitPendingMiningRestart,
    miningState,
    pendingMiningRestartMemberId,
    progression,
    showToast,
  ]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (conversationActiveRef.current) return;
      if (
        event.target instanceof HTMLInputElement
        || event.target instanceof HTMLSelectElement
        || event.target instanceof HTMLTextAreaElement
      ) return;
      const key = event.key.toLowerCase();
      if (key === "q") {
        event.preventDefault();
        if (viewRef.current === "adventure" && adventureSessionRef.current) toggleAdventureAuto();
        else if (viewRef.current === "battle" && battleRef.current.status === "fighting") toggleBattleAuto();
        else if (viewRef.current === "mining" && miningStateRef.current) toggleMiningAuto();
        return;
      }

      const offsets: Record<string, Position> = {
        w: { x: 0, y: -1 },
        arrowup: { x: 0, y: -1 },
        d: { x: 1, y: 0 },
        arrowright: { x: 1, y: 0 },
        s: { x: 0, y: 1 },
        arrowdown: { x: 0, y: 1 },
        a: { x: -1, y: 0 },
        arrowleft: { x: -1, y: 0 },
      };
      const offset = offsets[key];

      const activeSession = adventureSessionRef.current;
      const focusedAdventure = activeSession?.explorers[activeSession.focusedMemberId];
      if (viewRef.current === "adventure" && focusedAdventure && offset) {
        event.preventDefault();
        const position = focusedAdventure.playerPosition;
        handleAdventureMove({ x: position.x + offset.x, y: position.y + offset.y });
        return;
      }
      if (viewRef.current === "adventure" && focusedAdventure && event.code === "Space") {
        event.preventDefault();
        const current = focusedAdventure;
        if (!isAdventurePlayerTurn(current) || progressionRef.current.adventureAutoMode) return;
        const room = currentAdventureRoom(current);
        const target = [
          { x: current.playerPosition.x, y: current.playerPosition.y - 1 },
          { x: current.playerPosition.x + 1, y: current.playerPosition.y },
          { x: current.playerPosition.x, y: current.playerPosition.y + 1 },
          { x: current.playerPosition.x - 1, y: current.playerPosition.y },
        ].find((position) => room.tiles[position.y]?.[position.x]?.kind === "enemy");
        if (target) handleAdventureMove(target);
        else handleAdventurePass();
        return;
      }
      if (viewRef.current !== "battle") return;
      const current = battleRef.current;
      const actor = activeUnit(current);
      if (!actor || actor.team !== "player" || progressionRef.current.battleAutoMode) return;
      if (offset) {
        event.preventDefault();
        handleBattleTile({ x: actor.position.x + offset.x, y: actor.position.y + offset.y });
      } else if (event.code === "Space") {
        event.preventDefault();
        const target = current.units.find(
          (unit) => unit.team === "enemy" && unit.hp.gt(0) && isInAttackRange(actor, unit.position, current),
        );
        if (target) executeBattleAction({ type: "attack", targetId: target.id });
        else showToast("No enemy is in basic attack range. Move your sword closer to something with a red bar.");
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [executeBattleAction, handleAdventureMove, handleAdventurePass, handleBattleTile, navigate, showToast, toggleAdventureAuto, toggleBattleAuto, toggleMiningAuto]);

  const focusedAdventure = adventureSession?.explorers[adventureSession.focusedMemberId] ?? null;
  const reservedBattleMembers = battleReservedPlayerIds(battle);
  const activeAdventureMembers = activeAdventureMemberIds(adventureSession);
  const miningMembers = miningMemberIds(miningState, pendingMiningRestartMemberId);
  const adventureMemberActivities: Partial<Record<PlayerId, string>> = {
    ...Object.fromEntries(reservedBattleMembers.map((id) => [id, "in Battle"])),
    ...Object.fromEntries(miningMembers.map((id) => [id, "mining"])),
    ...(progression.fishingAssignment
      ? { [progression.fishingAssignment.memberId]: "fishing" }
      : {}),
  };
  const nextBattle = nextRaidNumber(progression);

  return (
    <div className="app-shell">
      <GameNavigation
        onNavigate={navigate}
        onOpenHelp={() => setHelpOpen(true)}
        onSaveAndQuit={saveAndQuitToTitle}
        progression={progression}
        view={view}
      />

      {view === "adventure" ? (
        <AdventureView
          adventure={focusedAdventure}
          adventureSession={adventureSession}
          progression={progression}
          memberActivities={adventureMemberActivities}
          onChooseStrategy={chooseAdventureStrategy}
          onChooseTargetRing={chooseAdventureTargetRing}
          onChooseRouteTarget={chooseAdventureRouteTarget}
          onFocusMember={focusAdventureMember}
          onSelectMember={toggleAdventureMember}
          onToggleRestart={toggleAdventureRestart}
          onToggleIgnoreGold={toggleAdventureIgnoreGold}
          onTogglePortalType={toggleAutoPortalType}
          onToggleAutoPauseRoom={toggleAdventureAutoPauseRoom}
          onOfferFish={handleWaterShrineOffering}
          onActivateQuest={handleActivateQuest}
          onActivateCartographerQuest={handleActivateCartographerQuest}
          onActivateHammerQuest={handleActivateHammerQuest}
          onPurchaseHammerQuest={handlePurchaseHammerQuest}
          onPurchaseBlacksmithPotion={handlePurchaseBlacksmithPotion}
          onPurchasePickaxe={handlePurchasePickaxe}
          onDeliverForgeBlueprints={handleDeliverForgeBlueprints}
          onPurchaseCraftingTable={handlePurchaseCraftingTable}
          onCompletePotionmasterQuest={handleCompletePotionmasterQuest}
          onCompleteOddityBrewerExchange={handleCompleteOddityBrewerExchange}
          onDeliverAnglerMaterials={handleDeliverAnglerMaterials}
          onDeliverAnglerFish={handleDeliverAnglerFish}
          onStart={enterDungeon}
          onUseEscapeRope={useEscapeRope}
          onMove={handleAdventureMove}
          onSecondaryAttack={handleAdventureSecondaryAttack}
          onPass={handleAdventurePass}
          onToggleAuto={toggleAdventureAuto}
        />
      ) : view === "party" ? (
        <PartyView
          progression={progression}
          onConsumePotion={handleConsumePotion}
          onEquip={handleEquipGear}
          onFeedFish={handleFeedFish}
          onUseBlacksmithPotion={handleUseBlacksmithPotion}
          onUseMapmakerChalk={handleUseMapmakerChalk}
          onUnequip={handleUnequipGear}
        />
      ) : view === "battle" ? (
        nextBattle === null ? (
          <main className="battle-view">
            <header className="page-heading"><h1>All Battles cleared</h1></header>
          </main>
        ) : (
          <BattleView
            battle={battle}
            autoMode={progression.battleAutoMode}
            onToggleAuto={toggleBattleAuto}
            onTile={handleBattleTile}
            onSecondaryTile={(position) => handleBattleTile(position, "secondary")}
            onSelectDeploymentUnit={handleSelectDeploymentUnit}
            onStartBattle={handleStartRaid}
            onRetry={beginLevel}
          />
        )
      ) : view === "shop" ? (
        <ShopView
          progression={progression}
          onPurchaseUndeadGem={handlePurchaseUndeadGem}
          onPurchaseEscapeRope={handlePurchaseEscapeRope}
          onPurchaseInventorySlots={handlePurchaseInventorySlots}
          onPurchaseStackSize={handlePurchaseInventoryStackSize}
          onPurchasePotion={handlePurchasePotion}
          onPurchaseQuest={handlePurchaseQuest}
          onAcknowledgeCategory={handleAcknowledgeShopCategory}
          onSellMaterial={handleSellMaterial}
          onSellFish={handleSellFish}
          onSellGear={handleSellGear}
        />
      ) : view === "fishing" ? (
        <FishingView
          progression={progression}
          unavailableMembers={[...new Set([
            ...activeAdventureMembers,
            ...reservedBattleMembers,
            ...miningMembers,
          ])]}
          onStart={handleStartFishing}
          onStop={handleStopFishing}
          onChooseFavoredFish={handleChooseFavoredFish}
        />
      ) : view === "mining" ? (
        <MiningView
          progression={progression}
          mining={miningState}
          waitingMemberId={pendingMiningRestartMemberId}
          unavailableMembers={[...new Set([
            ...activeAdventureMembers,
            ...reservedBattleMembers,
            ...(progression.fishingAssignment ? [progression.fishingAssignment.memberId] : []),
          ])]}
          onChooseMember={handleChooseMiningMember}
          onStart={handleStartMining}
          onTile={handleMiningTile}
          onToggleAuto={toggleMiningAuto}
          onToggleRestart={toggleMiningRestart}
          onStop={stopMining}
        />
      ) : view === "crafting" ? (
        <CraftingView progression={progression} onCraft={handleCraft} />
      ) : view === "bestiary" ? (
        <BestiaryView defeatedEnemyIds={progression.defeatedEnemyIds} />
      ) : (
        <TrainingView
          progression={progression}
          onTrain={handleTrain}
          onReturnToBattle={() => navigate("battle")}
        />
      )}

      {rewardPopups[0] && (
        <RewardPopup
          content={rewardPopups[0]}
          onClose={() => setRewardPopups((current) => current.slice(1))}
        />
      )}
      {activeConversation && (
        <ConversationBox
          beat={conversation(activeConversation.id)[activeConversation.line]}
          current={activeConversation.line}
          total={conversation(activeConversation.id).length}
          onAdvance={advanceConversation}
        />
      )}
      {helpOpen && <HelpIndex progression={progression} onClose={() => setHelpOpen(false)} />}
    </div>
  );
}
