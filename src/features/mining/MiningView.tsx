import type { CSSProperties } from "react";
import { getPlayer } from "@/content/players";
import { formatWholeAmount } from "@/game/numbers";
import { frontierMiningRocks, type MiningState } from "@/game/mining";
import {
  getPartyMember,
  memberMaxHp,
  memberMaxStamina,
  partyMemberIds,
  type ProgressionState,
} from "@/game/progression";
import type { PlayerId, Position } from "@/game/types";
import { Sprite } from "@/features/shared/Sprite";
import { miningSpritesForRoom, miningVisualBand } from "@/content/mining-sprites";

interface MiningViewProps {
  progression: ProgressionState;
  mining: MiningState | null;
  waitingMemberId: PlayerId | null;
  unavailableMembers: PlayerId[];
  onChooseMember: (memberId: PlayerId) => void;
  onStart: (memberId: PlayerId) => void;
  onTile: (position: Position) => void;
  onToggleAuto: () => void;
  onToggleRestart: (enabled: boolean) => void;
  onStop: () => void;
}

export function MiningView({
  progression,
  mining,
  waitingMemberId,
  unavailableMembers,
  onChooseMember,
  onStart,
  onTile,
  onToggleAuto,
  onToggleRestart,
  onStop,
}: MiningViewProps) {
  if (mining) {
    return (
      <ActiveMiningView
        mining={mining}
        onStop={onStop}
        onTile={onTile}
        onToggleAuto={onToggleAuto}
        onToggleRestart={onToggleRestart}
        progression={progression}
      />
    );
  }

  const selectedId = progression.party[progression.selectedMiningMemberId]
    ? progression.selectedMiningMemberId
    : partyMemberIds(progression)[0] ?? "knight";
  const waitingId = waitingMemberId && progression.party[waitingMemberId]
    ? waitingMemberId
    : null;
  const waitingProgress = waitingId ? getPartyMember(progression, waitingId) : null;

  return (
    <main className="simple-page mining-view mining-setup-view">
      <header className="page-heading"><h1>Mining</h1></header>
      <div className="mining-setup-layout">
        <section className="info-box mining-assignment-card">
          <div className="mining-pickaxe-mark" aria-hidden="true"><Sprite name="pickaxe" /></div>
          {waitingId && waitingProgress ? (
            <>
              <h2>Returning when healed</h2>
              <div className="mining-member-line">
                <Sprite name={waitingId} />
                <strong>{getPlayer(waitingId).name}</strong>
                <span>
                  {formatWholeAmount(waitingProgress.hp)}/{formatWholeAmount(memberMaxHp(progression, waitingId))} HP · {" "}
                  {formatWholeAmount(waitingProgress.stamina)}/{formatWholeAmount(memberMaxStamina(progression, waitingId))} Stamina
                </span>
              </div>
              <p>Mining will restart from Room 1 at full HP and stamina.</p>
              <button onClick={onStop} type="button">Cancel automatic restart</button>
            </>
          ) : (
            <>
              <h2>Send one party member</h2>
              <div className="mining-member-list">
                {partyMemberIds(progression).map((id) => {
                  const unavailable = unavailableMembers.includes(id);
                  const member = getPartyMember(progression, id);
                  return (
                    <button
                      className={selectedId === id ? "is-selected" : ""}
                      disabled={unavailable}
                      key={id}
                      onClick={() => onChooseMember(id)}
                      type="button"
                    >
                      <Sprite name={id} />
                      <span>
                        <strong>{getPlayer(id).name}</strong>
                        <small>{formatWholeAmount(member.hp)}/{formatWholeAmount(memberMaxHp(progression, id))} HP{unavailable ? " · currently dispatched" : ""}</small>
                      </span>
                    </button>
                  );
                })}
              </div>
              <label className="plain-option mining-restart-option">
                <input
                  checked={progression.restartMiningOnFullHp}
                  onChange={(event) => onToggleRestart(event.target.checked)}
                  type="checkbox"
                />
                Restart mining from Room 1 after the run ends
              </label>
              <button
                disabled={unavailableMembers.includes(selectedId)}
                onClick={() => onStart(selectedId)}
                type="button"
              >
                Enter the mine
              </button>
            </>
          )}
        </section>
        <aside className="mining-record-card">
          <Sprite name="miningKey" />
          <span>Deepest room</span>
          <strong>{Math.max(1, progression.highestMiningRoomReached)}</strong>
        </aside>
      </div>
    </main>
  );
}

interface ActiveMiningViewProps {
  progression: ProgressionState;
  mining: MiningState;
  onTile: (position: Position) => void;
  onToggleAuto: () => void;
  onToggleRestart: (enabled: boolean) => void;
  onStop: () => void;
}

function ActiveMiningView({
  progression,
  mining,
  onTile,
  onToggleAuto,
  onToggleRestart,
  onStop,
}: ActiveMiningViewProps) {
  const member = getPartyMember(progression, mining.memberId);
  const maximumHp = memberMaxHp(progression, mining.memberId);
  const maximumStamina = memberMaxStamina(progression, mining.memberId);
  const frontierIds = new Set(frontierMiningRocks(mining).map((rock) => rock.id));
  const activeRock = mining.activeRockId ? mining.rocks[mining.activeRockId] : null;
  const miningProgress = activeRock
    ? Math.max(0, Math.min(1, 1 - activeRock.durability.div(activeRock.maxDurability).toNumber()))
    : 0;
  const activelyMining = Boolean(activeRock
    && Math.abs(activeRock.position.x - mining.playerPosition.x)
      + Math.abs(activeRock.position.y - mining.playerPosition.y) === 1);
  const enemyHp = mining.enemy
    ? Math.max(0, Math.min(1, mining.enemy.hp.div(mining.enemy.maxHp).toNumber()))
    : 0;
  const boardStyle = { "--mining-columns": mining.width } as CSSProperties;
  const geology = miningSpritesForRoom(mining.roomNumber);
  const geologyBand = miningVisualBand(mining.roomNumber);

  return (
    <main className="mining-view mining-active-view">
      <section className="mining-work-area">
        <header className="page-heading mining-heading">
          <div>
            <h1>Mining — Room {mining.roomNumber}</h1>
            <p>
              <strong>{getPlayer(mining.memberId).name}</strong> {formatWholeAmount(member.hp)}/{formatWholeAmount(maximumHp)} HP · {" "}
              {formatWholeAmount(member.stamina)}/{formatWholeAmount(maximumStamina)} Stamina
            </p>
          </div>
        </header>
        <div className="activity-screen-frame mining-screen-frame">
          <div aria-label={`Mining Room ${mining.roomNumber}`} className="mining-board" style={boardStyle}>
          {mining.tiles.flatMap((row, y) => row.map((tile, x) => {
            const position = { x, y };
            const rock = tile.rockId ? mining.rocks[tile.rockId] : null;
            const isActiveRock = Boolean(rock && rock.id === mining.activeRockId);
            const isEnemy = mining.enemy?.position.x === x && mining.enemy.position.y === y;
            const isPlayer = mining.playerPosition.x === x && mining.playerPosition.y === y;
            const canMine = Boolean(rock && frontierIds.has(rock.id));
            const canUse = canMine || isEnemy;
            return (
              <button
                aria-label={tileAriaLabel(tile.kind, canMine, isEnemy)}
                className={[
                  "mining-tile",
                  `mining-tile-${tile.kind}`,
                  canMine ? "can-mine" : "",
                  isActiveRock ? "is-being-mined" : "",
                  tile.kind === "door" && mining.hasKey ? "can-open" : "",
                  tile.kind !== "wall" ? `mining-floor-variant-${(x * 3 + y * 5 + geologyBand) % 4}` : "",
                  rock ? `mining-rock-variant-${(x * 5 + y * 3 + geologyBand) % 3}` : "",
                ].filter(Boolean).join(" ")}
                disabled={!canUse}
                key={`${x},${y}`}
                onClick={() => onTile(position)}
                type="button"
              >
                <Sprite name={tile.kind === "wall" ? geology.wall : geology.floor} />
                {tile.kind === "door" && <Sprite name="miningDoor" />}
                {rock && <Sprite name={geology.rock} />}
                {isActiveRock && activelyMining && (
                  <>
                    <span className="mining-cracks" aria-hidden="true" />
                    <span className="mining-pickaxe-swing" aria-hidden="true"><Sprite name="pickaxe" /></span>
                    <span className="mining-rock-progress" aria-hidden="true"><span style={{ width: `${miningProgress * 100}%` }} /></span>
                  </>
                )}
                {isEnemy && mining.enemy && (
                  <span className={`mining-entity mining-enemy-entity unit-facing-${mining.enemy.facing ?? "left"}`}>
                    <span className="tile-health-bar" aria-hidden="true"><span className="tile-health-fill" style={{ width: `${enemyHp * 100}%` }} /></span>
                    <span className="entity-frame entity-hostile"><Sprite name={mining.enemy.sprite} /></span>
                  </span>
                )}
                {isPlayer && (
                  <span className={`mining-entity mining-player-entity unit-facing-${mining.playerFacing ?? "right"}`}>
                    <span className="tile-health-bar" aria-hidden="true"><span className="tile-health-fill" style={{ width: `${Math.max(0, Math.min(1, member.hp.div(maximumHp).toNumber())) * 100}%` }} /></span>
                    <span className="entity-frame entity-friendly"><Sprite name={mining.memberId} /></span>
                  </span>
                )}
              </button>
            );
          }))}
          </div>
        </div>
        <section className="mining-controls">
          <button onClick={onToggleAuto} type="button">Auto: {progression.miningAutoMode ? "on" : "off"} (Q)</button>
          <label className="plain-option">
            <input checked={progression.restartMiningOnFullHp} onChange={(event) => onToggleRestart(event.target.checked)} type="checkbox" />
            Restart from Room 1 after the run ends
          </label>
          <button onClick={onStop} type="button">Leave mine</button>
        </section>
      </section>
      <aside className="mining-sidebar">
        <section
          aria-label={mining.hasKey ? "Room key found" : "Room key missing"}
          className={`info-box mining-key-card ${mining.hasKey ? "has-key" : "missing-key"}`}
        >
          <div className="mining-key-slot" aria-hidden="true">
            <Sprite name={mining.hasKey ? "miningKey" : "miningKeyMissing"} />
          </div>
          <div>
            <h2>Room key</h2>
            <p>{mining.hasKey ? "Found" : "Still buried"}</p>
          </div>
        </section>
        <section className="info-box mining-log">
          <h2>Findings</h2>
          <ol>{mining.log.map((entry, index) => <li key={`${entry}-${index}`}>{entry}</li>)}</ol>
        </section>
      </aside>
    </main>
  );
}

function tileAriaLabel(kind: string, canMine: boolean, isEnemy: boolean): string {
  if (isEnemy) return "Cave Bat — select to attack";
  if (kind === "rock") return canMine ? "Reachable rock — select to mine" : "Buried rock";
  if (kind === "door") return "Mine door";
  if (kind === "entrance") return "Mine entrance";
  return kind;
}
