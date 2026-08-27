/**
 * The single editing surface for story and dialogue copy.
 * Add future chapters, scenes, and NPC dialogue to this file so the game's
 * narrative text remains readable in one place.
 */

import type { SpriteName } from "./sprites";
import type { enemies } from "./enemies";
import type { BattleNumber } from "./levels";

export interface StoryLine {
  speaker?: string;
  text: string;
}

export interface BattleStory {
  lines: StoryLine[];
}

export interface DialogueBeat {
  speaker: string;
  sprite: SpriteName;
  text: string;
}

export type ConversationId =
  | "blacksmith-met"
  | "blacksmith-hammer-returned"
  | "shopkeeper-rescued"
  | "fishing-rod-recovered"
  | "worm-rescued"
  | "miner-recruited"
  | "angler-request"
  | "angler-complete"
  | "cartographer-complete"
  | "potionmaster-complete"
  | "charles-complete"
  | "forge-blueprints-delivered";

type OpeningBattle = BattleNumber;

/** Keeps long prose readable in source without inserting visible line breaks. */
function copy(...lines: string[]): string {
  return lines.join(" ");
}

export const STORY_DIALOGUE: {
  battles: Record<OpeningBattle, BattleStory>;
  conversations: Record<ConversationId, DialogueBeat[]>;
  npcs: {
    angler: string;
    potionmaster: string;
    charles: string;
    shopkeeper: string;
    cartographer: {
      surveying: (visited: number, required: number) => string;
      complete: string;
    };
  };
} = {
  battles: {
    1: {
      lines: [{
        text: copy(
          "NDB MEGASOFTWARE PRESENTS: BATTLE ONE, the first battle brave enough to be",
          "numbered One. Tonight, our award-eligible Graveyard Division places one living",
          "customer before an Undertaker with a shovel, a measuring tape, and the",
          "industry-leading confidence to call a fresh hole PRE-OWNED. He approves your",
          "shoulders and rings a bell. History begins. The audience is worms. Every worm",
          "has press credentials.",
        ),
      }],
    },
    2: {
      lines: [{
        text: copy(
          "After the record-shattering existence of Battle One, NDB MEGASOFTWARE announces",
          "BATTLE TWO: MORE GRAVEYARD. The earth opens and delivers one Restless Skeleton,",
          "now containing nearly all legally expected bones and several pieces legal has",
          "asked us not to classify. It arrives vertically because excellence requires",
          "height. A second lock seals the gate. This is not repetition. This is a franchise,",
          "and the franchise has learned to cough dirt directly into your mouth.",
        ),
      }],
    },
    3: {
      lines: [{
        text: copy(
          "NDB MEGASOFTWARE ROYAL SYSTEMS unveils leadership itself: the Skele-Prince,",
          "selected by finding a crown face-down in mud and wearing it before anyone",
          "responsible arrived. His first decree taxes every femur one femur. His second",
          "declares your skin a hostile monopoly. Trumpets perform the official anthem,",
          "BONES FALLING DOWN STAIRS IN D MINOR. Kneel, refuse, or stand there weirdly;",
          "all three are treason under our premium monarchy.",
        ),
      }],
    },
    4: {
      lines: [{
        text: copy(
          "Market demand for crown-based skeleton governance has exceeded projections.",
          "NDB MEGASOFTWARE therefore presents the Skele-King: six crowns, one robe, and",
          "an internal bone count the company declines to publish. He rises from the",
          "executive grave while green light hardens around him and the rain files for",
          "personal leave. A moth touches the glow, remembers an appointment, and exits",
          "the narrative. Royal scalability has arrived, enormous and furious.",
        ),
      }],
    },
    5: {
      lines: [{
        text: copy(
          "NDB MEGASOFTWARE INFRASTRUCTURE proudly opens its flagship bridge: twelve planks",
          "spanning a gorge, reinforced by hope, wet rope, and a sign reading SAFE CROSSING",
          "in a legally nonbinding font. The Goblin Chief appears wearing enough hat to",
          "govern three smaller hats. He requests your Gold and left shoe as a ceremonial",
          "toll. Spectators wager which part of you reaches the bottom",
          "first. The Chief calls this a public-private partnership. Regional commerce",
          "is THRIVING.",
        ),
      }],
    },
    6: {
      lines: [{
        text: copy(
          "NDB MEGASOFTWARE MOBILITY presents the Goblin Shaman Demonstration Campus, a",
          "luxury courtyard combining isolated contractors, several stumps, and water placed",
          "wherever walking would have been convenient. At center stage, the Goblin Shaman",
          "launches TELEPORTATION AS A SERVICE by vanishing six feet and returning with no",
          "explanation or refund. Someone fires early. Everyone blames Greg. Greg has been",
          "removed from the promotional materials.",
        ),
      }],
    },
    7: {
      lines: [{
        text: copy(
          "NDB MEGASOFTWARE LIVING ASSET MANAGEMENT is delighted to unveil the Beast Tamer,",
          "a man whose tiny hat has received more training than any beast present. He",
          "applauds his own entrance. Cages descend containing a carefully diversified",
          "portfolio of teeth, wings, heat, and workplace hostility. Every cage says TRAINED",
          "in wet paint. Every lock has tooth marks on the inside. The Tamer calls this",
          "evidence of engagement. Animal enthusiasm has never been more mandatory.",
        ),
      }],
    },
    8: {
      lines: [{
        text: copy(
          "NDB MEGASOFTWARE OCEANIC announces a landmark advancement in water: it can now",
          "stand up and complain. The Abyssal Squid rises from a peaceful pool with an",
          "unreasonable quantity of limbs and a head approved for mixed residential use. It delivers a",
          "centuries-long shareholder statement through bubbles, pointing repeatedly at",
          "the surface and then at you. Translation remains pending. Hostile maritime",
          "engagement, however, is already fully localized.",
        ),
      }],
    },
    9: {
      lines: [{
        text: copy(
          "NDB MEGASOFTWARE APPLIED FLUIDS is pleased to report that the Abyssal Ooze has",
          "exceeded every quarterly objective, including several that were numbers. It grows",
          "a face, rejects that face, and grows a second face with executive authority.",
          "The entire room begins humming a note unavailable on consumer instruments.",
          "Five signs say DO NOT TOUCH THE PURPLE. A sixth contains a turnip recipe and the",
          "former safety director's forwarding address. Fluid leadership has arrived.",
        ),
      }],
    },
    10: {
      lines: [{
        text: copy(
          "NDB MEGASOFTWARE FINALITY SYSTEMS presents the Rusttide Colossus, our most",
          "expensive arrangement of shipwreck, boiler, anchors, coffin lid, and glowing",
          "seafood runoff. A captain's bell rings for a ship that no longer exists while",
          "the Colossus promotes itself from maritime incident to regional weather system.",
          "This is not merely Battle Ten. This is a historic vertical integration of tetanus",
          "and destiny. NDB MEGASOFTWARE accepts full credit and no liability.",
        ),
      }],
    },
    11: {
      lines: [{
        text: copy(
          "NDB MEGASOFTWARE HORIZON OWNERSHIP presents BATTLE ELEVEN, shipped before",
          "transportation. The wreckage behind you becomes a",
          "beach. The beach becomes an ocean. The ocean becomes a blue refusal",
          "form stretched between privately owned mounds of sand. From the farthest island,",
          "the Vacation Emperor reclines beneath a crown and declares all visible water his",
          "personal resort. He waves. The wave is hostile. NDB MEGASOFTWARE congratulates",
          "the horizon for finally becoming a wall.",
        ),
      }],
    },
  },
  conversations: {
    "blacksmith-met": [
      {
        speaker: "Blacksmith",
        sprite: "blacksmith",
        text: copy(
          "OH! A customer! Don't touch that. Or that.",
          "Actually put your hands in your pockets. I made most of this while screaming.",
        ),
      },
      {
        speaker: "Blacksmith",
        sprite: "blacksmith",
        text: copy(
          "Some Mummies stole my Hammer and locked it in a vault.",
          "I'd get it myself, but then who would stare at this anvil? Exactly. Go kill them.",
        ),
      },
    ],
    "blacksmith-hammer-returned": [
      {
        speaker: "Blacksmith",
        sprite: "blacksmith",
        text: copy(
          "MY HAMMER!! Come here, baby. Did the horrible Mummies scratch you?",
          "Oh. Hello, adventurer. You're alive too. Good.",
        ),
      },
      {
        speaker: "Blacksmith",
        sprite: "blacksmith",
        text: copy(
          "Now I can make a PICKAXE! It is a Hammer with one angry point on it.",
          "Rocks HATE this simple trick.",
        ),
      },
    ],
    "shopkeeper-rescued": [
      {
        speaker: "Lost Adventurer",
        sprite: "shopkeeper",
        text: copy(
          "FINALLY! I've been in this cage for three days. Do not touch the bucket.",
          "Do not LOOK at the bucket. We leave the bucket behind.",
        ),
      },
      {
        speaker: "Shopkeeper",
        sprite: "shopkeeper",
        text: copy(
          "I'm a Shopkeeper! Come visit my Shop.",
          "Since you saved my life, I will generously allow you to pay full price. You're welcome!",
        ),
      },
    ],
    "fishing-rod-recovered": [
      {
        speaker: "Rodney",
        sprite: "angler",
        text: copy(
          "You actually came! Excellent. I have been holding this Fishing Rod for nine days.",
          "I hate fishing. I also hate rods. This has been a difficult posting.",
        ),
      },
      {
        speaker: "Rodney",
        sprite: "angler",
        text: copy(
          "Take it. Point the wet string at water until a fish makes a paperwork error.",
          "I will now leave through a door that was never drawn. Do not follow me.",
        ),
      },
    ],
    "worm-rescued": [
      {
        speaker: "Worm",
        sprite: "worm",
        text: copy(
          "THANK YOU. One Spider kept licking me. Spiders don't even have tongues!",
          "I checked after the third time!",
        ),
      },
      {
        speaker: "Worm",
        sprite: "worm",
        text: copy(
          "I'm joining your Party. I spit acid, have no bones, and can sleep inside a boot.",
          "Put THAT on my résumé!",
        ),
      },
    ],
    "miner-recruited": [
      {
        speaker: "Miner",
        sprite: "miner",
        text: copy(
          "IS THAT A PICKAXE!? Give it here!",
          "I have been mining with my forehead for six months and can no longer taste colors.",
        ),
      },
      {
        speaker: "Miner",
        sprite: "miner",
        text: copy(
          "I'm coming with you. Point me at a rock and I'll hit it until money comes out.",
          "Sometimes a Bat comes out instead. HIT THAT TOO.",
        ),
      },
    ],
    "angler-request": [
      {
        speaker: "Angler",
        sprite: "angler",
        text: copy(
          "Yep, that's bait. Now catch ONE specific fish.",
          "Not a similar fish. Not a better fish. THAT fish. I hate the others.",
        ),
      },
    ],
    "angler-complete": [
      {
        speaker: "Angler",
        sprite: "angler",
        text: copy(
          "THAT'S THE FISH!! Take my Tackle Box. Please take it far away.",
          "Something inside has been knocking back since Tuesday.",
        ),
      },
    ],
    "cartographer-complete": [
      {
        speaker: "Lost Cartographer",
        sprite: "cartographer",
        text: copy(
          "All three points! My map was PERFECT.",
          "Ignore the part where north is labeled 'probably up.' I drew it after eating magic chalk.",
        ),
      },
    ],
    "potionmaster-complete": [
      {
        speaker: "Lost Potionmaster",
        sprite: "potionmaster",
        text: copy(
          "Perfect! I boiled the monster chunks and got four Potions plus one hundred Magic Bait.",
          "The purple foam became BOTH somehow. Science!",
        ),
      },
    ],
    "charles-complete": [
      {
        speaker: "Charles",
        sprite: "oddityBrewer",
        text: copy(
          "TEN EYES! TEN TAILS! TEN HOT CRUNCHIES!",
          "Charles counted thirty ingredients and reached forty-two. Charles is VERY good at numbers!",
        ),
      },
      {
        speaker: "Charles",
        sprite: "oddityBrewer",
        text: copy(
          "Three Mystery Potions! Each one does two good things, one bad half-thing,",
          "and maybe makes you dodge. Charles used the CLEAN boot this time!",
        ),
      },
    ],
    "forge-blueprints-delivered": [
      {
        speaker: "Blacksmith",
        sprite: "blacksmith",
        text: copy(
          "MY BLUEPRINTS! They're burnt, slimy, and somebody drew a huge butt across page four.",
          "Hah! Still funny. I drew that.",
        ),
      },
      {
        speaker: "Blacksmith",
        sprite: "blacksmith",
        text: copy(
          "I can build the Crafting Table! Put garbage in the sixteen squares.",
          "If the garbage is shaped correctly, a helmet pops out. DO NOT ASK ME HOW.",
        ),
      },
    ],
  },
  npcs: {
    angler: "The Angler needs THAT fish. No, the other one. THE OTHER OTHER ONE. Are you even trying?",
    potionmaster: "The Potionmaster needs a heap of monster chunks. The cauldron just whispered your name.",
    charles: copy(
      "Charles needs ten eyes, ten tails, and ten hot crunchies.",
      "Charles needs lots of things. Charles is not well.",
    ),
    shopkeeper: "The Shopkeeper smiles warmly. The price tags smile with ALL their teeth.",
    cartographer: {
      surveying: (visited, required) => copy(
        `${visited}/${required} survey points found.`,
        "Keep stepping on the map dots like the obedient little cartographer you are.",
      ),
      complete: copy(
        "The map is DONE! North may be sideways.",
        "Simply rotate your entire understanding of direction.",
      ),
    },
  },
};

export function battleStory(battle: number): BattleStory | null {
  return STORY_DIALOGUE.battles[battle as OpeningBattle] ?? null;
}

export function conversation(id: ConversationId): DialogueBeat[] {
  return STORY_DIALOGUE.conversations[id];
}

/** Flavor shown beside the mechanical stats in the Bestiary. */
export const BESTIARY_DESCRIPTIONS = {
  undertaker: copy(
    "He puts dead people in holes, puts dirt on top, and somehow owns a house.",
    "His shovel has a name. He will not tell you the name because the shovel is shy.",
  ),
  skeleton: copy(
    "A human with every wet bit removed.",
    "Nobody knows what keeps it moving, although spite has been submitted for peer review.",
  ),
  "skeleton-giraffe": copy(
    "They buried this giraffe standing up because the Undertaker refused to dig sideways.",
    "Its neck arrives several seconds before the rest of it.",
  ),
  "skeleton-hippo": copy(
    "A Hippo was already one of nature's deadliest mistakes.",
    "Removing the heavy, slow flesh has NOT improved the situation.",
  ),
  "skeleton-rhino": copy(
    "It cannot see, smell, think, or possess muscles.",
    "It still charges whatever noise offended it most recently.",
  ),
  "skeleton-brachiosaurus": copy(
    "Millions of years extinct, fifty feet tall, and buried in a village graveyard",
    "beneath a sixteen-inch headstone. Seems accurate!",
  ),
  "skeleton-prince": copy(
    "Found a crown in a puddle and became royalty instantly.",
    "His duties are pointing, shouting TREASON, and being shorter than his father.",
  ),
  "skeleton-king": copy(
    "The Prince's enormous father. Or grandfather.",
    "Or several unrelated skeletons inside one robe. The robe refuses all interviews.",
  ),
  goblin: copy(
    "A green bag of elbows holding a knife stolen from somebody's kitchen.",
    "The brown stuff on the blade is probably gravy. PROBABLY.",
  ),
  "goblin-chief": copy(
    "Bigger hat, bigger club, bigger screaming.",
    "Goblin society considers this an entire system of government.",
  ),
  "goblin-archer": copy(
    "Lives on a tiny platform with a bow, a packed lunch, and the absolute confidence",
    "of somebody who removed the ladder afterward.",
  ),
  "goblin-shaman": copy(
    "Can bend SPACE ITSELF, but mostly uses this godlike power",
    "to avoid walking across a small rug. Incredible.",
  ),
  "beast-tamer": copy(
    "Stores wild animals in boxes, calls them trained, and hides whenever one of the boxes",
    "begins making trained chewing noises.",
  ),
  "fire-ant": copy(
    "It is the size of a dog, on fire, and still technically an Ant.",
    "Entire picnics surrender when it appears over the hill.",
  ),
  alligator: copy(
    "A thirty-foot mouth with decorative legs.",
    "The rest of the animal exists solely so the mouth can arrive somewhere else.",
  ),
  dragonfly: "Not a Dragon. Is a Fly. The first half of its name is stolen valor and it knows what it did.",
  bee: copy(
    "A sleepless yellow panic-orb powered by pollen, fury,",
    "and the knowledge that its entire family shares one bedroom.",
  ),
  "abyssal-squid": copy(
    "A huge purple head with four independent arms and one shared opinion:",
    "the ocean was better before everyone else arrived.",
  ),
  "squid-tentacle": copy(
    "A muscular purple question mark dragged up from somewhere",
    "the sunlight has wisely never visited.",
  ),
  "squid-knight": copy(
    "A Squid wearing armor over its soft boneless Squid body.",
    "The helmet mostly keeps the head from sloshing out during formal occasions.",
  ),
  "abyssal-ooze": copy(
    "A living purple stain that moves against the slope",
    "and occasionally grows a face when it thinks nobody is looking.",
  ),
  "ooze-guardian": copy(
    "A smaller, rounder stain that hovers near the Abyssal Ooze",
    "and emits the emotional warmth of a supportive infected blister.",
  ),
  "rustmire-engine": copy(
    "A shipwreck, boiler, seafood tank, and leaking toilet welded together",
    "by somebody who HATED the ocean specifically.",
  ),
  "brine-dynamo": copy(
    "A huge glass heart full of glowing brine, rusty paddles,",
    "and one deeply overworked shrimp circling inside.",
  ),
  "barnacle-drone": copy(
    "A Barnacle grew legs, found a rivet gun, and skipped every evolutionary step",
    "where it might have developed manners.",
  ),
  rat: copy(
    "Grey fur, pink tail, tiny horrible hands.",
    "It can enter a locked pantry through any hole larger than the idea of a hole.",
  ),
  ant: copy(
    "A regular Ant enlarged until its private little insect thoughts",
    "become everyone else's immediate concern.",
  ),
  "clay-golem": copy(
    "Somebody made a giant clay man, installed a glowing eye,",
    "and forgot the little switch labeled FRIENDLY. Pottery class is cancelled.",
  ),
  octopus: copy(
    "Eight arms, three hearts, one beak, and enough private ink",
    "to write a furious memoir about being called Squid by strangers.",
  ),
  spider: copy(
    "Eight legs, eight eyes, no tongue, and one moist obsession with Worm.",
    "Please stop picturing the moist part.",
  ),
  merman: copy(
    "Top half man, bottom half fish, middle part sealed by royal decree.",
    "Every one claims to be third in line for the same damp throne.",
  ),
  "fire-alligator": copy(
    "An Alligator that breathes fire.",
    "Somebody looked at the original mouth and decided not enough horrible stuff came out.",
  ),
  mummy: copy(
    "A dead Clay person wrapped in crunchy old bandages.",
    "The inside is mostly dust, teeth, and a smell with legal custody of the room.",
  ),
  "cave-bat": copy(
    "Sleeps inside cracks that appear narrower than its bones.",
    "Do not ask about air holes. Do not ask about Bat poop storage.",
  ),
  mimic: "A Treasure Chest with gums, breath, and far too many opinions about where fingers should be kept.",
  "glow-scorpion": copy(
    "Its tail glows brightly enough to illuminate every grain of cave dust",
    "and absolutely none of its personality.",
  ),
  "ore-beetle": copy(
    "A Beetle coated in glittering stone plates.",
    "It mistakes every reflective surface for a romantic rival and loses hours to spoons.",
  ),
  "gloom-wisp": copy(
    "Cold fire floating in a cave with no fuel, lungs, or business being alive.",
    "It smells faintly of rain that never happened.",
  ),
  "basalt-wyrm": copy(
    "A rock Worm eating other rocks in a rock cave.",
    "Its digestive system is either miraculous or simply even more rocks.",
  ),
  forgeling: copy(
    "A tiny screaming coal with legs and a mouthful of molten metal.",
    "Nobody has ever observed one at a reasonable temperature.",
  ),
  "chain-forgeling": copy(
    "Somebody gave the tiny screaming coal a CHAIN.",
    "It sleeps curled around it like a baby with a deeply unsafe blanket.",
  ),
  "bellows-forgeling": copy(
    "An angry fireplace that learned geometry, inhalation,",
    "and exactly one extremely loud note.",
  ),
  "hammer-forgeling": copy(
    "Three feet tall, four-foot Hammer.",
    "Its arms are either incredibly strong or quietly detached from the shoulders.",
  ),
  "dire-rat": copy(
    "A Rat with extra meat, extra anger, and a tail that bends where tails should NOT bend.",
    "It regards regular Rats as disappointing children.",
  ),
  "soldier-ant": copy(
    "An Ant wearing armor over its natural armor.",
    "Somewhere underneath is an incredibly safe and incredibly stupid insect.",
  ),
  "sewer-toad": copy(
    "A Toad swollen with sewer water and poor decisions.",
    "It croaks in a voice normally associated with furniture being dragged upstairs.",
  ),
  "coconut-bailiff": copy(
    "A coconut issued a clipboard, enormous feet, and the confidence to repossess a sunset.",
    "Its signature is just three wet dents, but every court accepts it.",
  ),
  "reef-auditor": copy(
    "A crab-shaped public servant grown from coral, red tape, and the worst afternoon of your life.",
    "It has inspected the tide and found the tide suspicious.",
  ),
  "vacation-emperor": copy(
    "A sunburnt monarch wearing sunglasses beneath a crown, because authority requires layers.",
    "He has annexed every beach his chair can face and several that do not exist.",
  ),
} satisfies Record<keyof typeof enemies, string>;

export function bestiaryDescription(enemyId: string): string {
  return BESTIARY_DESCRIPTIONS[enemyId as keyof typeof BESTIARY_DESCRIPTIONS]
    ?? copy(
      "This enemy has no description.",
      "Make up something involving a cursed spoon and pretend it was foreshadowed.",
    );
}
