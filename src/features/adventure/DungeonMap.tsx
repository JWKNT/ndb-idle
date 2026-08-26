import { useState } from "react";
import type { SpriteName } from "@/content/sprites";
import type { AdventureState, DungeonRoom, ExitDirection } from "@/game/adventure/types";
import type { Position } from "@/game/types";
import { ringForPosition } from "@/game/adventure";
import {
  DIRECTION_OFFSETS,
  oppositeDirection,
  parsePositionKey,
  roomKey,
} from "@/game/adventure/geometry";
import { Sprite } from "@/features/shared/Sprite";
import { DiePips } from "@/features/shared/DiePips";

export function DungeonMap({ adventure }: { adventure: AdventureState }) {
  const [expanded, setExpanded] = useState(false);
  const isWaterDungeon = adventure.dungeonTheme === "water";
  const isEarthDungeon = (adventure.dungeonTheme ?? "earth") === "earth";
  const rooms = Object.values(adventure.rooms).filter((room) => !room.mapHidden);
  const mapPositions = [
    ...rooms.map((room) => room.position),
    ...(adventure.questTarget ? [adventure.questTarget.position] : []),
    ...(adventure.cartographerSurveyTargets ?? []),
    ...(adventure.chalkRevealedPositions ?? []),
  ];
  const mappedRoomKeys = new Set([
    ...rooms.map((room) => room.key),
    ...(adventure.chalkRevealedPositions ?? []).map(roomKey),
  ]);
  const visibleExitsByRoom = Object.fromEntries(
    (adventure.chalkRevealedPositions ?? []).map((position) => [
      roomKey(position),
      [...(adventure.chalkMappedExits?.[roomKey(position)] ?? [])],
    ]),
  ) as Record<string, ExitDirection[]>;
  for (const room of rooms) {
    visibleExitsByRoom[room.key] = [...new Set([
      ...(visibleExitsByRoom[room.key] ?? []),
      ...room.exits.map((exit) => exit.direction),
    ])];
  }
  for (const [key, directions] of Object.entries(visibleExitsByRoom)) {
    const position = parsePositionKey(key);
    for (const direction of [...directions]) {
      const offset = DIRECTION_OFFSETS[direction];
      const neighborKey = roomKey({ x: position.x + offset.x, y: position.y + offset.y });
      if (!mappedRoomKeys.has(neighborKey)) continue;
      const reciprocal = oppositeDirection(direction);
      const neighborExits = visibleExitsByRoom[neighborKey] ?? [];
      if (!neighborExits.includes(reciprocal)) {
        visibleExitsByRoom[neighborKey] = [...neighborExits, reciprocal];
      }
    }
  }
  const minimumX = Math.min(...mapPositions.map((position) => position.x));
  const maximumX = Math.max(...mapPositions.map((position) => position.x));
  const minimumY = Math.min(...mapPositions.map((position) => position.y));
  const maximumY = Math.max(...mapPositions.map((position) => position.y));
  const columns = maximumX - minimumX + 1;
  const rows = maximumY - minimumY + 1;
  const cells: Position[] = [];

  for (let y = minimumY; y <= maximumY; y += 1) {
    for (let x = minimumX; x <= maximumX; x += 1) cells.push({ x, y });
  }

  return (
    <section className={`dungeon-map ${expanded ? "is-expanded" : ""}`} aria-label="Explored dungeon map">
      <header>
        <h2>Dungeon map</h2>
        <button onClick={() => setExpanded((current) => !current)} type="button">
          {expanded ? "Collapse" : "Expand"}
        </button>
      </header>
      <div className="dungeon-map-viewport">
        <div
          className="dungeon-map-grid"
          style={{
            gridTemplateColumns: `repeat(${columns}, var(--map-cell-size))`,
            gridTemplateRows: `repeat(${rows}, var(--map-cell-size))`,
          }}
        >
          {cells.map((position, index) => {
            const room = rooms.find((candidate) => positionsEqual(candidate.position, position));
            const showStartMark = Boolean(room && isEarthDungeon && isStartingRoom(room));
            const questTarget = Boolean(
              adventure.questTarget && positionsEqual(adventure.questTarget.position, position),
            );
            const marker = room ? roomMarker(room, showStartMark) : null;
            const surveyTarget = (adventure.cartographerSurveyTargets ?? []).some((target) => positionsEqual(target, position));
            const surveyVisited = (adventure.cartographerSurveyVisited ?? []).some((target) => positionsEqual(target, position));
            const chalkRevealed = (adventure.chalkRevealedPositions ?? []).some((target) => positionsEqual(target, position));
            const mappedExits = visibleExitsByRoom[roomKey(position)] ?? [];
            return room ? (
              <div
                className={`dungeon-map-room map-depth-${Math.min(5, Math.max(0, room.ring))} ${isWaterDungeon ? "is-water-depth" : ""} ${room.kind === "towerExterior" ? "is-tower-landmark" : ""} ${room.key === adventure.currentRoomKey ? "is-current" : ""} ${questTarget ? "is-quest-target" : ""}`}
                key={room.key}
                title={`${marker?.label ?? "Explored room"}; exits ${mappedExits.join(", ")}`}
              >
                {mappedExits.map((direction) => (
                  <span
                    aria-hidden="true"
                    className={`map-tunnel map-tunnel-${direction}`}
                    key={direction}
                  />
                ))}
                {room.kind === "dice" ? (
                  <span aria-label={room.diceRolling ? "Dice rolling" : room.diceRolled ? `Dice rolled ${room.diceValues?.[0]} and ${room.diceValues?.[1]}` : "Unrolled dice"} className="map-dice-pair">
                    {([0, 1] as const).map((dieIndex) => {
                      const value = room.diceRolled && !room.diceRolling ? room.diceValues?.[dieIndex] : undefined;
                      return (
                        <i className="map-die-face" key={dieIndex}>
                          {value ? <DiePips className="map-die-pips" value={value} /> : "?"}
                        </i>
                      );
                    })}
                  </span>
                ) : marker && (
                  <span className="map-room-marker">
                    <Sprite name={marker.sprite} />
                  </span>
                )}
              </div>
            ) : questTarget ? (
              <div
                className="dungeon-map-room is-quest-target is-unexplored-target"
                key="quest-target"
                title={`${adventure.questTarget?.questId === "retrieve-lost-item"
                  ? "Retrieve Lost Item portal"
                  : adventure.questTarget?.questId === "find-miner"
                    ? "Miner destination"
                    : adventure.questTarget?.questId === "enter-tower"
                      ? "Forge portal destination"
                    : "Rescue Me destination"}; route unexplored`}
              >
                <span className="map-room-marker">
                  <Sprite name="questScroll" />
                </span>
              </div>
            ) : surveyTarget ? (
              <div className={`dungeon-map-room is-survey-target ${surveyVisited ? "is-surveyed" : ""}`} key={`survey-${position.x}-${position.y}`} title="Cartographer survey point">
                <span className="map-room-marker"><Sprite name="mapmakerChalk" /></span>
              </div>
            ) : chalkRevealed ? (
              <div
                className={`dungeon-map-room is-chalk-mapped map-depth-${Math.min(5, ringForPosition(position))}`}
                key={`chalk-${position.x}-${position.y}`}
                title={`Mapped room; exits ${mappedExits.join(", ")}`}
              >
                {mappedExits.map((direction) => (
                  <span
                    aria-hidden="true"
                    className={`map-tunnel map-tunnel-${direction}`}
                    key={direction}
                  />
                ))}
              </div>
            ) : <span className="dungeon-map-empty" key={`empty-${index}`} />;
          })}
        </div>
      </div>
    </section>
  );
}

function roomMarker(
  room: DungeonRoom,
  showStartMark: boolean,
): { label: string; sprite: SpriteName } | null {
  if (showStartMark) return { label: "Start", sprite: "loweringRope" };
  if (room.kind === "treasure") return { label: "Treasure", sprite: "chest" };
  if (room.kind === "regen") return { label: "Spring", sprite: "hotSpring" };
  if (room.kind === "rescue" || room.kind === "portal") return { label: "Quest", sprite: "questScroll" };
  if (room.kind === "lostItem") return { label: "Lost item", sprite: "fishingRod" };
  if (room.kind === "offering") return { label: "Offering", sprite: "waterOffering" };
  if (room.kind === "mermanThrone") return { label: "Throne", sprite: "gearTrident" };
  if (room.kind === "shopkeeper") return { label: "Shopkeeper", sprite: "shopkeeper" };
  if (room.kind === "waterPortal") return { label: "Water portal", sprite: "teleport" };
  if (room.kind === "forgePortal") return { label: "Forge portal", sprite: "teleport" };
  if (room.kind === "forgeArena") return { label: "Forge arena", sprite: "forgeGate" };
  if (room.kind === "forgeTreasure") return { label: "Forge vault", sprite: "chest" };
  if (room.kind === "forgeBlueprint") return { label: "Blueprint reliquary", sprite: "blacksmithBlueprints" };
  if (room.kind === "lottery") return { label: "Lottery", sprite: "lotteryWheel" };
  if (room.kind === "dice") return { label: "Dice", sprite: "dice" };
  if (room.kind === "blacksmith") return { label: "Blacksmith", sprite: "blacksmithAnvil" };
  if (room.kind === "miner") return { label: "Miner cave", sprite: "miner" };
  if (room.kind === "hammerVault") return { label: "Hammer vault", sprite: "questScroll" };
  if (room.kind === "potionmaster") return { label: "Potionmaster", sprite: "potionLuck2" };
  if (room.kind === "oddityBrewer") return { label: "Charles", sprite: "potionMystery" };
  if (room.kind === "cartographer") return { label: "Cartographer", sprite: "mapTable" };
  if (room.kind === "angler") return { label: "Angler", sprite: "tackleBox" };
  if (room.kind === "towerExterior") return { label: "Tower", sprite: "towerDoor" };
  return null;
}

function isStartingRoom(room: DungeonRoom): boolean {
  return room.position.x === 0 && room.position.y === 0;
}

function positionsEqual(a: Position, b: Position): boolean {
  return a.x === b.x && a.y === b.y;
}
