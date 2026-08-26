import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LaunchView } from "./LaunchView";

describe("NDB Idle launch screen", () => {
  it("offers a new game when no save exists", () => {
    const markup = renderToStaticMarkup(<LaunchView hasSaves={false} onStart={() => undefined} />);

    expect(markup).toContain("NDB");
    expect(markup).toContain("NDB MEGASOFTWARE PRESENTS...");
    expect(markup).toContain("START");
    expect(markup).toContain("Start new game");
    expect(markup).not.toContain("NEW GAME</span>");
    expect(markup).not.toContain("NUMBER ENGINE");
    expect(markup).not.toContain("ZERO BLOCKCHAIN");
  });

  it("routes START toward file loading when a save exists", () => {
    const markup = renderToStaticMarkup(<LaunchView hasSaves onStart={() => undefined} />);

    expect(markup).toContain("Start and choose save file");
    expect(markup).not.toContain("LOAD FILE</span>");
    expect(markup).not.toContain("SYSTEM STATUS");
  });
});
