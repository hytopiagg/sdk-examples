import { Collider, CollisionGroup, Entity, ModelEntityOptions, RigidBodyType } from 'hytopia';
import GamePlayerEntity from '../../GamePlayerEntity';

export type SpiderWebEntityOptions = {

} & ModelEntityOptions;

export default class SpiderWebEntity extends Entity {
  public constructor(options?: SpiderWebEntityOptions) {
    const modelScale = options?.modelScale ?? Math.random() * 1.5 + 0.5; // 0.5 to 2 scale
    const colliderOptions = Collider.optionsFromModelUri('models/vfx/spider-web.gltf', modelScale);
    
    super({
      ...options,
      modelUri: 'models/vfx/spider-web.gltf',
      modelScale,
      rigidBodyOptions: {
        type: RigidBodyType.DYNAMIC,
        colliders: [
          { // Collider for ground contact
            ...colliderOptions,
            bounciness: 0,
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
                entity.playerController.walkVelocity = entity.playerController.walkVelocity * 0.5;
                entity.playerController.runVelocity = entity.playerController.runVelocity * 0.5;
              } else {
                entity.setGravityScale(1);
                entity.playerController.walkVelocity = entity.playerController.walkVelocity * 2;
                entity.playerController.runVelocity = entity.playerController.runVelocity * 2;
              }
            }
          }
        ]
      }
    });
  }
}