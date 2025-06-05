export type Skill = {
  id: SkillId;
  name: string;
  description: string;
  iconAssetUri: string;
}

export enum SkillId {
  Agility = 'agility',
  Bartering = 'bartering',
  Combat = 'combat',
  Exploration = 'exploration',
  Farming = 'farming',
  Foraging = 'foraging',
}

export const skills: Skill[] = [
  {
    id: SkillId.Farming,
    name: 'Farming',
    description: 'Plant seeds, water and harvest crops to gain XP.<br/><br/>Increasing farming yield and unlocks new farming perks.',
    iconAssetUri: 'icons/skills/farming.png'
  },
  {
    id: SkillId.Foraging,
    name: 'Foraging',
    description: 'Gather environmental resources while exploring to gain XP.<br/><br/>Increasing foraging yield and unlocks new foraging perks.',
    iconAssetUri: 'icons/skills/foraging.png'
  },
  {
    id: SkillId.Bartering,
    name: 'Bartering',
    description: 'Purchase and sell items with merchants to gain XP.<br/><br/>Increases merchant discount and unlocks new merchant items.',
    iconAssetUri: 'icons/skills/bartering.png'
  },
  {
    id: SkillId.Combat,
    name: 'Combat',
    description: 'Fight and slay monsters to gain XP.<br/><br/>Increases combat damage and unlocks new combat perks.',
    iconAssetUri: 'icons/skills/combat.png'
  },
  {
    id: SkillId.Agility,
    name: 'Agility',
    description: 'Dodge or evade attacks to gain XP.<br/><br/>Increases evasion, movement speed and unlocks new agility perks.',
    iconAssetUri: 'icons/skills/agility.png'
  },
  {
    id: SkillId.Exploration,
    name: 'Exploration',
    description: 'Explore the world to gain XP.<br/><br/>Unlocks new exploration skills and tools to reach new areas.',
    iconAssetUri: 'icons/skills/exploration.png'
  }
]