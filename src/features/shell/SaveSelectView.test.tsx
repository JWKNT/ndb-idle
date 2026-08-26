import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { SaveSlotSummary } from "@/game/progression";
import { SaveSelectView, formatTimePlayed } from "./SaveSelectView";

describe("save-slot play time", () => {
  it("formats compact durations without hiding seconds on short saves", () => {
    expect(formatTimePlayed(0)).toBe("0s");
    expect(formatTimePlayed(62_000)).toBe("1m 2s");
    expect(formatTimePlayed(3_720_000)).toBe("1h 2m");
    expect(formatTimePlayed(93_720_000)).toBe("1d 2h 2m");
  });

  it("shows time played on occupied save files", () => {
    const slots: SaveSlotSummary[] = [{
      slot: 1,
      occupied: true,
      battle: 4,
      timePlayedMs: 3_720_000,
      gold: "0",
      partyMembers: 1,
      raidsCleared: 3,
      savedAt: null,
    }];
    const markup = renderToStaticMarkup(
      <SaveSelectView
        slots={slots}
        onDelete={() => undefined}
        onSelect={() => undefined}
        onBack={() => undefined}
      />,
    );
    expect(markup).toContain("Battle 4 · Time played 1h 2m");
  });
});
