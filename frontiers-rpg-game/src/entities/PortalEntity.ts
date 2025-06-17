import {
  BlockColliderOptions,
  Collider,
  ColliderShape,
  Entity,
  ErrorHandler,
  ModelEntityOptions,
  QuaternionLike,
  RigidBodyType,
  Vector3Like
} from 'hytopia';

import GameManager from '../GameManager';
import GamePlayerEntity from '../GamePlayerEntity';

export type PortalEntityOptions = {
  destinationRegionId: string;
  destinationRegionFacingAngle?: number;
  destinationRegionPosition: Vector3Like;
} & ModelEntityOptions;

export default class PortalEntity extends Entity {
  public readonly destinationRegionId: string;
  public readonly destinationRegionFacingAngle: number;
  public readonly destinationRegionPosition: Vector3Like;

  public constructor(options: PortalEntityOptions) {
    const colliderOptions = Collider.optionsFromModelUri('models/environment/portal.gltf', options.modelScale ?? 1, ColliderShape.BLOCK) as BlockColliderOptions;
    colliderOptions.halfExtents!.x = Math.max(colliderOptions.halfExtents!.x, 0.5);

    super({
      modelScale: 2,
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
              
              const destinationRegion = GameManager.instance.getRegion(this.destinationRegionId);
              
              if (!destinationRegion) {
                ErrorHandler.warning(`PortalEntity: Destination region ${this.destinationRegionId} not found`);
                return;
              }
              other.gamePlayer.setCurrentRegion(destinationRegion);
              other.gamePlayer.setCurrentRegionSpawnFacingAngle(this.destinationRegionFacingAngle);
              other.gamePlayer.setCurrentRegionSpawnPoint(this.destinationRegionPosition);              
              other.player.joinWorld(destinationRegion.world);
            },
          },
        ],
      },
      ...options,
    });

    this.destinationRegionId = options.destinationRegionId;
    this.destinationRegionFacingAngle = options.destinationRegionFacingAngle ?? 0;
    this.destinationRegionPosition = options.destinationRegionPosition;
  }
}