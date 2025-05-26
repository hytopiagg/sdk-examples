import { Quaternion } from 'hytopia';

export const BEDROCK_BLOCK_ID = 2;

export const BLOCK_ID_BREAK_DAMAGE: Record<string | number, number> = {
  1: 50, // bricks
  4: 50, // cobblestone
  6: 70, // diamond block
  7: 70, // diamond ore
  8: 10, // dirt
  14: 10, // glass
  15: 70, // gold ore
  16: 10, // grass
  17: 10, // gravel
  19: 100, // infected shadowrock core
  20: 100, // infected shadowrock
  24: 50, // mossy cobblestone
  27: 10, // oak leaves
  30: 10, // sand
  36: 100, // stone bricks
  37: 40, // stone (also build block)
  default: 30, // default for all other blocks
}

export const BLOCK_ID_MATERIALS: Record<string | number, number> = {
  1: 4, // bricks
  2: 0, // bedrock
  6: 10, // diamond block
  7: 10, // diamond ore,
  8: 0, // dirt
  14: 0, // glass
  15: 8, // gold ore,
  16: 0, // grass
  19: 8, // infected shadowrock core
  20: 8, // infected shadowrock
  22: 0, // lava
  23: 2, // log
  28: 2, // oak planks
  36: 5, // stone bricks
  42: 0, // water flow
  43: 0, // water still
  default: 1, // default for all other blocks
};

export const BUILD_BLOCK_ID = 37; // stone

export const CHEST_DROP_INTERVAL_MS = 15 * 1000; // 15 seconds

export const CHEST_DROP_REGION_AABB = {
  min: { x: -45, y: 100, z: -45 },
  max: { x: 45, y: 100, z: 45 },
};

export const CHEST_SPAWNS_AT_START = 20;

export const CHEST_MAX_DROP_ITEMS = 2;

export const CHEST_OPEN_DESPAWN_MS = 10 * 1000; // 10 seconds

export const CHEST_DROP_ITEMS = [
  {
    itemId: 'ak47',
    pickWeight: 0.7,
  },
  {
    itemId: 'auto-shotgun',
    pickWeight: 0.6,
  },
  {
    itemId: 'auto-sniper',
    pickWeight: 0.5,
  },
  {
    itemId: 'bolt-action-sniper',
    pickWeight: 0.5,
  },
  {
    itemId: 'gravity-potion',
    pickWeight: 0.3,
  },
  {
    itemId: 'light-machine-gun',
    pickWeight: 0.6,
  },
  {
    itemId: 'medpack',
    pickWeight: 1.2,
  },
  {
    itemId: 'mining-drill',
    pickWeight: 0.5,
  },
  {
    itemId: 'pistol',
    pickWeight: 0.8,
  },
  {
    itemId: 'revolver',
    pickWeight: 0.9,
  },
  {
    itemId: 'rocket-launcher',
    pickWeight: 0.5,
  },
  {
    itemId: 'shotgun',
    pickWeight: 0.8,
  },
  {
    itemId: 'shield-potion',
    pickWeight: 1.2,
  },
  {
    itemId: 'submachine-gun',
    pickWeight: 1.0,
  },
]

export const CHEST_SPAWNS = [
  {
    position: { x: -14, y: 2, z: -16 },
    rotation: Quaternion.fromEuler(0, -90, 0),
  },
  {
    position: { x: -14, y: 2, z: -25 },
    rotation: Quaternion.fromEuler(0, 90, 0),
  },
  {
    position: { x: -36, y: 2, z: -34.5},
    rotation: Quaternion.fromEuler(0, 180, 0),
  },
  {
    position: { x: -30.5, y: 6, z: -33 },
    rotation: Quaternion.fromEuler(0, -90, 0),
  },
  {
    position: { x: -8, y: 2, z: -40 },
    rotation: Quaternion.fromEuler(0, 180, 0),
  },
  {
    position: { x: 38, y: 2, z: -18 },
    rotation: Quaternion.fromEuler(0, 0, 0),
  },
  {
    position: { x: 47, y: 2, z: -33 },
    rotation: Quaternion.fromEuler(0, 90, 0),
  },
  {
    position: { x: 41, y: 5, z: -46.5 },
    rotation: Quaternion.fromEuler(0, 180, 0),
  },
  {
    position: { x: 39.5, y: 4, z: 9 },
    rotation: Quaternion.fromEuler(0, 90, 0),
  },
  {
    position: { x: -2.5, y: 3, z: 13 },
    rotation: Quaternion.fromEuler(0, 180, 0),
  },
  {
    position: { x: 5.5, y: 3, z: 13 },
    rotation: Quaternion.fromEuler(0, 0, 0),
  },
  {
    position: { x: -2.5, y: 3, z: 8 },
    rotation: Quaternion.fromEuler(0, 180, 0),
  },
  {
    position: { x: 5.5, y: 3, z: 8 },
    rotation: Quaternion.fromEuler(0, 0, 0),
  },
  {
    position: { x: 35, y: 15, z: 34.5 },
    rotation: Quaternion.fromEuler(0, 0, 0),
  },
  {
    position: { x: 33.5, y: 3, z: 29 },
    rotation: Quaternion.fromEuler(0, 90, 0),
  },
  {
    position: { x: 40.5, y: 3, z: 31 },
    rotation: Quaternion.fromEuler(0, 0, 0),
  },
  {
    position: { x: 45, y: 3, z: 45 },
    rotation: Quaternion.fromEuler(0, 0, 0),
  },
  {
    position: { x: 9, y: 3, z: 40 },
    rotation: Quaternion.fromEuler(0, 0, 0),
  },
  {
    position: { x: -22.5, y: 3, z: 44 },
    rotation: Quaternion.fromEuler(0, -90, 0),
  },
  {
    position: { x: -14, y: 3, z: 42.5 },
    rotation: Quaternion.fromEuler(0, 0, 0),
  },
  {
    position: { x: -18, y: 8, z: 45 },
    rotation: Quaternion.fromEuler(0, -90, 0),
  },
  {
    position: { x: -22.5, y: 8, z: 46 },
    rotation: Quaternion.fromEuler(0, -90, 0),
  },
  {
    position: { x: -33.5, y: 3, z: 47 },
    rotation: Quaternion.fromEuler(0, -90, 0),
  },
  {
    position: { x: -44.5, y: 3, z: 23.5 },
    rotation: Quaternion.fromEuler(0, 180, 0),
  },
  {
    position: { x: -29, y: 3, z: 14 },
    rotation: Quaternion.fromEuler(0, 90, 0),
  },
  {
    position: { x: -32, y: 3, z: 21 },
    rotation: Quaternion.fromEuler(0, -90, 0),
  },
  {
    position: { x: -36, y: 3, z: 5.5 },
    rotation: Quaternion.fromEuler(0, 0, 0),
  },
  {
    position: { x: -12, y: 15, z: 27 },
    rotation: Quaternion.fromEuler(0, 90, 0),
  },
  {
    position: { x: -33.5, y: 20, z: 5.5 },
    rotation: Quaternion.fromEuler(0, 90, 0),
  },
  {
    position: { x: -24, y: 3, z: -8 },
    rotation: Quaternion.fromEuler(0, 180, 0),
  },
  {
    position: { x: -15.5, y: 3, z: 0 },
    rotation: Quaternion.fromEuler(0, -90, 0),
  },
  {
    position: { x: -14, y: 3, z: 5 },
    rotation: Quaternion.fromEuler(0, 180, 0),
  },
  {
    position: { x: 10, y: 3, z: -16 },
    rotation: Quaternion.fromEuler(0, 0, 0),
  },
  {
    position: { x: 18, y: 15, z: 4 },
    rotation: Quaternion.fromEuler(0, 0, 0),
  },
  {
    position: { x: -5.5, y: 3, z: 11.5 },
    rotation: Quaternion.fromEuler(0, 0, 0),
  },
  {
    position: { x: -12, y: 9, z: 3.5 },
    rotation: Quaternion.fromEuler(0, 180, 0),
  },
  {
    position: { x: 4, y: 9, z: 8 },
    rotation: Quaternion.fromEuler(0, 180, 0),
  },
  {
    position: { x: 17, y: 3, z: 16.5 },
    rotation: Quaternion.fromEuler(0, 180, 0),
  },
  {
    position: { x: 25, y: 3, z: 3.5 },
    rotation: Quaternion.fromEuler(0, 180, 0),
  },
  {
    position: { x: 24, y: 3, z: -13.5 },
    rotation: Quaternion.fromEuler(0, 0, 0),
  },
  {
    position: { x: 26.5, y: 3, z: -46.5 },
    rotation: Quaternion.fromEuler(0, 90, 0),
  },
  {
    position: { x: -44, y: 3, z: -46 },
    rotation: Quaternion.fromEuler(0, 180, 0),
  },
  {
    position: { x: 11, y: 9, z: -40 },
    rotation: Quaternion.fromEuler(0, 180, 0),
  },
  {
    position: { x: 3, y: 6, z: -19 },
    rotation: Quaternion.fromEuler(0, 180, 0),
  },
  {
    position: { x: 0.5, y: 3, z: -43.5 },
    rotation: Quaternion.fromEuler(0, 180, 0),
  },
  {
    position: { x: -42.5, y: 3, z: -18.5 },
    rotation: Quaternion.fromEuler(0, 180, 0),
  },
  {
    position: { x: -32.5, y: 3, z: -46.5 },
    rotation: Quaternion.fromEuler(0, 90, 0),
  },
  {
    position: { x: 40, y: 15, z: -18 },
    rotation: Quaternion.fromEuler(0, 0, 0),
  },
  {
    position: { x: 13, y: 3, z: 1 },
    rotation: Quaternion.fromEuler(0, 0, 0),
  },
  {
    position: { x: 7, y: 5, z: 36.5 },
    rotation: Quaternion.fromEuler(0, 0, 0),
  },
  {
    position: { x: -14, y: 9, z: -21 },
    rotation: Quaternion.fromEuler(0, 0, 0),
  },
  {
    position: { x: -33, y: 15, z: -35.5 },
    rotation: Quaternion.fromEuler(0, 90, 0),
  },
  {
    position: { x: -28, y: 15, z: -35.5 },
    rotation: Quaternion.fromEuler(0, 90, 0),
  },
  {
    position: { x: -23, y: 3, z: 2.5 },
    rotation: Quaternion.fromEuler(0, 90, 0),
  },
  {
    position: { x: -6, y: 5, z: 22 },
    rotation: Quaternion.fromEuler(0, 180, 0),
  },
];

export const GAME_DURATION_MS = 8 * 60 * 1000; // 8 minutes

export const ITEM_DESPAWN_TIME_MS = 25 * 1000; // 25 seconds

export const ITEM_SPAWNS = [
  { position: { x: -21.5, y: 2, z: -17 } },
  { position: { x: -28.5, y: 7, z: -35.5 } },
  { position: { x: -19.5, y: 2, z: -46.5 } },
  { position: { x: -37.5, y: 2, z: -3.5 } },
  { position: { x: -31.5, y: 2, z: 16.5 } },
  { position: { x: -18.5, y: 2, z: 40.5 } },
  { position: { x: 1.5, y: 2, z: 11.5 } },
  { position: { x: 7.5, y: 10, z: 36.5 } },
  { position: { x: 20.5, y: 2, z: 44.5 } },
  { position: { x: 37.5, y: 2, z: 38.5 } },
  { position: { x: 44.5, y: 2, z: -3.5 } },
  { position: { x: 37.5, y: 2, z: -17.5 } },
  { position: { x: 40.5, y: 10, z: -41.5 } },
  { position: { x: 3.5, y: 10, z: -31.5 } },
  { position: { x: -30.5, y: 10, z: 41.5 } },
];

export const ITEM_SPAWN_ITEMS = [
  {
    itemId: 'ak47',
    pickWeight: 0.5,
  },
  {
    itemId: 'auto-shotgun',
    pickWeight: 0.5,
  },
  {
    itemId: 'auto-sniper',
    pickWeight: 0.5,
  },
  {
    itemId: 'bolt-action-sniper',
    pickWeight: 0.5,
  },
  {
    itemId: 'gravity-potion',
    pickWeight: 0.5,
  },
  {
    itemId: 'light-machine-gun',
    pickWeight: 0.5,
  },
  {
    itemId: 'medpack',
    pickWeight: 0.5,
  },
  {
    itemId: 'mining-drill',
    pickWeight: 0.5,
  },
  {
    itemId: 'pistol',
    pickWeight: 0.3,
  },
  {
    itemId: 'revolver',
    pickWeight: 0.5,
  },
  {
    itemId: 'rocket-launcher',
    pickWeight: 0.5,
  },
  {
    itemId: 'shotgun',
    pickWeight: 0.8,
  },
  {
    itemId: 'shield-potion',
    pickWeight: 0.5,
  },
  {
    itemId: 'submachine-gun',
    pickWeight: 0.5,
  },
];

export const ITEM_SPAWNS_AT_START = 12;

export const MINIMUM_PLAYERS_TO_START = 2;

export const RANK_ASSIST_EXP = 20;
export const RANK_SAVE_INTERVAL_EXP = 500; // Every increment of this, save the persisted data.
export const RANK_KILL_EXP = 100;
export const RANK_WIN_EXP = 1000;
export const RANKS = [
  {
    name: 'Unranked',
    totalExp: 0,
    iconUri: 'icons/ranks/unranked.png',
    unlocks: [],
  },
  {
    name: 'Bronze I',
    totalExp: 500,
    iconUri: 'icons/ranks/bronze-1.png',
    unlocks: [
      'Visible Rank & Medal - Your rank and medal will be visible to all players in game above your head.',
      'Bronze I Rank',
    ]
  },
  {
    name: 'Bronze II',
    totalExp: 1000,
    iconUri: 'icons/ranks/bronze-2.png',
    unlocks: [
      'Bronze II Rank',
    ]
  },
  {
    name: 'Bronze III',
    totalExp: 1500,
    iconUri: 'icons/ranks/bronze-3.png',
    unlocks: [
      'Bronze III Rank',
    ]
  },
  {
    name: 'Bronze IV',
    totalExp: 2500,
    iconUri: 'icons/ranks/bronze-4.png',
    unlocks: [
      'Bronze IV Rank',
    ]
  },
  {
    name: 'Bronze V',
    totalExp: 4000,
    iconUri: 'icons/ranks/bronze-5.png',
    unlocks: [
      'Bronze V Rank',
    ]
  },
  {
    name: 'Silver I',
    totalExp: 6000,
    iconUri: 'icons/ranks/silver-1.png',
    unlocks: [
      'Competitive Matches - Your performance in any match that includes other Silver rank or higher players will affect your competitive ranking based on your relative finishing position.',
      'Silver I Rank',
    ]
  },
  {
    name: 'Silver II',
    totalExp: 9000,
    iconUri: 'icons/ranks/silver-2.png',
    unlocks: [
      'Silver II Rank',
    ]
  },
  {
    name: 'Silver III',
    totalExp: 13000,
    iconUri: 'icons/ranks/silver-3.png',
    unlocks: [
      'Silver III Rank',
    ]
  },
  {
    name: 'Silver IV',
    totalExp: 18000,
    iconUri: 'icons/ranks/silver-4.png',
    unlocks: [
      'Silver IV Rank',
    ]
  },
  {
    name: 'Silver V',
    totalExp: 24000,
    iconUri: 'icons/ranks/silver-5.png',
    unlocks: [
      'Silver V Rank',
    ]
  },
  {
    name: 'Gold I',
    totalExp: 32000,
    iconUri: 'icons/ranks/gold-1.png',
    unlocks: [
      'Gold Flex - All weapons will be tinted gold when you hold them.',
      'Gold I Rank',
    ]
  },
  {
    name: 'Gold II',
    totalExp: 42000,
    iconUri: 'icons/ranks/gold-2.png',
    unlocks: [
      'Gold II Rank',
    ]
  },
  {
    name: 'Gold III',
    totalExp: 54000,
    iconUri: 'icons/ranks/gold-3.png',
    unlocks: [
      'Gold III Rank',
    ]
  },
  {
    name: 'Gold IV',
    totalExp: 68000,
    iconUri: 'icons/ranks/gold-4.png',
    unlocks: [
      'Gold IV Rank',
    ]
  },
  {
    name: 'Gold V',
    totalExp: 85000,
    iconUri: 'icons/ranks/gold-5.png',
    unlocks: [
      'Gold V Rank',
    ]
  },
  {
    name: 'Platinum I',
    totalExp: 105000,
    iconUri: 'icons/ranks/platinum-1.png',
    unlocks: [
      'Celestial Hammer - Your pickaxe is replaced with a magnificent celestial hammer.',
      'Platinum I Rank',
    ]
  },
  {
    name: 'Platinum II',
    totalExp: 130000,
    iconUri: 'icons/ranks/platinum-2.png',
    unlocks: [
      'Platinum II Rank',
    ]
  },
  {
    name: 'Platinum III',
    totalExp: 160000,
    iconUri: 'icons/ranks/platinum-3.png',
    unlocks: [
      'Platinum III Rank',
    ]
  },
  {
    name: 'Platinum IV',
    totalExp: 195000,
    iconUri: 'icons/ranks/platinum-4.png',
    unlocks: [
      'Platinum IV Rank',
    ]
  },
  {
    name: 'Platinum V',
    totalExp: 235000,
    iconUri: 'icons/ranks/platinum-5.png',
    unlocks: [
      'Platinum V Rank',
    ]
  },
  {
    name: 'Diamond I',
    totalExp: 280000,
    iconUri: 'icons/ranks/diamond-1.png',
    unlocks: [
      'Opulent Wings - Your character will be adorned with visual wings.',
      'Diamond I Rank',
    ]
  },
  {
    name: 'Diamond II',
    totalExp: 330000,
    iconUri: 'icons/ranks/diamond-2.png',
    unlocks: [
      'Diamond II Rank',
    ]
  },
  {
    name: 'Diamond III',
    totalExp: 385000,
    iconUri: 'icons/ranks/diamond-3.png',
    unlocks: [
      'Diamond III Rank',
    ]
  },
  {
    name: 'Diamond IV',
    totalExp: 445000,
    iconUri: 'icons/ranks/diamond-4.png',
    unlocks: [
      'Diamond IV Rank',
    ]
  },
  {
    name: 'Diamond V',
    totalExp: 510000,
    iconUri: 'icons/ranks/diamond-5.png',
    unlocks: [
      'Diamond V Rank',
    ]
  },
  {
    name: 'Elite I',
    totalExp: 580000,
    iconUri: 'icons/ranks/elite-1.png',
    unlocks: [
      'Elite Outfit - Your character will be adorned with a special elite outfit.',
      'Elite I Rank',
    ]
  },
  {
    name: 'Elite II',
    totalExp: 655000,
    iconUri: 'icons/ranks/elite-2.png',
    unlocks: [
      'Elite II Rank',
    ]
  },
  {
    name: 'Elite III',
    totalExp: 735000,
    iconUri: 'icons/ranks/elite-3.png',
    unlocks: [
      'Elite III Rank',
    ]
  },
  {
    name: 'Elite IV',
    totalExp: 820000,
    iconUri: 'icons/ranks/elite-4.png',
    unlocks: [
      'Elite IV Rank',
    ]
  },
  {
    name: 'Elite V',
    totalExp: 910000,
    iconUri: 'icons/ranks/elite-5.png',
    unlocks: [
      'Highest Honor - Your character will receive something extremely special. You will need to reach this rank to find out what it is!',
      'Elite V Rank',
    ]
  },
]

export const SPAWN_REGION_AABB = {
  min: { x: -45, y: 30, z: -45 },
  max: { x: 45, y: 35, z: 45 },
};