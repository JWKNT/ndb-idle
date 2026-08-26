interface LaunchViewProps {
  hasSaves: boolean;
  onStart: () => void;
}

export function LaunchView({ hasSaves, onStart }: LaunchViewProps) {
  return (
    <main className="launch-view">
      <section className="launch-minimal" aria-labelledby="launch-title">
        <div className="launch-title-lines">
          <p>NDB MEGASOFTWARE PRESENTS...</p>
        </div>
        <h1 className="launch-wordmark" id="launch-title">NDB IDLE</h1>
        <button
          aria-label={hasSaves ? "Start and choose save file" : "Start new game"}
          className="launch-start"
          onClick={onStart}
          type="button"
        >
          <strong>START</strong>
        </button>
      </section>
    </main>
  );
}
