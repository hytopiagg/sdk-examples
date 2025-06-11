import {
  BlockColliderOptions,
  Collider,
  ColliderShape,
  Entity,
  ErrorHandler,
  ModelEntityOptions,
  RigidBodyType,
  Vector3Like
} from 'hytopia';

import GameManager from '../GameManager';
import GamePlayerEntity from '../GamePlayerEntity';

export type PortalEntityOptions = {
  destinationRegionTag: string;
  destinationRegionPosition: Vector3Like;
} & ModelEntityOptions;

export default class PortalEntity extends Entity {
  public readonly destinationRegionTag: string;
  public readonly destinationRegionPosition: Vector3Like;

  public constructor(options: PortalEntityOptions) {
    const colliderOptions = Collider.optionsFromModelUri('models/environment/portal.gltf', options.modelScale ?? 1, ColliderShape.BLOCK) as BlockColliderOptions;
    colliderOptions.halfExtents!.x = Math.max(colliderOptions.halfExtents!.x, 0.5);

    super({
      ...options,
      modelUri: 'models/environment/portal.gltf',
      modelLoopedAnimations: [ 'idle' ],
      rigidBodyOptions: {
        type: RigidBodyType.FIXED,
        colliders: [
          {
            ...colliderOptions,
            relativePosition: { x: 0, y: 0, z: 0.5 }, // inset the sensor a bit
            isSensor: true,
            onCollision: (other, started) => {
              if (!started || !(other instanceof GamePlayerEntity)) return;
              
              const destinationRegion = GameManager.instance.getRegion(this.destinationRegionTag);

              if (!destinationRegion) {
                ErrorHandler.warning(`PortalEntity: Destination region ${this.destinationRegionTag} not found`);
                return;
              }

              other.gamePlayer.setNextRegionSpawnPoint(this.destinationRegionPosition);              
              other.player.joinWorld(destinationRegion.world);
            },
          },
        ],
      }
    });

    this.destinationRegionTag = options.destinationRegionTag;
    this.destinationRegionPosition = options.destinationRegionPosition;
  }
}