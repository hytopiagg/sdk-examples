import { PathfindingEntityController } from 'hytopia';

import EnemyEntity from '../EnemyEntity';
import type { EnemyEntityOptions } from '../EnemyEntity';

export default class ZombieEntity extends EnemyEntity {
  public constructor(options: Partial<EnemyEntityOptions> = {}) {
    const speed = options.speed ?? 1 + Math.random() * 4;    
    const animation = speed > 5 ? 'run' : speed > 3 ? 'walk' : 'crawling';

    super({
      damage: options.damage ?? 2,
      damageAudioUri: options.damageAudioUri ?? 'audio/sfx/entity/zombie/zombie-hurt.mp3',
      health: options.health ?? 7,
      idleAudioUri: options.idleAudioUri ?? 'audio/sfx/zombie-idle.mp3',
      jumpHeight: options.jumpHeight ?? 2,
      reward: options.reward ?? 20,
      speed: options.speed ?? speed,

      controller: new PathfindingEntityController(),
      modelUri: 'models/npcs/zombie.gltf',
      modelLoopedAnimations: [ animation ],
      modelScale: 0.5 + Math.random() * 0.2,
      rigidBodyOptions: {
        enabledRotations: { x: false, y: true, z: false },
        ccdEnabled: true,
      },
    });
  }
}
