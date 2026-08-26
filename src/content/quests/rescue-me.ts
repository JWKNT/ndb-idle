import Decimal from "break_eternity.js";

export const rescueMeQuest = {
  id: "rescue-me",
  name: "Rescue Me",
  description: "Follow the screaming through the Overgrown Galleries. Remove seven Spiders from one extremely moist Worm.",
  cost: new Decimal(500),
  unlockBattle: 4,
  shopAvailable: true,
} as const;
