import Decimal from "break_eternity.js";

export const rescueMeQuest = {
  id: "rescue-me",
  name: "Rescue Me",
  description: "Follow the marker through the Overgrown Galleries, defeat seven Spiders, and rescue Worm.",
  cost: new Decimal(500),
  unlockBattle: 4,
  shopAvailable: true,
} as const;
