/**
 * Skills System
 */

export type Skill = {
  id: SkillId;
  name: string;
  description: string;
  iconAssetUri: string;
}

export enum SkillId {
  AGILITY = 'agility',
  BARTERING = 'bartering',
  COMBAT = 'combat',
  CRAFTING = 'crafting',
  EXPLORATION = 'exploration',
  FARMING = 'farming',
  FORAGING = 'foraging',
}

export const skills: Skill[] = [
  {
    id: SkillId.FARMING,
    name: 'Farming',
    description: 'Plant seeds, water and harvest crops to gain XP.<br/><br/>Increasing farming yield and unlocks new farming perks.',
    iconAssetUri: 'icons/skills/farming.png'
  },
  {
    id: SkillId.FORAGING,
    name: 'Foraging',
    description: 'Gather items from the environment while exploring to gain XP.<br/><br/>Increasing foraging yields and unlocks new foraging perks.',
    iconAssetUri: 'icons/skills/foraging.png'
  },
  {
    id: SkillId.BARTERING,
    name: 'Bartering',
    description: 'Purchase and sell items with merchants to gain XP.<br/><br/>Increases merchant discount and unlocks new merchant items.',
    iconAssetUri: 'icons/skills/bartering.png'
  },
  {
    id: SkillId.CRAFTING,
    name: 'Crafting',
    description: 'Craft items from to gain XP.<br/><br/>Unlocks new craftable items and perks.',
    iconAssetUri: 'icons/skills/crafting.png'
  },
  {
    id: SkillId.COMBAT,
    name: 'Combat',
    description: 'Fight and slay monsters to gain XP.<br/><br/>Increases combat damage and unlocks new combat perks.',
    iconAssetUri: 'icons/skills/combat.png'
  },
  {
    id: SkillId.AGILITY,
    name: 'Agility',
    description: 'Dodge or evade attacks to gain XP.<br/><br/>Increases evasion, movement speed and unlocks new agility perks.',
    iconAssetUri: 'icons/skills/agility.png'
  },
  {
    id: SkillId.EXPLORATION,
    name: 'Exploration',
    description: 'Explore the world to gain XP.<br/><br/>Unlocks new exploration skills and tools to reach new areas.',
    iconAssetUri: 'icons/skills/exploration.png'
  }
]