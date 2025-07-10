import { Collider, CollisionGroup, Entity, ModelEntityOptions, RigidBodyType } from 'hytopia';
import BaseEntity from '../BaseEntity';
import GamePlayerEntity from '../../GamePlayerEntity';
import type { BaseEntityOptions } from '../BaseEntity';

export type SpiderWebEntityOptions = {

} & BaseEntityOptions;

export default class SpiderWebEntity extends BaseEntity {
  public constructor(options?: SpiderWebEntityOptions) {
    const modelScale = options?.modelScale ?? Math.random() * 1.5 + 0.5; // 0.5 to 2 scale
    const colliderOptions = Collider.optionsFromModelUri('models/vfx/spider-web.gltf', modelScale);
    
    super({
      ...options,
      health: 100,
      modelUri: 'models/vfx/spider-web.gltf',
      modelScale,
      name: 'Spider Web',
      rigidBodyOptions: {
        type: RigidBodyType.DYNAMIC,
        colliders: [
          { // Collider for ground contact
            ...colliderOptions,
            bounciness: 0,
            friction: 1000,
            collisionGroups: {
              belongsTo: [ CollisionGroup.ENTITY ],
              collidesWith: [ CollisionGroup.BLOCK ],
            }
          },
          { // Collider for slow effect on relevant entities
            ...colliderOptions,
            collisionGroups: {
              belongsTo: [ CollisionGroup.ENTITY ],
              collidesWith: [ CollisionGroup.ENTITY ],
            },
            isSensor: true,
            onCollision: (entity, started) => {
              if (!(entity instanceof GamePlayerEntity)) return;

              if (started) {
                entity.setGravityScale(2);
                entity.playerController.walkVelocity = entity.playerController.walkVelocity * 0.25;
                entity.playerController.runVelocity = entity.playerController.runVelocity * 0.25;
              } else {
                entity.setGravityScale(1);
                entity.playerController.walkVelocity = entity.playerController.walkVelocity * 4;
                entity.playerController.runVelocity = entity.playerController.runVelocity * 4;
              }
            }
          },
        ],
        ...options?.rigidBodyOptions,
      }
    });
  }
}