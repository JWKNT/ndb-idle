import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { defaultProgression } from "@/game/progression";
import { CraftingView } from "./CraftingView";

describe("Crafting workshop", () => {
  it("keeps the empty crafting screen visual and terse", () => {
    const markup = renderToStaticMarkup(
      <CraftingView
        onCraft={() => ({ state: defaultProgression(), error: "Not used in static rendering." })}
        progression={defaultProgression()}
      />,
    );

    expect(markup).toContain("Pattern Bench");
    expect(markup).toContain("No known pattern");
    expect(markup).toContain("No materials");
    expect(markup).not.toContain("Blacksmith&#x27;s Workshop");
    expect(markup).not.toContain("Pattern grid");
    expect(markup).not.toContain(">Result<");
    expect(markup).not.toContain("Arrange recovered materials");
    expect(markup).not.toContain("The finished item will appear here");
  });
});
