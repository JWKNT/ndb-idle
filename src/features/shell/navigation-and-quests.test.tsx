import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { defaultProgression, type ProgressionState } from "@/game/progression";
import { QuestLog } from "@/features/adventure/QuestLog";
import { GameNavigation } from "./GameNavigation";

describe("navigation and quest ordering", () => {
  it("places Battle before Party in the main navigation", () => {
    const markup = renderToStaticMarkup(
      <GameNavigation
        onNavigate={() => undefined}
        onOpenHelp={() => undefined}
        onSaveAndQuit={() => undefined}
        progression={defaultProgression()}
        view="party"
      />,
    );

    expect(markup.indexOf(">Battle</button>"))
      .toBeLessThan(markup.indexOf(">Party</button>"));
    expect(markup).toContain(">Help</button>");
    expect(markup).toContain("Save &amp; quit to title");
    expect(markup).not.toContain("Save Slot");
  });

  it("interleaves special quests at the point they enter chapter progression", () => {
    const progression = {
      ...defaultProgression(),
      purchasedQuestIds: [
        "rescue-shopkeeper",
        "retrieve-lost-item",
        "rescue-me",
        "enter-tower",
        "find-miner",
      ] as ProgressionState["purchasedQuestIds"],
      hammerQuestPurchased: true,
    };
    const markup = renderToStaticMarkup(
      <QuestLog
        cartographerQuestAvailable
        onActivateCartographerQuest={() => undefined}
        onActivateHammerQuest={() => undefined}
        onActivateQuest={() => undefined}
        progression={progression}
      />,
    );
    const labels = [
      "Lost Adventurer",
      "Retrieve Lost Item",
      "Rescue Me",
      "Cartographer Survey",
      "Retrieve Hammer",
      "Enter Tower",
      "Find the Miner",
    ];

    for (let index = 1; index < labels.length; index += 1) {
      expect(markup.indexOf(labels[index - 1])).toBeLessThan(markup.indexOf(labels[index]));
    }
  });
});
