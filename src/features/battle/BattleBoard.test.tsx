import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createBattle } from "@/game/combat";
import { EMPTY_TRAINING } from "@/game/types";
import { BattleBoard } from "./BattleBoard";

function renderBattle(level: number, prepare?: (battle: ReturnType<typeof createBattle>) => void): string {
  const battle = createBattle(level, [{ id: "knight", training: { ...EMPTY_TRAINING } }]);
  prepare?.(battle);
  return renderToStaticMarkup(
    <BattleBoard
      battle={battle}
      manualEnabled={false}
      onSecondaryTile={() => undefined}
      onTile={() => undefined}
    />,
  );
}

describe("BattleBoard shield links", () => {
  it("uses only the force field for Battle 8's all-Tentacle ward", () => {
    const markup = renderBattle(8, (battle) => {
      const squid = battle.units.find((unit) => unit.definitionId === "abyssal-squid");
      if (squid) squid.position = { x: 5, y: 5 };
    });
    expect(markup).toContain("squid-force-field");
    expect(markup).not.toContain("shield-generator-links");
  });

  it("keeps the direct Dynamo-to-boss connector in Battle 10", () => {
    expect(renderBattle(10)).toContain("shield-generator-links");
  });
});
