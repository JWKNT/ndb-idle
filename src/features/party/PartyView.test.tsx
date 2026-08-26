import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createRingGear } from "@/game/gear";
import { addGear, defaultProgression, equipGear } from "@/game/progression";
import { PartyView } from "./PartyView";

const noop = () => {};

function renderParty(progression = defaultProgression()): string {
  return renderToStaticMarkup(
    <PartyView
      progression={progression}
      onConsumePotion={noop}
      onEquip={noop}
      onFeedFish={noop}
      onUnequip={noop}
      onUseBlacksmithPotion={noop}
      onUseMapmakerChalk={noop}
    />,
  );
}

describe("Party equipment", () => {
  it("only shows Unequip for occupied equipment slots", () => {
    const empty = defaultProgression();
    expect(renderParty(empty)).not.toContain("Unequip");

    const helmet = createRingGear("helmet", 1, "party-view-test");
    const equipped = equipGear(addGear(empty, helmet), "knight", helmet.id).state;
    const markup = renderParty(equipped);
    expect(markup.match(/>Unequip<\/button>/g)).toHaveLength(1);
  });
});
