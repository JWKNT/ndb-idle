import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { defaultProgression } from "@/game/progression";
import { HelpIndex } from "./HelpIndex";

describe("HelpIndex", () => {
  it("renders only the help topics available to the current file", () => {
    const markup = renderToStaticMarkup(
      <HelpIndex progression={defaultProgression()} onClose={() => undefined} />,
    );

    expect(markup).toContain("NDB IDLE REFERENCE");
    expect(markup).toContain("Controls");
    expect(markup).toContain("Battles");
    expect(markup).not.toContain("Water Shrine");
    expect(markup).toContain("pages unlocked");
  });
});
