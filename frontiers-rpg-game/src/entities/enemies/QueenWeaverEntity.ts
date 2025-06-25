import { RigidBodyType } from 'hytopia';
import BaseCombatEntity, { BaseCombatEntityOptions } from '../BaseCombatEntity';

export type QueenWeaverEntityOptions = {
  
} & BaseCombatEntityOptions

export default class QueenWeaverEntity extends BaseCombatEntity {
  constructor(options?: QueenWeaverEntityOptions) {
    super({
      aggroRadius: 20,
      attacks: [
        {
          animations: [ 'bite' ],
          cooldownMs: 1500,
          range: 4,
          simpleAttackDamage: 50,
          simpleAttackDamageVariance: 0.2,
          simpleAttackDamageDelayMs: 400,
          weight: 1,
        },

      ],
      combatExperienceReward: 600,
      deathAnimations: [ 'death' ],
      deathDespawnDelayMs: 1500,
      deathItemDrops: [],
      deathItemMaxDrops: 5,
      faceSpeed: 4,
      health: 1000,
      idleAnimations: [ 'waiting' ],
      modelUri: 'models/enemies/weaver.gltf',
      modelScale: 1.3,
      moveAnimations: [ 'walking' ],
      moveSpeed: 5,
      name: 'Queen Weaver',
      pathfindingOptions: {
        maxJump: 2,
        maxFall: 18,
      },
      pushable: false,
      rigidBodyOptions: {
        type: RigidBodyType.DYNAMIC,
        ccdEnabled: true,
      },
      ...options,
    })
  }
}