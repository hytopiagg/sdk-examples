export type Skill = {
  name: string;
  description: string;
  iconAssetUri: string;
}

export const skills = [
  {
    name: 'Farming',
    description: 'Plant seeds, water and harvest crops to gain XP.<br/><br/>Increasing farming yield and unlocks new farming perks.',
    iconAssetUri: 'icons/skills/farming.png'
  },
  {
    name: 'Foraging',
    description: 'Gather environmental resources while exploring to gain XP.<br/><br/>Increasing foraging yield and unlocks new foraging perks.',
    iconAssetUri: 'icons/skills/foraging.png'
  },
  {
    name: 'Bartering',
    description: 'Purchase and sell items with merchants to gain XP.<br/><br/>Increases merchant discount and unlocks new merchant items.',
    iconAssetUri: 'icons/skills/bartering.png'
  },
  {
    name: 'Combat',
    description: 'Fight and slay monsters to gain XP.<br/><br/>Increases combat damage and unlocks new combat perks.',
    iconAssetUri: 'icons/skills/combat.png'
  },
  {
    name: 'Agility',
    description: 'Dodge or evade attacks to gain XP.<br/><br/>Increases evasion, movement speed and unlocks new agility perks.',
    iconAssetUri: 'icons/skills/agility.png'
  },
  {
    name: 'Exploration',
    description: 'Explore the world to gain XP.<br/><br/>Unlocks new exploration skills and tools to reach new areas.',
    iconAssetUri: 'icons/skills/exploration.png'
  }
]