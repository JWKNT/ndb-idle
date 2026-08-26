import type { SaveSlot, SaveSlotSummary } from "@/game/progression";

interface SaveSelectViewProps {
  slots: SaveSlotSummary[];
  onSelect: (slot: SaveSlot) => void;
  onDelete: (slot: SaveSlot) => void;
  onBack: () => void;
}

export function SaveSelectView({ slots, onSelect, onDelete, onBack }: SaveSelectViewProps) {
  const deleteSlot = (summary: SaveSlotSummary) => {
    if (!summary.occupied) return;
    const confirmed = window.confirm(
      `Delete Save Slot ${summary.slot}? This permanently removes that slot's progress.`,
    );
    if (confirmed) onDelete(summary.slot);
  };

  return (
    <main className="save-select-view">
      <section className="save-select-panel" aria-labelledby="save-select-title">
        <header>
          <h1 id="save-select-title">Select save</h1>
        </header>

        <div className="save-slot-list">
          {slots.map((summary) => (
            <article className="save-slot" key={summary.slot}>
              <div className="save-slot-details">
                <h2>Save Slot {summary.slot}</h2>
                {summary.occupied ? (
                  <p>
                    {summary.battle === null ? "All Battles cleared" : `Battle ${summary.battle}`}
                    {" · Time played "}{formatTimePlayed(summary.timePlayedMs)}
                  </p>
                ) : (
                  <p>Empty</p>
                )}
              </div>
              <div className="save-slot-actions">
                <button type="button" onClick={() => onSelect(summary.slot)}>
                  {summary.occupied ? "Play" : "Start new game"}
                </button>
                <button
                  className="danger-button"
                  disabled={!summary.occupied}
                  type="button"
                  onClick={() => deleteSlot(summary)}
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
        <button className="save-select-back" onClick={onBack} type="button">Back to title</button>
      </section>
    </main>
  );
}

export function formatTimePlayed(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1_000));
  const seconds = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const minutes = totalMinutes % 60;
  const totalHours = Math.floor(totalMinutes / 60);
  const hours = totalHours % 24;
  const days = Math.floor(totalHours / 24);
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (totalHours > 0) return `${totalHours}h ${minutes}m`;
  if (totalMinutes > 0) return `${totalMinutes}m ${seconds}s`;
  return `${seconds}s`;
}
