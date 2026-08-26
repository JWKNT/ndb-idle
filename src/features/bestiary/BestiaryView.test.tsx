import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BestiaryView } from "./BestiaryView";

describe("BestiaryView", () => {
  it("shows authored flavor beside the defeated enemy's mechanical stats", () => {
    const markup = renderToStaticMarkup(
      <BestiaryView defeatedEnemyIds={["rat", "skeleton-king"]} />,
    );

    expect(markup).toContain("tiny horrible hands");
    expect(markup).toContain("several unrelated skeletons");
    expect(markup).toContain("Sp. Defense");
    expect(markup).toContain("Range");
  });

  it("keeps hidden encounter machinery out of the field guide", () => {
    const markup = renderToStaticMarkup(
      <BestiaryView defeatedEnemyIds={["brine-dynamo"]} />,
    );

    expect(markup).not.toContain("Brine Dynamo");
  });
});
