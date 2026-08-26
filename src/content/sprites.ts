import { itemSprites } from "./sprite-registry/items";
import { objectSprites } from "./sprite-registry/objects";
import { terrainSprites } from "./sprite-registry/terrain";
import { unitSprites } from "./sprite-registry/units";

/** Stable facade used by renderers; category files own the asset imports. */
export const sprites = {
  ...terrainSprites,
  ...objectSprites,
  ...unitSprites,
  ...itemSprites,
} as const;

export type SpriteName = keyof typeof sprites;
