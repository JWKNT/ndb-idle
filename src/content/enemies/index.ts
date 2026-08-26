import { goblin } from "./goblin";
import { goblinChief } from "./goblin-chief";
import { ant } from "./ant";
import { clayGolem } from "./clay-golem";
import { rat } from "./rat";
import { octopus } from "./octopus";
import { skeleton } from "./skeleton";
import { spider } from "./spider";
import { merman } from "./merman";
import { abyssalSquid } from "./abyssal-squid";
import { squidKnight } from "./squid-knight";
import { squidTentacle } from "./squid-tentacle";
import { undertaker } from "./undertaker";
import { skeletonGiraffe } from "./skeleton-giraffe";
import { skeletonHippo } from "./skeleton-hippo";
import { skeletonPrince } from "./skeleton-prince";
import { skeletonRhino } from "./skeleton-rhino";
import { skeletonBrachiosaurus } from "./skeleton-brachiosaurus";
import { skeletonKing } from "./skeleton-king";
import { goblinArcher } from "./goblin-archer";
import { goblinShaman } from "./goblin-shaman";
import { beastTamer } from "./beast-tamer";
import { fireAnt } from "./fire-ant";
import { alligator } from "./alligator";
import { dragonfly } from "./dragonfly";
import { bee } from "./bee";
import { mummy } from "./mummy";
import { caveBat } from "./cave-bat";
import { mimic } from "./mimic";
import { glowScorpion } from "./glow-scorpion";
import { oreBeetle } from "./ore-beetle";
import { gloomWisp } from "./gloom-wisp";
import { basaltWyrm } from "./basalt-wyrm";
import { fireAlligator } from "./fire-alligator";
import { abyssalOoze } from "./abyssal-ooze";
import { oozeGuardian } from "./ooze-guardian";
import { rustmireEngine } from "./rustmire-engine";
import { brineDynamo } from "./brine-dynamo";
import { barnacleDrone } from "./barnacle-drone";
import { forgeling } from "./forgeling";
import { chainForgeling } from "./chain-forgeling";
import { bellowsForgeling } from "./bellows-forgeling";
import { hammerForgeling } from "./hammer-forgeling";
import { direRat } from "./dire-rat";
import { soldierAnt } from "./soldier-ant";
import { sewerToad } from "./sewer-toad";

export const enemies = {
  [goblin.id]: goblin,
  [goblinChief.id]: goblinChief,
  [ant.id]: ant,
  [clayGolem.id]: clayGolem,
  [rat.id]: rat,
  [octopus.id]: octopus,
  [skeleton.id]: skeleton,
  [spider.id]: spider,
  [merman.id]: merman,
  [abyssalSquid.id]: abyssalSquid,
  [squidKnight.id]: squidKnight,
  [squidTentacle.id]: squidTentacle,
  [undertaker.id]: undertaker,
  [skeletonGiraffe.id]: skeletonGiraffe,
  [skeletonHippo.id]: skeletonHippo,
  [skeletonPrince.id]: skeletonPrince,
  [skeletonRhino.id]: skeletonRhino,
  [skeletonBrachiosaurus.id]: skeletonBrachiosaurus,
  [skeletonKing.id]: skeletonKing,
  [goblinArcher.id]: goblinArcher,
  [goblinShaman.id]: goblinShaman,
  [beastTamer.id]: beastTamer,
  [fireAnt.id]: fireAnt,
  [alligator.id]: alligator,
  [dragonfly.id]: dragonfly,
  [bee.id]: bee,
  [mummy.id]: mummy,
  [caveBat.id]: caveBat,
  [mimic.id]: mimic,
  [glowScorpion.id]: glowScorpion,
  [oreBeetle.id]: oreBeetle,
  [gloomWisp.id]: gloomWisp,
  [basaltWyrm.id]: basaltWyrm,
  [fireAlligator.id]: fireAlligator,
  [abyssalOoze.id]: abyssalOoze,
  [oozeGuardian.id]: oozeGuardian,
  [forgeling.id]: forgeling,
  [chainForgeling.id]: chainForgeling,
  [bellowsForgeling.id]: bellowsForgeling,
  [hammerForgeling.id]: hammerForgeling,
  [barnacleDrone.id]: barnacleDrone,
  [brineDynamo.id]: brineDynamo,
  [rustmireEngine.id]: rustmireEngine,
  [direRat.id]: direRat,
  [soldierAnt.id]: soldierAnt,
  [sewerToad.id]: sewerToad,
};

export function getEnemy(id: string) {
  return enemies[id as keyof typeof enemies];
}

export { abyssalOoze, abyssalSquid, alligator, ant, barnacleDrone, basaltWyrm, beastTamer, bee, bellowsForgeling, brineDynamo, caveBat, chainForgeling, clayGolem, direRat, dragonfly, fireAlligator, fireAnt, forgeling, glowScorpion, gloomWisp, goblin, goblinChief, goblinShaman, hammerForgeling, merman, mimic, mummy, octopus, oozeGuardian, oreBeetle, rat, rustmireEngine, sewerToad, soldierAnt, squidKnight, squidTentacle, skeleton, spider, undertaker, skeletonGiraffe, skeletonHippo, skeletonPrince, skeletonRhino, skeletonBrachiosaurus, skeletonKing, goblinArcher };
