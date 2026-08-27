import { level01 } from "./level-01";
import { level02 } from "./level-02";
import { level03 } from "./level-03";
import { level04 } from "./level-04";
import { level05 } from "./level-05";
import { level06 } from "./level-06";
import { level07 } from "./level-07";
import { level08 } from "./level-08";
import { level09 } from "./level-09";
import { level10 } from "./level-10";
import { level11 } from "./level-11";

export const levels = [level01, level02, level03, level04, level05, level06, level07, level08, level09, level10, level11];

export type BattleNumber = (typeof levels)[number]["number"];

export function getLevel(number: number) {
  return levels.find((level) => level.number === number) ?? level01;
}

export function hasLevel(number: number) {
  return levels.some((level) => level.number === number);
}

export { level01, level02, level03, level04, level05, level06, level07, level08, level09, level10, level11 };
