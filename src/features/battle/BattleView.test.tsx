import { renderToStaticMarkup } from "react-dom/server";
import Decimal from "break_eternity.js";
import { describe, expect, it } from "vitest";
import { createBattle } from "@/game/combat";
import { EMPTY_TRAINING } from "@/game/types";
import { battleStory } from "@/content/story-dialogue";
import { BattleView } from "./BattleView";

const noop = () => {};

function renderBattle(status: "deploying" | "fighting") {
  const created = createBattle(1, [{ id: "knight", training: { ...EMPTY_TRAINING } }]);
  const battle = {
    ...created,
    status,
    attackLog: ["Knight uses Attack on Undertaker for 12 damage"],
    readyAt: Object.fromEntries(created.units.map((unit) => [unit.id, new Decimal(0)])),
  };
  return renderToStaticMarkup(
    <BattleView
      autoMode={false}
      battle={battle}
      onRetry={noop}
      onSecondaryTile={noop}
      onSelectDeploymentUnit={noop}
      onStartBattle={noop}
      onTile={noop}
      onToggleAuto={noop}
    />,
  );
}

describe("Battle story", () => {
  it("keeps the story pinned while combat details appear below it", () => {
    const storyText = battleStory(1)!.lines[0].text;
    const deploying = renderBattle("deploying");
    const fighting = renderBattle("fighting");
    expect(deploying).toContain(storyText);
    expect(deploying).not.toContain("<h2>Story</h2>");
    expect(deploying).toContain('aria-label="Battle prelude"');
    expect(fighting).toContain(storyText);
    expect(fighting).toContain('aria-label="Battle prelude"');
    expect(fighting).not.toContain("Next 5 turns");
    expect(fighting).toContain("Battle log");
    expect(fighting).toContain("Knight uses Attack on Undertaker for 12 damage");
    expect(fighting).toContain("HP");
    expect(fighting).not.toContain("Current turn");
    expect(fighting).not.toContain("Home-ground bonus");
  });
});
