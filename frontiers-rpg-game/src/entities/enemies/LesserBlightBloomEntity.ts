import BaseCombatEntity, { BaseCombatEntityOptions } from "../BaseCombatEntity";

export type LesserBlightBloomEntityOptions = {

} & BaseCombatEntityOptions;

export default class LesserBlightBloomEntity extends BaseCombatEntity {
  constructor(options?: LesserBlightBloomEntityOptions) {
    super({
      aggroRadius: 8,
      aggroSensorForwardOffset: 0,
      attacks: [
        { // Eat
          animations: [ 'eat' ],
          cooldownMs: 4000,
          range: 3,
          simpleAttackDamage: 2,
          simpleAttackDamageVariance: 0.6, // ±60% damage
          simpleAttackDamageDelayMs: 750, // Deal damage 1000ms into animation
          simpleAttackReach: 3.5,
          weight: 1,
        },
        { // AoEGas
          animations: [ 'gas_explode' ],
          complexAttack: (params) => {
            console.log('gas_explode');
          },
          complexAttackDelayMs: 700,
          cooldownMs: 4000,
          range: 8,
          weight: 1,
        },
        {
          animations: [ 'spore_splash' ],
          complexAttack: (params) => {
            console.log('spore_splash');
          },
          complexAttackDelayMs: 700,
          cooldownMs: 4000,
          range: 8,
          weight: 2,
        },
      ],
      combatExperienceReward: 250,
      deathAnimations: [ 'death' ],
      deathDespawnDelayMs: 5000,
      deathItemDrops: [
        
      ],
      faceSpeed: 4,
      health: 140,
      idleAnimations: [ 'waiting' ],
      modelUri: 'models/enemies/blight-bloom.gltf',
      modelScale: 0.5,
      moveAnimations: [ 'waiting' ],
      moveSpeed: 0,
      name: 'Lesser Blight Bloom',
      pathfindingOptions: {
        maxJump: 2,
        maxFall: 2,
      },
      pushable: false,
      ...options,
    });
  }
}