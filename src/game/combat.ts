import Decimal from "break_eternity.js";
import { getEnemy } from "../content/enemies";
import { getLevel } from "../content/levels";
import { getPlayer } from "../content/players";
import { formatWholeAmount } from "./numbers";
import {
  EMPTY_EQUIPMENT,
  TRIDENT_THROW_RANGE,
  applyGearBonuses,
  type Equipment,
  type GearItem,
} from "./gear";
import { FISH_BASE_STAT_BONUS } from "./items";
import { weaponSkill } from "./weapon-skills";
import { basicAttackVisual } from "./attack-visuals";
import {
  battleHazards,
  createOozeBelchHazards,
  decayBattleHazards,
  hazardAt,
} from "./combat-hazards";
import {
  EMPTY_TRAINING,
  HOME_ZONE_BONUS,
  type AttackPattern,
  type BoardDefinition,
  type BattleState,
  type CombatAction,
  type HorizontalFacing,
  type LevelDefinition,
  type Position,
  type PlayerId,
  type Stats,
  type Terrain,
  type TrainingLevels,
  type Unit,
  type WeaponAbilityId,
} from "./types";

const ACTION_GAUGE = new Decimal(1_000);

export interface PlayerBattleSetup {
  id: PlayerId;
  training: TrainingLevels;
  fishBonuses?: TrainingLevels;
  startingHp?: Decimal;
  inventory?: GearItem[];
  equipment?: Equipment;
  stats?: Stats;
  weaponThrowUnlocked?: boolean;
  hasTrident?: boolean;
  hasUndeadGem?: boolean;
  hasSuctionCups?: boolean;
  weaponAbilityId?: WeaponAbilityId;
}

export type ActionResult =
  | { ok: true; state: BattleState }
  | { ok: false; state: BattleState; error: string };

export interface CreateBattleOptions {
  previousBattle?: BattleState;
  random?: () => number;
  rerollRandomSpawns?: boolean;
}

export function createBattle(
  levelNumber: number,
  party: PlayerBattleSetup[],
  options: CreateBattleOptions = {},
): BattleState {
  const level = getLevel(levelNumber);
  const players: Unit[] = party.map((setup, index) => {
    const definition = getPlayer(setup.id);
    const equippedWeapon = setup.inventory?.find((item) => item.id === setup.equipment?.sword);
    const stats = setup.stats ?? playerStatsWithTraining(
        setup.id,
        setup.training,
        setup.inventory,
        setup.equipment,
        setup.fishBonuses,
      );
    return {
      id: `player-${setup.id}`,
      definitionId: definition.id,
      name: definition.name,
      team: "player" as const,
      attackRange: validAttackRange(definition.attackRange),
      attackType: definition.attackType ?? "physical",
      attackName: definition.attackName ?? "Attack",
      attackPattern: definition.attackPattern ?? "orthogonal",
      isRaidBoss: false,
      footprint: validFootprint(definition.footprint),
      footprintWidth: validFootprintDimension(definition.footprintWidth ?? definition.footprint),
      footprintHeight: validFootprintDimension(definition.footprintHeight ?? definition.footprint),
      canMove: definition.canMove !== false,
      weaponThrowUnlocked: Boolean(setup.weaponThrowUnlocked && setup.hasTrident),
      hasTrident: Boolean(setup.hasTrident),
      weaponAbilityId: setup.weaponAbilityId
        ?? equippedWeapon?.weaponAbilityId
        ?? (setup.hasTrident ? "trident-throw" : undefined),
      weaponCooldownRemaining: 0,
      hasUndeadGem: Boolean(setup.hasUndeadGem),
      retaliatoryParalysisChance: setup.hasSuctionCups ? 0.15 : undefined,
      forcedPasses: 0,
      paralyzedTurns: 0,
      corrosionTurns: 0,
      corrosionDamage: new Decimal(0),
      paralysisChance: definition.paralysisChance,
      attackArea: definition.attackArea,
      summonPool: definition.summonPool,
      summonCooldown: definition.summonPool ? 0 : undefined,
      teleportRangeFraction: definition.teleportRangeFraction,
      teleportCooldown: definition.teleportRangeFraction ? 0 : undefined,
      oozeBelch: definition.oozeBelch,
      oozeBelchCooldown: definition.oozeBelch ? 0 : undefined,
      summonCaged: false,
      requiresTridentThrow: false,
      invulnerableWhileEnemyId: undefined,
      invulnerableWhileSummons: false,
      concealsBossIdentity: false,
      blocksWeaponThrows: false,
      weakeningGuardDefinitionId: undefined,
      weakeningPerGuardDefeat: undefined,
      weakeningGuardCount: undefined,
      weakeningStacks: 0,
      facing: "right",
      position: { x: -1, y: index },
      stats,
      hp: new Decimal(0),
    };
  });
  const enemyPositions = resolveEnemySpawnPositions(level, options);
  const enemies: Unit[] = level.enemies.map((spawn) => ({
    id: spawn.instanceId,
    definitionId: spawn.unit.id,
    name: spawn.unit.name,
    attackRange: validAttackRange(spawn.unit.attackRange),
    attackType: spawn.unit.attackType ?? "physical",
    attackName: spawn.unit.attackName ?? "Attack",
    attackPattern: spawn.unit.attackPattern ?? "orthogonal",
    isRaidBoss: Boolean(spawn.unit.isRaidBoss),
    footprint: validFootprint(spawn.unit.footprint),
    footprintWidth: validFootprintDimension(spawn.unit.footprintWidth ?? spawn.unit.footprint),
    footprintHeight: validFootprintDimension(spawn.unit.footprintHeight ?? spawn.unit.footprint),
    canMove: spawn.unit.canMove !== false,
    weaponThrowUnlocked: false,
    hasTrident: false,
    weaponAbilityId: undefined,
    weaponCooldownRemaining: 0,
    hasUndeadGem: false,
    retaliatoryParalysisChance: undefined,
    forcedPasses: 0,
    paralyzedTurns: 0,
    corrosionTurns: 0,
    corrosionDamage: new Decimal(0),
    paralysisChance: spawn.unit.paralysisChance,
    attackArea: spawn.unit.attackArea,
    summonPool: spawn.unit.summonPool,
    summonCooldown: spawn.unit.summonPool ? 0 : undefined,
    teleportRangeFraction: spawn.unit.teleportRangeFraction,
    teleportCooldown: spawn.unit.teleportRangeFraction ? 0 : undefined,
    oozeBelch: spawn.unit.oozeBelch,
    oozeBelchCooldown: spawn.unit.oozeBelch ? 0 : undefined,
    summonCaged: false,
    requiresTridentThrow: Boolean(spawn.unit.requiresTridentThrow),
    invulnerableWhileEnemyId: spawn.unit.invulnerableWhileEnemyId,
    invulnerableWhileSummons: Boolean(spawn.unit.invulnerableWhileSummons),
    concealsBossIdentity: Boolean(spawn.unit.concealsBossIdentity),
    blocksWeaponThrows: Boolean(spawn.unit.blocksWeaponThrows),
    weakeningGuardDefinitionId: spawn.unit.weakeningGuardDefinitionId,
    weakeningPerGuardDefeat: spawn.unit.weakeningPerGuardDefeat,
    weakeningGuardCount: spawn.unit.weakeningGuardCount,
    weakeningStacks: 0,
    facing: "left",
    position: { ...(enemyPositions.get(spawn.instanceId) ?? spawn.position) },
    stats: {
      ...spawn.unit.stats,
      speed: spawn.unit.isRaidBoss
        ? spawn.unit.stats.speed
        : spawn.unit.stats.speed.mul(1.12).ceil(),
    },
    team: "enemy",
    hp: new Decimal(0),
  }));
  const setupsById = new Map(party.map((setup) => [setup.id, setup]));
  const units = [...players, ...enemies].map((unit) => {
    const maximumHp = maxHpOnBoard(level.board, unit);
    const playerId = unit.team === "player" ? unit.definitionId as PlayerId : null;
    const setup = playerId ? setupsById.get(playerId) : undefined;
    const healthRatio = setup?.startingHp
      ? Decimal.min(1, Decimal.max(0, setup.startingHp).div(unit.stats.hp))
      : new Decimal(1);
    return {
      ...unit,
      hp: unit.team === "player" ? unit.stats.hp.mul(healthRatio) : maximumHp,
    };
  });
  const state: BattleState = {
    level,
    units,
    status: "deploying",
    activeUnitId: null,
    deploymentUnitId: players[0]?.id ?? null,
    actionCount: 0,
    log: ["Put warm bodies on the glowing tiles and press Start battle. The enemies politely freeze while you arrange their murder."],
    attackLog: [],
    readyAt: {},
    lastAttack: null,
    hazards: [],
  };
  return state;
}

function resolveEnemySpawnPositions(
  level: LevelDefinition,
  options: CreateBattleOptions,
): Map<string, Position> {
  const previousBattle = options.previousBattle?.level.number === level.number
    ? options.previousBattle
    : undefined;
  const previousPositions = new Map(
    previousBattle?.units
      .filter((unit) => unit.team === "enemy")
      .map((unit) => [unit.id, unit.position] as const) ?? [],
  );

  if (options.rerollRandomSpawns === false && previousBattle) {
    return new Map(level.enemies.map((spawn) => [
      spawn.instanceId,
      { ...(previousPositions.get(spawn.instanceId) ?? spawn.position) },
    ]));
  }

  const available = shuffledPositions(level.randomSpawnPositions ?? [], options.random ?? Math.random);
  const explicitlyRandomized = level.randomSpawnInstanceIds
    ? new Set(level.randomSpawnInstanceIds)
    : null;
  const positions = new Map<string, Position>();
  for (const spawn of level.enemies) {
    const randomizable = explicitlyRandomized
      ? explicitlyRandomized.has(spawn.instanceId)
      : !spawn.unit.isRaidBoss;
    if (!randomizable || available.length === 0) {
      positions.set(spawn.instanceId, { ...spawn.position });
      continue;
    }
    const previous = previousPositions.get(spawn.instanceId);
    const differentIndex = previous
      ? available.findIndex((position) => !samePosition(position, previous))
      : 0;
    const selectedIndex = differentIndex >= 0 ? differentIndex : 0;
    const [position] = available.splice(selectedIndex, 1);
    positions.set(spawn.instanceId, { ...(position ?? spawn.position) });
  }
  return positions;
}

function shuffledPositions(positions: Position[], random: () => number): Position[] {
  const result = positions.map((position) => ({ ...position }));
  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.min(index, Math.max(0, Math.floor(random() * (index + 1))));
    [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
  }
  return result;
}

export function selectDeploymentUnit(state: BattleState, unitId: string): ActionResult {
  const unit = state.units.find((candidate) => candidate.id === unitId);
  if (state.status !== "deploying") return failure(state, "Deployment has ended.");
  if (!unit || unit.team !== "player") return failure(state, "Choose a party member to deploy.");
  return { ok: true, state: { ...state, deploymentUnitId: unit.id } };
}

export function undeployPlayerUnit(state: BattleState, unitId: string): ActionResult {
  if (state.status !== "deploying") return failure(state, "Deployment has ended.");
  const unit = state.units.find((candidate) => candidate.id === unitId);
  if (!unit || unit.team !== "player") return failure(state, "Choose a deployed party member.");
  if (!isDeployed(state, unit)) return failure(state, `${unit.name} is not deployed.`);

  const units = state.units.map(cloneUnit);
  const playerIndex = units
    .filter((candidate) => candidate.team === "player")
    .findIndex((candidate) => candidate.id === unitId);
  const index = units.findIndex((candidate) => candidate.id === unitId);
  units[index].position = { x: -1, y: Math.max(0, playerIndex) };
  return {
    ok: true,
    state: {
      ...state,
      units,
      deploymentUnitId: state.deploymentUnitId === unitId ? null : state.deploymentUnitId,
      log: [`${unit.name} removed. They crouch just outside the board where space, time, and incoming damage cannot reach.`, ...state.log].slice(0, 6),
    },
  };
}

export function deployPlayerUnit(state: BattleState, position: Position): ActionResult {
  if (state.status !== "deploying") return failure(state, "Deployment has ended.");
  const selected = state.units.find((unit) => unit.id === state.deploymentUnitId);
  if (!selected || selected.team !== "player") {
    return failure(state, "Choose a party member before selecting a tile.");
  }
  if (!isOnBoard(state, position) || terrainAt(state, position) !== "player") {
    return failure(state, "Party members can only deploy on player-owned tiles.");
  }
  if (isDeploymentExcludedAt(state, position)) {
    return failure(state, "Party members cannot deploy on an isolated enemy platform.");
  }
  if (isMovementBlockedAt(state, position)) {
    return failure(state, isGapAt(state, position)
      ? "A gap blocks that deployment tile."
      : "A wall blocks that deployment tile.");
  }
  const occupant = unitAt(state, position);
  if (occupant && occupant.id !== selected.id) return failure(state, "That tile is occupied.");

  const units = state.units.map(cloneUnit);
  const index = units.findIndex((unit) => unit.id === selected.id);
  const previousMaximum = maxHp(state, units[index]);
  const healthRatio = previousMaximum.gt(0)
    ? Decimal.min(1, units[index].hp.div(previousMaximum))
    : new Decimal(1);
  units[index].position = { ...position };
  units[index].hp = maxHpOnBoard(state.level.board, units[index]).mul(healthRatio);
  const nextUndeployed = units.find((unit) => unit.team === "player" && !isDeployed(state, unit));
  return {
    ok: true,
    state: {
      ...state,
      units,
      deploymentUnitId: nextUndeployed?.id ?? selected.id,
      log: [`${selected.name} deployed! Their family has been notified with an upbeat but non-specific letter.`, ...state.log].slice(0, 6),
    },
  };
}

export function canStartRaid(state: BattleState): boolean {
  if (state.status !== "deploying") return false;
  const deployedPlayers = state.units.filter((candidate) =>
    candidate.team === "player" && isDeployed(state, candidate)
  );
  if (deployedPlayers.length === 0) return false;
  const positions = new Set<string>();
  for (const unit of deployedPlayers) {
    if (
      terrainAt(state, unit.position) !== "player" ||
      occupiedPositions(unit).some((position) => isDeploymentExcludedAt(state, position))
    ) return false;
    for (const position of occupiedPositions(unit)) {
      const key = positionKey(position);
      if (positions.has(key)) return false;
      positions.add(key);
    }
  }
  return positions.size > 0;
}

export function battleReservedPlayerIds(state: BattleState): PlayerId[] {
  // Deployment is planning, not an active assignment. Staged members keep
  // recovering and can be reassigned; the Battle reserves them only once it
  // has actually started.
  if (state.status !== "fighting") return [];
  return state.units
    .filter((unit) =>
      unit.team === "player"
      && isDeployed(state, unit)
    )
    .map((unit) => unit.definitionId as PlayerId);
}

export function startRaid(state: BattleState): ActionResult {
  if (!canStartRaid(state)) {
    return failure(state, "Deploy at least one party member on a player-owned tile first.");
  }
  const participants = state.units.filter((unit) =>
    unit.team === "enemy" || isDeployed(state, unit)
  );
  const readyAt = Object.fromEntries(
    participants.filter((unit) => unit.hp.gt(0)).map((unit) => [
      unit.id,
      ACTION_GAUGE.div(effectiveStatOnBoard(state.level.board, unit, "speed")),
    ]),
  );
  return {
    ok: true,
    state: beginNextTurn({
      ...state,
      units: participants,
      status: "fighting",
      activeUnitId: null,
      deploymentUnitId: null,
      readyAt,
      log: ["BATTLE START! Convert every red bar into no red bar using controlled screaming.", ...state.log].slice(0, 6),
    }),
  };
}

export function playerStatsWithTraining(
  playerId: PlayerId,
  training: TrainingLevels,
  inventory: GearItem[] = [],
  equipment: Equipment = EMPTY_EQUIPMENT,
  fishBonuses: TrainingLevels = EMPTY_TRAINING,
): Stats {
  return applyTraining(
    applyGearBonuses(getPlayer(playerId).stats, inventory, equipment),
    training,
    fishBonuses,
  );
}

export function persistentPlayerHp(state: BattleState, playerId: PlayerId): Decimal | null {
  const player = state.units.find(
    (unit) => unit.team === "player" && unit.definitionId === playerId,
  );
  if (!player) return null;
  if (!player || player.hp.lte(0)) return new Decimal(0);
  const healthRatio = player.hp.div(maxHp(state, player));
  return Decimal.min(player.stats.hp, player.stats.hp.mul(healthRatio));
}

export function syncDeployingBattleHp(
  state: BattleState,
  currentHp: Partial<Record<PlayerId, Decimal>>,
): BattleState {
  if (state.status !== "deploying") return state;
  let changed = false;
  const units = state.units.map((unit) => {
    if (unit.team !== "player") return unit;
    const memberHp = currentHp[unit.definitionId as PlayerId];
    if (!memberHp) return unit;
    const persistentMaximum = unit.stats.hp;
    const healthRatio = persistentMaximum.gt(0)
      ? Decimal.min(1, Decimal.max(0, memberHp).div(persistentMaximum))
      : new Decimal(0);
    const synchronizedHp = maxHp(state, unit).mul(healthRatio);
    if (synchronizedHp.eq(unit.hp)) return unit;
    changed = true;
    return { ...unit, hp: synchronizedHp };
  });
  return changed ? { ...state, units } : state;
}

export function performAction(
  state: BattleState,
  action: CombatAction,
  random: () => number = Math.random,
  playerDodgeChance = 0,
): ActionResult {
  if (state.status !== "fighting") return failure(state, "This battle has ended.");
  const actor = activeUnit(state);
  if (!actor || actor.hp.lte(0)) return failure(state, "No unit is ready.");

  const units = state.units.map(cloneUnit);
  const actorIndex = units.findIndex((unit) => unit.id === actor.id);
  let message = "";
  let corrosionMessage = "";
  let lastAttack: BattleState["lastAttack"] = null;
  const summonedUnits: Unit[] = [];
  const spawnedHazards: BattleState["hazards"] = [];
  const attackEntries: string[] = [];

  if ((units[actorIndex].corrosionTurns ?? 0) > 0) {
    const corrosionDamage = Decimal.max(1, units[actorIndex].corrosionDamage ?? 0);
    units[actorIndex].hp = Decimal.max(0, units[actorIndex].hp.sub(corrosionDamage));
    units[actorIndex].corrosionTurns = Math.max(0, units[actorIndex].corrosionTurns - 1);
    corrosionMessage = `${actor.name} takes ${formatWholeAmount(corrosionDamage)} corrosion damage${units[actorIndex].hp.eq(0) ? " and becomes a hot little person-flavored puddle" : ""}.`;
  }

  if (units[actorIndex].hp.lte(0)) {
    message = corrosionMessage;
    corrosionMessage = "";
  } else if (actor.paralyzedTurns > 0) {
    units[actorIndex].paralyzedTurns = Math.max(0, units[actorIndex].paralyzedTurns - 1);
    message = `${actor.name} is paralyzed and cannot act. The brain screams MOVE while the legs answer lol no.`;
  } else if (actor.forcedPasses > 0) {
    units[actorIndex].forcedPasses = Math.max(0, units[actorIndex].forcedPasses - 1);
    message = `${actor.name} must pass while retrieving the thrown weapon. String has not been researched. WALK OF SHAME!`;
  } else if (action.type === "move") {
    if (!actor.canMove) return failure(state, `${actor.name} cannot move.`);
    if (!isOnBoard(state, action.destination) || !isAdjacent(actor.position, action.destination)) {
      return failure(state, "Move to one adjacent tile.");
    }
    const movedActor = { ...actor, position: action.destination };
    for (const position of occupiedPositions(movedActor)) {
      if (!isOnBoard(state, position)) return failure(state, "That move leaves the arena.");
      const occupant = unitAt(state, position);
      if (occupant && occupant.id !== actor.id) return failure(state, "That tile is occupied.");
      if (isMovementBlockedAt(state, position)) {
        return failure(state, isGapAt(state, position)
          ? "A gap cannot be crossed. Projectiles can pass over it."
          : "A wall blocks that tile.");
      }
    }
    const oldMax = maxHp(state, units[actorIndex]);
    const leftSummonCage = Boolean(units[actorIndex].summonCaged);
    units[actorIndex].position = { ...action.destination };
    units[actorIndex].facing = horizontalFacing(
      actor.position,
      action.destination,
      actor.facing ?? defaultFacing(actor),
    );
    units[actorIndex].summonCaged = false;
    const newMax = maxHp(state, units[actorIndex]);
    units[actorIndex].hp = Decimal.min(units[actorIndex].hp, newMax);
    const zoneNote = newMax.gt(oldMax)
      ? " and enters friendly ground"
      : newMax.lt(oldMax) ? " and leaves friendly ground" : "";
    message = leftSummonCage
      ? `${actor.name} walks out of the broken cage${zoneNote} using too many legs, smelling like hot fear and whatever was in that straw.`
      : `${actor.name} moves one tile${zoneNote}. An entire tile! Try to remain calm.`;
    const oozePool = hazardAt(state, occupiedPositions(units[actorIndex]), actor.team);
    if (oozePool) {
      units[actorIndex].corrosionTurns = Math.max(
        units[actorIndex].corrosionTurns,
        oozePool.corrosionTurns,
      );
      units[actorIndex].corrosionDamage = Decimal.max(
        units[actorIndex].corrosionDamage,
        oozePool.damagePerTurn,
      );
      message += ` ${actor.name} puts a foot in corrosive ooze and will take damage for ${oozePool.corrosionTurns} turns. REMOVE FOOT FROM EVIL PUDDING.`;
    }
  } else if (action.type === "teleport") {
    const range = teleportRange(state, actor);
    if (range <= 0) return failure(state, `${actor.name} cannot teleport.`);
    if ((actor.teleportCooldown ?? 0) > 0) return failure(state, "Teleport is not ready.");
    if (!isOnBoard(state, action.destination)) return failure(state, "Teleport inside the arena.");
    if (chebyshev(actor.position, action.destination) > range) {
      return failure(state, `${actor.name} can teleport at most ${range} tiles.`);
    }
    const teleportedActor = { ...actor, position: action.destination };
    for (const position of occupiedPositions(teleportedActor)) {
      if (!isOnBoard(state, position) || isMovementBlockedAt(state, position)) {
        return failure(state, "Teleport onto an open floor tile.");
      }
      const occupant = unitAt(state, position);
      if (occupant && occupant.id !== actor.id) return failure(state, "That tile is occupied.");
    }
    units[actorIndex].position = { ...action.destination };
    units[actorIndex].facing = horizontalFacing(
      actor.position,
      action.destination,
      actor.facing ?? defaultFacing(actor),
    );
    units[actorIndex].teleportCooldown = 2;
    message = `${actor.name} uses Shadow Step, becomes two-dimensional for a VERY worrying instant, and pops out over there.`;
  } else if (action.type === "weaponSkill") {
    const skill = weaponSkill(actor.weaponAbilityId);
    const target = units.find((unit) => unit.id === action.targetId);
    if (!skill || skill.id === "trident-throw") {
      return failure(state, `${actor.name} has no weapon technique ready.`);
    }
    if ((actor.weaponCooldownRemaining ?? 0) > 0) {
      return failure(state, `${skill.name} is ready in ${actor.weaponCooldownRemaining} turn${actor.weaponCooldownRemaining === 1 ? "" : "s"}.`);
    }
    if (!target || target.hp.lte(0) || target.team === actor.team) {
      return failure(state, "Choose a living enemy.");
    }
    if (!isInWeaponSkillRange(actor, target.position, state)) {
      return failure(state, `${skill.name} cannot reach that target.`);
    }
    units[actorIndex].facing = horizontalFacing(
      actor.position,
      target.position,
      actor.facing ?? defaultFacing(actor),
    );
    units[actorIndex].weaponCooldownRemaining = skill.cooldownTurns;
    lastAttack = {
      attackName: skill.name,
      attackType: skill.attackType,
      actionKind: "skill",
      visual: skill.visual,
      from: { ...actor.position },
      to: { ...target.position },
    };
    const affectedTargets = weaponSkillTargets(state, units[actorIndex], target, units);
    const attackPower = effectiveStat(
      state,
      units[actorIndex],
      skill.attackType === "special" ? "spAttack" : "attack",
    ).mul(skill.damageMultiplier);
    const hitReports: string[] = [];
    for (const affectedTarget of affectedTargets) {
      if (affectedTarget.summonCaged) {
        hitReports.push(`${affectedTarget.name}'s sealed cage`);
        attackEntries.push(battleAttackEntry(actor.name, skill.name, affectedTarget.name, new Decimal(0)));
        continue;
      }
      const undeadWardActive = affectedTarget.definitionId === "skeleton-king"
        && !units.some((unit) => unit.team === "player" && unit.hasUndeadGem);
      if (undeadWardActive || affectedTarget.requiresTridentThrow || isShieldedByLivingEnemy(affectedTarget, units)) {
        hitReports.push(`${affectedTarget.name}'s ward`);
        attackEntries.push(battleAttackEntry(actor.name, skill.name, affectedTarget.name, new Decimal(0)));
        continue;
      }
      if (
        actor.team === "enemy"
        && affectedTarget.team === "player"
        && rollsDodge(playerDodgeChance, random)
      ) {
        hitReports.push(`${affectedTarget.name} (dodged)`);
        attackEntries.push(battleAttackEntry(actor.name, skill.name, affectedTarget.name, new Decimal(0)));
        continue;
      }
      const damage = skill.attackType === "special"
        ? specialDamage(attackPower, effectiveStat(state, affectedTarget, "spDefense"))
        : physicalDamage(attackPower, effectiveStat(state, affectedTarget, "defense"));
      affectedTarget.hp = Decimal.max(0, affectedTarget.hp.sub(damage));
      hitReports.push(`${affectedTarget.name} for ${formatWholeAmount(damage)}${affectedTarget.hp.eq(0) ? " (defeated)" : ""}`);
      attackEntries.push(battleAttackEntry(actor.name, skill.name, affectedTarget.name, damage));
    }
    const weakeningReports = applyGuardianWeakening(state.level.board, units);
    message = `${actor.name} casts ${skill.name}${hitReports.length > 0 ? `, hitting ${hitReports.join(" and ")}` : ""}. Multiple numbers come out! This is basically endgame.${weakeningReports.length > 0 ? ` ${weakeningReports.join(" ")}` : ""}`;
  } else if (action.type === "attack" || action.type === "weaponThrow") {
    const target = units.find((unit) => unit.id === action.targetId);
    if (!target || target.hp.lte(0) || target.team === actor.team) {
      return failure(state, "Choose a living enemy.");
    }
    const isWeaponThrow = action.type === "weaponThrow";
    if (isWeaponThrow && (!actor.weaponThrowUnlocked || !actor.hasTrident)) {
      return failure(state, "Weapon Throw requires the equipped Tidecaller Trident.");
    }
    if (isWeaponThrow
      ? !isInWeaponThrowRange(actor, target.position, state)
      : !isInAttackRange(actor, target.position, state)
    ) {
      return failure(
        state,
        isWeaponThrow
          ? "Weapon Throw needs an unobstructed cardinal line. Gaps do not block it; walls do."
          : `${actor.name}'s ${actor.attackName} has a ${attackPatternLabel(actor.attackPattern)} range of ${actor.attackRange}.`,
      );
    }
    const attackName = isWeaponThrow ? "Tidecaller Throw" : actor.attackName;
    units[actorIndex].facing = horizontalFacing(
      actor.position,
      target.position,
      actor.facing ?? defaultFacing(actor),
    );
    if (isWeaponThrow) units[actorIndex].forcedPasses += 1;
    lastAttack = {
      attackName,
      attackType: isWeaponThrow || actor.attackType === "special" ? "special" : "physical",
      actionKind: isWeaponThrow ? "weapon" : "basic",
      visual: isWeaponThrow
        ? "trident-throw"
        : basicAttackVisual(actor.definitionId, attackName, actor.attackType),
      from: { ...actor.position },
      to: { ...target.position },
    };
    const undeadWardActive = target.definitionId === "skeleton-king"
      && !units.some((unit) => unit.team === "player" && unit.hasUndeadGem);
    if (target.summonCaged) {
      message = `${actor.name}'s ${attackName} cannot reach ${target.name} through the sealed cage. STOP ATTACKING METAL BARS.`;
      attackEntries.push(battleAttackEntry(actor.name, attackName, target.name, new Decimal(0)));
    } else if (undeadWardActive) {
      message = `${actor.name}'s attack makes a sad *plink* on the Skele-King's green bubble. INVULNERABLE! Buy AND EQUIP the Undead Gem, you walnut.`;
      attackEntries.push(battleAttackEntry(actor.name, attackName, target.name, new Decimal(0)));
    } else if (target.requiresTridentThrow && (!isWeaponThrow || !actor.hasTrident)) {
      message = `${actor.name}'s ${attackName} does jack squat to the Squid Tentacle. RIGHT-CLICK IT WITH THE TRIDENT. THROW THE POINTY FORK.`;
      attackEntries.push(battleAttackEntry(actor.name, attackName, target.name, new Decimal(0)));
    } else if (isShieldedByLivingEnemy(target, units)) {
      const shieldProvider = target.invulnerableWhileEnemyId
        ? units.find((unit) => unit.hp.gt(0) && unit.definitionId === target.invulnerableWhileEnemyId)
        : undefined;
      message = target.invulnerableWhileSummons
        ? `${actor.name}'s ${attackName} bounces off ${target.name}'s summoned-beast shield. Remove his screaming zoo FIRST!`
        : target.definitionId === "abyssal-squid"
          ? `${actor.name}'s ${attackName} tickles ${target.name} for zero damage. Four Tentacles keep it invulnerable. AMPUTATE THE ROOM.`
          : `${actor.name}'s ${attackName} splats against ${target.name}'s pressure shield. Destroy ${shieldProvider?.name ?? "the giant glowing thing"} first! YES, THE GLOWY BIT.`;
      attackEntries.push(battleAttackEntry(actor.name, attackName, target.name, new Decimal(0)));
    } else {
      const affectedTargets = actor.attackArea === "front-three" && !isWeaponThrow
        ? units.filter((candidate) =>
            candidate.hp.gt(0)
            && candidate.team !== actor.team
            && occupiedPositions(candidate).some((position) =>
              frontThreePositions(
                closestOccupiedPosition(actor, target.position),
                target.position,
              ).some((front) => samePosition(front, position))
            )
          )
        : [target];
      const tridentThrow = isWeaponThrow && actor.hasTrident;
      const special = tridentThrow || (actor.attackType === "special" && !isWeaponThrow);
      const attackPower = effectiveStat(state, units[actorIndex], special ? "spAttack" : "attack");
      const hitReports = affectedTargets.map((affectedTarget) => {
        if (
          actor.team === "enemy"
          && affectedTarget.team === "player"
          && rollsDodge(playerDodgeChance, random)
        ) {
          attackEntries.push(battleAttackEntry(actor.name, attackName, affectedTarget.name, new Decimal(0)));
          return `${affectedTarget.name} (dodged)`;
        }
        const damage = special
          ? specialDamage(
              tridentThrow ? attackPower.mul(1.1) : attackPower,
              effectiveStat(state, affectedTarget, "spDefense"),
            )
          : physicalDamage(
              isWeaponThrow ? attackPower.mul(1.25) : attackPower,
              effectiveStat(state, affectedTarget, "defense"),
            );
        affectedTarget.hp = Decimal.max(0, affectedTarget.hp.sub(damage));
        const paralyzed = affectedTarget.hp.gt(0)
          && (units[actorIndex].paralysisChance ?? 0) > 0
          && random() < (units[actorIndex].paralysisChance ?? 0);
        if (paralyzed) affectedTarget.paralyzedTurns = Math.max(1, affectedTarget.paralyzedTurns);
        const retaliated = affectedTarget.hp.gt(0)
          && !units[actorIndex].isRaidBoss
          && (affectedTarget.retaliatoryParalysisChance ?? 0) > 0
          && random() < (affectedTarget.retaliatoryParalysisChance ?? 0);
        if (retaliated) units[actorIndex].paralyzedTurns = Math.max(1, units[actorIndex].paralyzedTurns);
        attackEntries.push(battleAttackEntry(actor.name, attackName, affectedTarget.name, damage));
        return `${affectedTarget.name} for ${formatWholeAmount(damage)}${affectedTarget.hp.eq(0) ? " (defeated)" : paralyzed ? " (paralyzed)" : ""}${retaliated ? "; Suction Cups paralyze the attacker" : ""}`;
      });
      const attackVerb = attackName === "Attack" ? "hits" : `uses ${attackName} on`;
      const weakeningReports = applyGuardianWeakening(state.level.board, units);
      message = `${actor.name} ${attackVerb} ${hitReports.join(" and ")}. Delicious red bars become shorter red bars.${weakeningReports.length > 0 ? ` ${weakeningReports.join(" ")}` : ""}`;
    }
  } else if (action.type === "oozeBelch") {
    if (!actor.oozeBelch) return failure(state, `${actor.name} cannot belch corrosive ooze.`);
    if ((actor.oozeBelchCooldown ?? 0) > 0) return failure(state, "Acid Belch is not ready.");
    const hazards = createOozeBelchHazards(state, units[actorIndex], random);
    if (hazards.length === 0) return failure(state, "There is nowhere for the corrosive ooze to land.");
    spawnedHazards.push(...hazards);
    units[actorIndex].oozeBelchCooldown = actor.oozeBelch.cooldownTurns;
    lastAttack = {
      attackName: "Corrosive Belch",
      attackType: "special",
      actionKind: "skill",
      visual: "worm-acid",
      from: { ...actor.position },
      to: { ...hazards[0].position },
    };
    message = `${actor.name} uses Corrosive Belch and ${hazards.length} puddles of stomach garbage slap onto the floor. GROSS GROSS GROSS.`;
  } else if (action.type === "summonBeast") {
    if (!actor.summonPool?.length) return failure(state, `${actor.name} cannot summon beasts.`);
    if ((actor.summonCooldown ?? 0) > 0) return failure(state, "Summon Beast is not ready.");
    const summonCount = random() < 0.3 ? 1 : 2;
    for (let summonIndex = 0; summonIndex < summonCount; summonIndex += 1) {
      const summonedUnit = summonBeast(state, units, actor, random, summonIndex);
      if (summonedUnit) {
        units.push(summonedUnit);
        summonedUnits.push(summonedUnit);
      }
    }
    if (summonedUnits.length === 0) return failure(state, "There is nowhere for a summon cage to land.");
    units[actorIndex].summonCooldown = 3;
    message = `${actor.name} casts Summon Beast. ${summonedUnits.length === 2 ? "Two cages CRASH" : "A cage CRASHES"} down containing ${summonedUnits.map((unit) => unit.name).join(" and ")}! THE CEILING HAS ANIMALS AGAIN.`;
  } else {
    message = `${actor.name} does absolutely nothing. A flawless execution of the ability known as wasting everybody's time.`;
  }

  if (actor.summonPool?.length && action.type !== "summonBeast") {
    units[actorIndex].summonCooldown = Math.max(0, (units[actorIndex].summonCooldown ?? 0) - 1);
  }
  if (actor.teleportRangeFraction && action.type !== "teleport") {
    units[actorIndex].teleportCooldown = Math.max(0, (units[actorIndex].teleportCooldown ?? 0) - 1);
  }
  if (actor.oozeBelch && action.type !== "oozeBelch") {
    units[actorIndex].oozeBelchCooldown = Math.max(0, (units[actorIndex].oozeBelchCooldown ?? 0) - 1);
  }
  if (action.type !== "weaponSkill" && (units[actorIndex].weaponCooldownRemaining ?? 0) > 0) {
    units[actorIndex].weaponCooldownRemaining = Math.max(0, units[actorIndex].weaponCooldownRemaining - 1);
  }

  const next: BattleState = {
    ...state,
    units,
    actionCount: state.actionCount + 1,
    activeUnitId: null,
    readyAt: { ...state.readyAt },
    log: [`${corrosionMessage}${corrosionMessage && message ? " " : ""}${message}`, ...state.log].slice(0, 6),
    attackLog: attackEntries.length > 0
      ? [...attackEntries, ...state.attackLog]
      : [...state.attackLog],
    lastAttack,
    hazards: decayBattleHazards([...battleHazards(state), ...spawnedHazards]),
  };
  for (const summonedUnit of summonedUnits.filter((unit) => unit.hp.gt(0))) {
    const currentTime = state.readyAt[actor.id] ?? new Decimal(0);
    next.readyAt[summonedUnit.id] = currentTime.add(
      ACTION_GAUGE.div(effectiveStat(next, summonedUnit, "speed")),
    );
  }

  const playerAlive = units.some((unit) => unit.team === "player" && unit.hp.gt(0));
  const enemyAlive = units.some((unit) => unit.team === "enemy" && unit.hp.gt(0));
  const raidBosses = units.filter((unit) => unit.team === "enemy" && unit.isRaidBoss);
  const raidBossAlive = raidBosses.some((unit) => unit.hp.gt(0));
  const raidWon = raidBosses.length > 0 ? !raidBossAlive : !enemyAlive;
  if (raidWon) {
    return { ok: true, state: {
      ...next,
      status: "won",
      log: ["BATTLE COMPLETE! The boss has been converted into floor decoration and maybe one usable organ.", ...next.log].slice(0, 6),
    } };
  }
  if (!playerAlive) {
    return { ok: true, state: {
      ...next,
      status: "lost",
      log: [
        ...(state.level.number === 4 && !units.some((unit) => unit.team === "player" && unit.hasUndeadGem)
          ? ["The Skele-King is still invulnerable. Buy the Undead Gem from the Shop and EQUIP IT before trying again!"]
          : []),
        "DEFEAT! Make numbers bigger, equip less stupidly, or insist this was a controlled experiment.",
        ...next.log,
      ].slice(0, 6),
    } };
  }

  const actingUnit = units[actorIndex];
  if (actingUnit.hp.gt(0)) {
    next.readyAt[actingUnit.id] = next.readyAt[actingUnit.id].add(
      ACTION_GAUGE.div(effectiveStat(next, actingUnit, "speed")),
    );
  }
  return { ok: true, state: beginNextTurn(next) };
}

function battleAttackEntry(
  actorName: string,
  attackName: string,
  targetName: string,
  damage: Decimal,
): string {
  return `${actorName} uses ${attackName} on ${targetName} for ${formatWholeAmount(damage)} damage`;
}

export function manualCombatAction(
  state: BattleState,
  position: Position,
  input: "primary" | "secondary",
): CombatAction | null {
  if (state.status !== "fighting") return null;
  const actor = activeUnit(state);
  if (!actor || actor.team !== "player") return null;
  const target = unitAt(state, position);

  if (input === "secondary") {
    if (!target || target.team !== "enemy") return null;
    if (actor.weaponAbilityId && actor.weaponAbilityId !== "trident-throw") {
      return { type: "weaponSkill", targetId: target.id };
    }
    if (actor.weaponThrowUnlocked && actor.hasTrident) {
      return { type: "weaponThrow", targetId: target.id };
    }
    return null;
  }

  if (target?.team === "enemy") {
    return isInAttackRange(actor, position, state)
      ? { type: "attack", targetId: target.id }
      : null;
  }
  return !target && isAdjacent(actor.position, position)
    ? { type: "move", destination: position }
    : null;
}

function rollsDodge(chance: number, random: () => number): boolean {
  const boundedChance = Math.max(0, Math.min(1, chance));
  return boundedChance > 0 && random() < boundedChance;
}

export function suggestedAction(state: BattleState): CombatAction | null {
  const actor = activeUnit(state);
  if (!actor || state.status !== "fighting") return null;
  if (actor.forcedPasses > 0 || actor.paralyzedTurns > 0) return { type: "wait" };

  if (actor.oozeBelch && (actor.oozeBelchCooldown ?? 0) <= 0) {
    return { type: "oozeBelch" };
  }

  const weakeningGuardIds = new Set(state.units
    .filter((unit) => unit.hp.gt(0) && unit.team !== actor.team)
    .flatMap((unit) => unit.weakeningGuardDefinitionId ? [unit.weakeningGuardDefinitionId] : []));
  const shieldProviderIds = new Set(state.units
    .filter((unit) => unit.hp.gt(0) && unit.team !== actor.team && unit.invulnerableWhileEnemyId)
    .flatMap((unit) => unit.invulnerableWhileEnemyId ? [unit.invulnerableWhileEnemyId] : []));
  const targets = state.units
    .filter((unit) => unit.hp.gt(0) && unit.team !== actor.team)
    .sort(
      (a, b) =>
        Number(!shieldProviderIds.has(a.definitionId)) - Number(!shieldProviderIds.has(b.definitionId)) ||
        Number(!weakeningGuardIds.has(a.definitionId)) - Number(!weakeningGuardIds.has(b.definitionId)) ||
        distanceBetweenUnits(actor, a) - distanceBetweenUnits(actor, b) ||
        a.hp.cmp(b.hp) ||
        a.id.localeCompare(b.id),
    );
  if (targets.length === 0) return { type: "wait" };

  if (actor.summonCaged) {
    const cageExit = summonCageExitStep(state, actor, targets[0]);
    return cageExit ? { type: "move", destination: cageExit } : { type: "wait" };
  }

  const livingSummons = state.units.filter((unit) =>
    unit.hp.gt(0) && unit.summonedById === actor.id
  ).length;
  if (
    actor.summonPool?.length
    && (actor.summonCooldown ?? 0) <= 0
    && livingSummons <= 2
    && summonLandingPositions(state, state.units).length > 0
  ) {
    return { type: "summonBeast" };
  }

  if (
    actor.team === "enemy"
    && actor.teleportRangeFraction
    && (actor.teleportCooldown ?? 0) <= 0
    && Math.min(...targets.map((target) => distanceBetweenUnits(actor, target))) <= actor.attackRange
  ) {
    const destination = bestTeleportDestination(state, actor, targets);
    if (destination) return { type: "teleport", destination };
  }

  if (actor.team === "enemy" && actor.attackRange > 1 && actor.canMove) {
    const retreat = rangedRetreatStep(state, actor, targets);
    if (retreat) return { type: "move", destination: retreat };
  }

  if (actor.team === "player" && actor.hasTrident && actor.weaponThrowUnlocked) {
    const tentacles = targets.filter((target) => target.requiresTridentThrow);
    if (tentacles.length > 0) {
      const throwTarget = tentacles.find((target) =>
        distanceBetweenUnits(actor, target) <= 2
        && isInWeaponThrowRange(actor, target.position, state)
      );
      if (throwTarget) return { type: "weaponThrow", targetId: throwTarget.id };
      if (actor.canMove) {
        for (const target of tentacles) {
          // The three-tile reach is needed for the Squid itself, but closing to
          // two tiles while cutting Tentacles keeps auto from taking a fragile,
          // exposed route around the ward.
          const step = firstPathStepToWeaponThrow(state, actor, target, 2);
          if (step) return { type: "move", destination: step };
        }
      }
    }
  }

  if (
    actor.team === "player"
    && actor.weaponAbilityId
    && actor.weaponAbilityId !== "trident-throw"
    && (actor.weaponCooldownRemaining ?? 0) <= 0
  ) {
    const skillTarget = targets
      .filter((target) =>
        !target.summonCaged
        && !target.requiresTridentThrow
        && !isShieldedByLivingEnemy(target, state.units)
        && isInWeaponSkillRange(actor, target.position, state)
      )
      .sort((a, b) =>
        weaponSkillTargets(state, actor, b, state.units).length
          - weaponSkillTargets(state, actor, a, state.units).length
        || Number(b.isRaidBoss) - Number(a.isRaidBoss)
        || a.hp.cmp(b.hp)
      )[0];
    if (skillTarget) return { type: "weaponSkill", targetId: skillTarget.id };
  }

  const viableStandardTargets = targets.filter((target) =>
    !target.summonCaged
    && !target.requiresTridentThrow
    && !isShieldedByLivingEnemy(target, state.units)
  );
  const standardTarget = viableStandardTargets.find((target) =>
    isInAttackRange(actor, target.position, state)
  );
  if (standardTarget) {
    return { type: "attack", targetId: standardTarget.id };
  }

  if (actor.team === "player" && actor.weaponThrowUnlocked && actor.hasTrident) {
    const throwTarget = targets
      .filter((target) =>
        !target.summonCaged
        && (!target.requiresTridentThrow || actor.hasTrident)
        && !isShieldedByLivingEnemy(target, state.units)
        && isInWeaponThrowRange(actor, target.position, state)
      )
      .sort((a, b) => Number(b.isRaidBoss) - Number(a.isRaidBoss) ||
        distanceBetweenUnits(actor, a) - distanceBetweenUnits(actor, b))[0];
    if (throwTarget) return { type: "weaponThrow", targetId: throwTarget.id };
  }

  if (!actor.canMove) return { type: "wait" };
  for (const target of viableStandardTargets) {
    const step = firstPathStepToAttack(state, actor, target);
    if (step) return { type: "move", destination: step };
  }
  return { type: "wait" };
}

export function turnPreview(state: BattleState, count = 5): string[] {
  if (state.status !== "fighting" || count <= 0) return [];
  const preview: string[] = [];
  const times = { ...state.readyAt };
  const current = activeUnit(state);
  if (current) {
    preview.push(current.id);
    times[current.id] = times[current.id].add(
      ACTION_GAUGE.div(effectiveStat(state, current, "speed")),
    );
  }
  while (preview.length < count) {
    const next = nextUnit(state.units, times);
    if (!next) break;
    preview.push(next.id);
    times[next.id] = times[next.id].add(
      ACTION_GAUGE.div(effectiveStat(state, next, "speed")),
    );
  }
  return preview;
}

export function activeUnit(state: BattleState): Unit | undefined {
  return state.units.find((unit) => unit.id === state.activeUnitId);
}

export function unitAt(state: BattleState, position: Position): Unit | undefined {
  return state.units.find(
    (unit) => unit.hp.gt(0) && occupiedPositions(unit).some((tile) => samePosition(tile, position)),
  );
}

export function occupiedPositions(unit: Unit): Position[] {
  return footprintPositions(unit.position, unit.footprintWidth, unit.footprintHeight);
}

function footprintPositions(position: Position, width: number, height: number): Position[] {
  const startX = position.x - Math.floor((width - 1) / 2);
  const startY = position.y - Math.floor((height - 1) / 2);
  const positions: Position[] = [];
  for (let y = startY; y < startY + height; y += 1) {
    for (let x = startX; x < startX + width; x += 1) {
      positions.push({ x, y });
    }
  }
  return positions;
}

export function terrainAt(state: BattleState, position: Position): Terrain {
  return state.level.board.terrain[position.y]?.[position.x] ?? "neutral";
}

export function isWallAt(state: BattleState, position: Position): boolean {
  return state.level.board.walls.some((wall) =>
    wall.x === position.x && wall.y === position.y
  );
}

export function isGapAt(state: BattleState, position: Position): boolean {
  return Boolean(state.level.board.gaps?.some((gap) => samePosition(gap, position)));
}

export function isDeploymentExcludedAt(state: BattleState, position: Position): boolean {
  const allowed = state.level.board.deploymentTiles;
  if (allowed?.length && !allowed.some((tile) => samePosition(tile, position))) return true;
  return Boolean(state.level.board.deploymentExclusions?.some((tile) => samePosition(tile, position)));
}

export function isMovementBlockedAt(state: BattleState, position: Position): boolean {
  return isWallAt(state, position) || isGapAt(state, position);
}

export function hasHomeBonus(state: BattleState, unit: Unit): boolean {
  return terrainAt(state, unit.position) === unit.team;
}

export function hasUndeadWard(state: BattleState): boolean {
  return state.level.number === 4
    && !state.units.some((unit) => unit.team === "player" && unit.hasUndeadGem);
}

export function maxHp(state: BattleState, unit: Unit): Decimal {
  return Decimal.max(1, maxHpOnBoard(state.level.board, unit).mul(weakeningMultiplier(unit)).round());
}

export function effectiveStat(
  state: BattleState,
  unit: Unit,
  stat: "attack" | "defense" | "spAttack" | "spDefense" | "speed",
): Decimal {
  return Decimal.max(
    1,
    effectiveStatOnBoard(state.level.board, unit, stat).mul(weakeningMultiplier(unit)).round(),
  );
}

export function physicalDamage(attack: Decimal, defense: Decimal): Decimal {
  return Decimal.max(1, attack.mul(1.5).sub(defense.mul(2 / 3)).floor());
}

export function specialDamage(spAttack: Decimal, spDefense: Decimal): Decimal {
  return Decimal.max(1, spAttack.mul(1.65).sub(spDefense.mul(0.6)).floor());
}

export function isAdjacent(a: Position, b: Position): boolean {
  return manhattan(a, b) === 1;
}

export function isInAttackRange(
  unit: Unit,
  target: Position,
  state?: BattleState,
): boolean {
  const targetUnit = state ? unitAt(state, target) : undefined;
  const targetTiles = targetUnit ? occupiedPositions(targetUnit) : [target];
  return positionsCanAttack(
    occupiedPositions(unit),
    targetTiles,
    unit.attackRange,
    unit.attackPattern,
    state,
  );
}

export function isInWeaponThrowRange(
  unit: Unit,
  target: Position,
  state: BattleState,
): boolean {
  if (!unit.weaponThrowUnlocked || !unit.hasTrident) return false;
  const targetUnit = unitAt(state, target);
  const targetTiles = targetUnit ? occupiedPositions(targetUnit) : [target];
  const blockingTiles = new Set(state.units
    .filter((candidate) =>
      candidate.hp.gt(0)
      && candidate.blocksWeaponThrows
      && candidate.id !== targetUnit?.id
      && candidate.id !== unit.id
    )
    .flatMap(occupiedPositions)
    .map(positionKey));
  return occupiedPositions(unit).some((origin) => targetTiles.some((targetTile) => {
    if (origin.x !== targetTile.x && origin.y !== targetTile.y) return false;
    if (manhattan(origin, targetTile) > TRIDENT_THROW_RANGE) return false;
    const path = lineBetween(origin, targetTile).slice(1, -1);
    return path.every((position) =>
      !isWallAt(state, position) && !blockingTiles.has(positionKey(position))
    );
  }));
}

export function isInWeaponSkillRange(
  unit: Unit,
  target: Position,
  state: BattleState,
): boolean {
  const skill = weaponSkill(unit.weaponAbilityId);
  if (!skill || (unit.weaponCooldownRemaining ?? 0) > 0) return false;
  if (skill.id === "trident-throw") return isInWeaponThrowRange(unit, target, state);
  const targetUnit = unitAt(state, target);
  const targetTiles = targetUnit ? occupiedPositions(targetUnit) : [target];
  return positionsCanAttack(
    occupiedPositions(unit),
    targetTiles,
    skill.range,
    skill.attackPattern,
    state,
  );
}

function weaponSkillTargets(
  state: BattleState,
  actor: Unit,
  target: Unit,
  units: Unit[],
): Unit[] {
  const skill = weaponSkill(actor.weaponAbilityId);
  if (!skill) return [target];
  if (skill.area === "single" || skill.area === "trident") return [target];
  let area: Position[] = [];
  if (skill.area === "impact-plus") {
    const center = closestOccupiedPosition(target, actor.position);
    area = [
      center,
      { x: center.x + 1, y: center.y },
      { x: center.x - 1, y: center.y },
      { x: center.x, y: center.y + 1 },
      { x: center.x, y: center.y - 1 },
    ];
  } else if (skill.area === "surround") {
    const occupied = occupiedPositions(actor);
    const actorTiles = new Set(occupied.map(positionKey));
    area = occupied.flatMap((position) =>
      Array.from({ length: 9 }, (_, index) => ({
        x: position.x + index % 3 - 1,
        y: position.y + Math.floor(index / 3) - 1,
      }))
    ).filter((position) => !actorTiles.has(positionKey(position)));
  } else {
    const origin = closestOccupiedPosition(actor, target.position);
    const dx = target.position.x - origin.x;
    const dy = target.position.y - origin.y;
    const direction = Math.abs(dx) >= Math.abs(dy)
      ? { x: Math.sign(dx) || 1, y: 0 }
      : { x: 0, y: Math.sign(dy) || 1 };
    const perpendicular = { x: -direction.y, y: direction.x };
    for (let depth = 1; depth <= 2; depth += 1) {
      for (let width = -1; width <= 1; width += 1) {
        area.push({
          x: origin.x + direction.x * depth + perpendicular.x * width,
          y: origin.y + direction.y * depth + perpendicular.y * width,
        });
      }
    }
  }
  const areaKeys = new Set(area.filter((position) => isOnBoard(state, position)).map(positionKey));
  return units.filter((candidate) =>
    candidate.hp.gt(0)
    && candidate.team !== actor.team
    && occupiedPositions(candidate).some((position) => areaKeys.has(positionKey(position)))
  );
}

export const TRAINING_PERCENT_PER_LEVEL = 5;

export function trainingMultiplier(level: number): Decimal {
  return new Decimal(1 + TRAINING_PERCENT_PER_LEVEL / 100).pow(Math.max(0, Math.floor(level)));
}

export function applyTraining(
  base: Stats,
  training: TrainingLevels,
  fishBonuses: TrainingLevels = EMPTY_TRAINING,
): Stats {
  return {
    hp: base.hp.add(fishBonuses.hp * FISH_BASE_STAT_BONUS).mul(trainingMultiplier(training.hp)),
    stamina: base.stamina.add(fishBonuses.stamina * FISH_BASE_STAT_BONUS).mul(trainingMultiplier(training.stamina)),
    attack: base.attack.add(fishBonuses.attack * FISH_BASE_STAT_BONUS).mul(trainingMultiplier(training.attack)),
    defense: base.defense.add(fishBonuses.defense * FISH_BASE_STAT_BONUS).mul(trainingMultiplier(training.defense)),
    spAttack: base.spAttack.add(fishBonuses.spAttack * FISH_BASE_STAT_BONUS).mul(trainingMultiplier(training.spAttack)),
    spDefense: base.spDefense.add(fishBonuses.spDefense * FISH_BASE_STAT_BONUS).mul(trainingMultiplier(training.spDefense)),
    speed: base.speed.add(fishBonuses.speed * FISH_BASE_STAT_BONUS).mul(trainingMultiplier(training.speed)),
    luck: base.luck.add(fishBonuses.luck * FISH_BASE_STAT_BONUS).mul(trainingMultiplier(training.luck)),
  };
}

function maxHpOnBoard(board: BoardDefinition, unit: Unit): Decimal {
  return boost(board, unit.stats.hp, unit);
}

function effectiveStatOnBoard(
  board: BoardDefinition,
  unit: Unit,
  stat: "attack" | "defense" | "spAttack" | "spDefense" | "speed",
): Decimal {
  return Decimal.max(1, boost(board, unit.stats[stat], unit));
}

function weakeningMultiplier(unit: Unit, stacks = unit.weakeningStacks ?? 0): Decimal {
  const defeatedGuards = Math.max(0, Math.floor(stacks));
  const weakening = Math.max(0, Math.min(0.3, unit.weakeningPerGuardDefeat ?? 0));
  return new Decimal(Math.max(0.25, 1 - defeatedGuards * weakening));
}

function applyGuardianWeakening(board: BoardDefinition, units: Unit[]): string[] {
  const reports: string[] = [];
  for (const boss of units) {
    if (boss.hp.lte(0) || !boss.weakeningGuardDefinitionId) continue;
    const guardCount = Math.max(0, Math.floor(boss.weakeningGuardCount ?? 0));
    if (guardCount === 0) continue;
    const livingGuards = units.filter((unit) =>
      unit.team === boss.team
      && unit.definitionId === boss.weakeningGuardDefinitionId
      && unit.hp.gt(0)
    ).length;
    const defeatedGuards = Math.min(guardCount, Math.max(0, guardCount - livingGuards));
    const previousStacks = Math.max(0, Math.floor(boss.weakeningStacks ?? 0));
    if (defeatedGuards <= previousStacks) continue;

    const unweakenedMaximum = maxHpOnBoard(board, boss);
    const previousMaximum = Decimal.max(
      1,
      unweakenedMaximum.mul(weakeningMultiplier(boss, previousStacks)).round(),
    );
    const healthRatio = Decimal.min(1, Decimal.max(0, boss.hp.div(previousMaximum)));
    boss.weakeningStacks = defeatedGuards;
    const weakenedMaximum = Decimal.max(
      1,
      unweakenedMaximum.mul(weakeningMultiplier(boss)).round(),
    );
    boss.hp = Decimal.min(weakenedMaximum, weakenedMaximum.mul(healthRatio));
    reports.push(`${boss.name} slumps as its fallen guardian drains its power. Turns out the small blob was full of BIG NUMBERS.`);
  }
  return reports;
}

function boost(board: BoardDefinition, value: Decimal, unit: Unit): Decimal {
  const terrain = board.terrain[unit.position.y]?.[unit.position.x] ?? "neutral";
  return terrain === unit.team ? value.mul(HOME_ZONE_BONUS).round() : value;
}

function beginNextTurn(state: BattleState): BattleState {
  const next = nextUnit(state.units, state.readyAt);
  return { ...state, activeUnitId: next?.id ?? null };
}

function nextUnit(units: Unit[], times: Record<string, Decimal>): Unit | undefined {
  return units
    .filter((unit) => unit.hp.gt(0))
    .sort(
      (a, b) =>
        times[a.id].cmp(times[b.id]) ||
        b.stats.speed.cmp(a.stats.speed) ||
        a.id.localeCompare(b.id),
    )[0];
}

function neighbors(position: Position): Position[] {
  return [
    { x: position.x, y: position.y - 1 },
    { x: position.x + 1, y: position.y },
    { x: position.x, y: position.y + 1 },
    { x: position.x - 1, y: position.y },
  ];
}

function isOnBoard(state: BattleState, position: Position): boolean {
  return (
    position.x >= 0 &&
    position.x < state.level.board.width &&
    position.y >= 0 &&
    position.y < state.level.board.height
  );
}

function isDeployed(state: BattleState, unit: Unit): boolean {
  return occupiedPositions(unit).every((position) =>
    isOnBoard(state, position) && !isMovementBlockedAt(state, position)
  );
}

function manhattan(a: Position, b: Position): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function chebyshev(a: Position, b: Position): number {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
}

function positionKey(position: Position): string {
  return `${position.x},${position.y}`;
}

function samePosition(a: Position, b: Position): boolean {
  return a.x === b.x && a.y === b.y;
}

function defaultFacing(unit: Unit): HorizontalFacing {
  return unit.team === "player" ? "right" : "left";
}

function horizontalFacing(
  from: Position,
  toward: Position,
  current: HorizontalFacing,
): HorizontalFacing {
  if (toward.x < from.x) return "left";
  if (toward.x > from.x) return "right";
  return current;
}

function cloneUnit(unit: Unit): Unit {
  return { ...unit, position: { ...unit.position }, stats: { ...unit.stats } };
}

function summonBeast(
  state: BattleState,
  units: Unit[],
  actor: Unit,
  random: () => number,
  summonIndex = 0,
): Unit | null {
  const pool = actor.summonPool ?? [];
  const definition = pool.length > 0
    ? getEnemy(pool[randomIndex(pool.length, random)])
    : undefined;
  const footprintWidth = validFootprintDimension(definition?.footprintWidth ?? definition?.footprint);
  const footprintHeight = validFootprintDimension(definition?.footprintHeight ?? definition?.footprint);
  const positions = summonLandingPositions(state, units, footprintWidth, footprintHeight);
  const position = positions[randomIndex(positions.length, random)];
  if (!definition || !position) return null;
  const unit: Unit = {
    id: `summoned-${definition.id}-${state.actionCount + 1}-${summonIndex + 1}`,
    definitionId: definition.id,
    name: definition.name,
    team: "enemy",
    attackRange: validAttackRange(definition.attackRange),
    attackType: definition.attackType ?? "physical",
    attackName: definition.attackName ?? "Attack",
    attackPattern: definition.attackPattern ?? "orthogonal",
    attackArea: definition.attackArea,
    isRaidBoss: false,
    footprint: validFootprint(definition.footprint),
    footprintWidth,
    footprintHeight,
    canMove: definition.canMove !== false,
    weaponThrowUnlocked: false,
    hasTrident: false,
    weaponAbilityId: undefined,
    weaponCooldownRemaining: 0,
    hasUndeadGem: false,
    retaliatoryParalysisChance: undefined,
    forcedPasses: 0,
    paralyzedTurns: 0,
    corrosionTurns: 0,
    corrosionDamage: new Decimal(0),
    paralysisChance: definition.paralysisChance,
    summonPool: definition.summonPool,
    summonCooldown: definition.summonPool ? 0 : undefined,
    teleportRangeFraction: definition.teleportRangeFraction,
    teleportCooldown: definition.teleportRangeFraction ? 0 : undefined,
    oozeBelch: definition.oozeBelch,
    oozeBelchCooldown: definition.oozeBelch ? 0 : undefined,
    summonCaged: true,
    summonedById: actor.id,
    requiresTridentThrow: Boolean(definition.requiresTridentThrow),
    invulnerableWhileEnemyId: definition.invulnerableWhileEnemyId,
    invulnerableWhileSummons: Boolean(definition.invulnerableWhileSummons),
    concealsBossIdentity: Boolean(definition.concealsBossIdentity),
    blocksWeaponThrows: Boolean(definition.blocksWeaponThrows),
    weakeningGuardDefinitionId: definition.weakeningGuardDefinitionId,
    weakeningPerGuardDefeat: definition.weakeningPerGuardDefeat,
    weakeningGuardCount: definition.weakeningGuardCount,
    weakeningStacks: 0,
    facing: "left",
    position: { ...position },
    stats: {
      ...definition.stats,
      speed: definition.stats.speed.mul(1.12).ceil(),
    },
    hp: new Decimal(0),
  };
  unit.hp = maxHpOnBoard(state.level.board, unit);
  return unit;
}

function summonLandingPositions(
  state: BattleState,
  units: Unit[],
  footprintWidth = 1,
  footprintHeight = 1,
): Position[] {
  const occupied = new Set(
    units.filter((unit) => unit.hp.gt(0)).flatMap(occupiedPositions).map(positionKey),
  );
  const open = (position: Position) => footprintPositions(
    position,
    footprintWidth,
    footprintHeight,
  ).every((tile) =>
    isOnBoard(state, tile)
    && !isMovementBlockedAt(state, tile)
    && !occupied.has(positionKey(tile))
  );
  const result: Position[] = [];
  for (let y = 0; y < state.level.board.height; y += 1) {
    for (let x = 0; x < state.level.board.width; x += 1) {
      const position = { x, y };
      if (open(position) && neighbors(position).some(open)) result.push(position);
    }
  }
  return result;
}

function bestTeleportDestination(
  state: BattleState,
  actor: Unit,
  targets: Unit[],
): Position | null {
  const range = teleportRange(state, actor);
  const candidates: Array<{ position: Position; targetDistance: number; attackReady: boolean }> = [];
  for (let y = 0; y < state.level.board.height; y += 1) {
    for (let x = 0; x < state.level.board.width; x += 1) {
      const position = { x, y };
      if (
        samePosition(position, actor.position)
        || chebyshev(actor.position, position) > range
        || isMovementBlockedAt(state, position)
        || unitAt(state, position)
      ) continue;
      const targetDistance = Math.min(...targets.map((target) => manhattan(position, target.position)));
      const movedActor = { ...actor, position };
      candidates.push({
        position,
        targetDistance,
        attackReady: targets.some((target) => isInAttackRange(movedActor, target.position, state)),
      });
    }
  }
  candidates.sort((left, right) =>
    Number(right.attackReady) - Number(left.attackReady)
    || Math.min(actor.attackRange, right.targetDistance) - Math.min(actor.attackRange, left.targetDistance)
    || chebyshev(actor.position, right.position) - chebyshev(actor.position, left.position)
    || left.position.y - right.position.y
    || left.position.x - right.position.x
  );
  return candidates[0]?.position ?? null;
}

function teleportRange(state: BattleState, actor: Unit): number {
  if (!actor.teleportRangeFraction) return 0;
  return Math.max(1, Math.floor(
    Math.max(state.level.board.width, state.level.board.height) * actor.teleportRangeFraction,
  ));
}

function summonCageExitStep(state: BattleState, actor: Unit, target: Unit): Position | null {
  return openMovementNeighbors(state, actor)
    .sort((left, right) => manhattan(left, target.position) - manhattan(right, target.position))[0]
    ?? null;
}

function rangedRetreatStep(state: BattleState, actor: Unit, targets: Unit[]): Position | null {
  const currentDistance = Math.min(...targets.map((target) => distanceBetweenUnits(actor, target)));
  if (currentDistance > 1) return null;
  const candidates = openMovementNeighbors(state, actor)
    .map((position) => ({
      position,
      distance: Math.min(...targets.map((target) => manhattan(position, target.position))),
    }))
    .filter((candidate) => candidate.distance > currentDistance)
    .sort((left, right) => right.distance - left.distance);
  return candidates[0]?.position ?? null;
}

function openMovementNeighbors(state: BattleState, actor: Unit): Position[] {
  return neighbors(actor.position).filter((position) => {
    const movedActor = { ...actor, position };
    return occupiedPositions(movedActor).every((tile) => {
      if (!isOnBoard(state, tile) || isMovementBlockedAt(state, tile)) return false;
      const occupant = unitAt(state, tile);
      return !occupant || occupant.id === actor.id;
    });
  });
}

function frontThreePositions(from: Position, target: Position): Position[] {
  const direction = {
    x: Math.sign(target.x - from.x),
    y: Math.sign(target.y - from.y),
  };
  const center = { x: from.x + direction.x, y: from.y + direction.y };
  const perpendicular = { x: -direction.y, y: direction.x };
  return [
    center,
    { x: center.x + perpendicular.x, y: center.y + perpendicular.y },
    { x: center.x - perpendicular.x, y: center.y - perpendicular.y },
  ];
}

function closestOccupiedPosition(unit: Unit, target: Position): Position {
  return occupiedPositions(unit).sort((left, right) =>
    manhattan(left, target) - manhattan(right, target)
    || left.y - right.y
    || left.x - right.x
  )[0];
}

function randomIndex(length: number, random: () => number): number {
  if (length <= 1) return 0;
  return Math.min(length - 1, Math.max(0, Math.floor(random() * length)));
}

function validAttackRange(value: number | undefined): number {
  return Number.isFinite(value) ? Math.max(1, Math.floor(value!)) : 1;
}

function validFootprint(value: number | undefined): number {
  const footprint = Number.isFinite(value) ? Math.max(1, Math.floor(value!)) : 1;
  return footprint % 2 === 0 ? footprint + 1 : footprint;
}

function validFootprintDimension(value: number | undefined): number {
  return Number.isFinite(value) ? Math.max(1, Math.floor(value!)) : 1;
}

function attackPatternLabel(pattern: AttackPattern): string {
  if (pattern === "any") return "line-of-sight";
  if (pattern === "eight-way") return "straight or diagonal";
  return "orthogonal";
}

function positionsCanAttack(
  origins: Position[],
  targets: Position[],
  range: number,
  pattern: AttackPattern,
  state?: BattleState,
): boolean {
  return origins.some((origin) => targets.some((target) => {
    const dx = Math.abs(origin.x - target.x);
    const dy = Math.abs(origin.y - target.y);
    if (dx === 0 && dy === 0) return false;
    const distance = pattern === "orthogonal" ? dx + dy : Math.max(dx, dy);
    const matchesPattern = pattern === "any" ||
      (pattern === "orthogonal" ? dx === 0 || dy === 0 : dx === 0 || dy === 0 || dx === dy);
    if (!matchesPattern || distance > range) return false;
    return !state || hasLineOfSight(state, origin, target);
  }));
}

function hasLineOfSight(state: BattleState, from: Position, to: Position): boolean {
  const path = lineBetween(from, to);
  return path.slice(1, -1).every((position) => !isWallAt(state, position));
}

function lineBetween(from: Position, to: Position): Position[] {
  const positions: Position[] = [];
  let x = from.x;
  let y = from.y;
  const dx = Math.abs(to.x - from.x);
  const dy = Math.abs(to.y - from.y);
  const stepX = from.x < to.x ? 1 : -1;
  const stepY = from.y < to.y ? 1 : -1;
  let error = dx - dy;
  while (true) {
    positions.push({ x, y });
    if (x === to.x && y === to.y) break;
    const doubleError = error * 2;
    if (doubleError > -dy) {
      error -= dy;
      x += stepX;
    }
    if (doubleError < dx) {
      error += dx;
      y += stepY;
    }
  }
  return positions;
}

function distanceBetweenUnits(a: Unit, b: Unit): number {
  return Math.min(...occupiedPositions(a).flatMap((from) =>
    occupiedPositions(b).map((to) => manhattan(from, to))
  ));
}

function isShieldedByLivingEnemy(target: Unit, units: Unit[]): boolean {
  if (target.invulnerableWhileSummons && units.some((unit) =>
    unit.hp.gt(0) && unit.summonedById === target.id
  )) return true;
  return Boolean(target.invulnerableWhileEnemyId) && units.some((unit) =>
    unit.hp.gt(0)
    && unit.team === target.team
    && unit.definitionId === target.invulnerableWhileEnemyId
  );
}

export function isUnitShielded(state: BattleState, target: Unit): boolean {
  return isShieldedByLivingEnemy(target, state.units);
}

function firstPathStepToWeaponThrow(
  state: BattleState,
  actor: Unit,
  target: Unit,
  preferredRange = TRIDENT_THROW_RANGE,
): Position | null {
  const occupied = new Set(
    state.units
      .filter((unit) => unit.hp.gt(0) && unit.id !== actor.id)
      .flatMap(occupiedPositions)
      .map(positionKey),
  );
  const queue: Array<{ position: Position; firstStep: Position | null }> = [
    { position: actor.position, firstStep: null },
  ];
  const visited = new Set([positionKey(actor.position)]);

  while (queue.length > 0) {
    const current = queue.shift()!;
    const candidates = neighbors(current.position).sort((left, right) =>
      manhattan(left, target.position) - manhattan(right, target.position)
      || left.y - right.y
      || left.x - right.x
    );
    for (const position of candidates) {
      const key = positionKey(position);
      if (visited.has(key)) continue;
      const movedActor = { ...actor, position };
      const blocked = occupiedPositions(movedActor).some((tile) =>
        !isOnBoard(state, tile) || isMovementBlockedAt(state, tile) || occupied.has(positionKey(tile))
      );
      if (blocked) continue;
      visited.add(key);
      const firstStep = current.firstStep ?? position;
      if (
        distanceBetweenUnits(movedActor, target) <= preferredRange
        && isInWeaponThrowRange(movedActor, target.position, state)
      ) return firstStep;
      queue.push({ position, firstStep });
    }
  }
  return null;
}

function firstPathStepToAttack(
  state: BattleState,
  actor: Unit,
  target: Unit,
): Position | null {
  const occupied = new Set(
    state.units
      .filter((unit) => unit.hp.gt(0) && unit.id !== actor.id)
      .flatMap(occupiedPositions)
      .map(positionKey),
  );
  const queue: Array<{ position: Position; firstStep: Position | null }> = [
    { position: actor.position, firstStep: null },
  ];
  const visited = new Set([positionKey(actor.position)]);

  while (queue.length > 0) {
    const current = queue.shift()!;
    const candidates = neighbors(current.position).sort((a, b) => {
      const targetDistance = manhattan(a, target.position) - manhattan(b, target.position);
      if (targetDistance !== 0) return targetDistance;
      const territoryBias = actor.team === "player" ? b.x - a.x : a.x - b.x;
      return territoryBias || a.y - b.y;
    });
    for (const position of candidates) {
      const key = positionKey(position);
      if (visited.has(key)) continue;
      const movedActor = { ...actor, position };
      const blocked = occupiedPositions(movedActor).some((tile) =>
        !isOnBoard(state, tile) || isMovementBlockedAt(state, tile) || occupied.has(positionKey(tile))
      );
      if (blocked) continue;
      visited.add(key);
      const firstStep = current.firstStep ?? position;
      if (isInAttackRange(movedActor, target.position, state)) return firstStep;
      queue.push({ position, firstStep });
    }
  }
  return null;
}

function failure(state: BattleState, error: string): ActionResult {
  return { ok: false, state, error };
}
