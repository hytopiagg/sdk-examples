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
  delayS?: number;
  destinationRegionId: string;
  destinationRegionFacingAngle?: number;
  destinationRegionPosition: Vector3Like;
  type?: 'normal' | 'boss';
} & ModelEntityOptions;

export default class PortalEntity extends Entity {
  public readonly delayS: number;
  public readonly destinationRegionId: string;
  public readonly destinationRegionFacingAngle: number;
  public readonly destinationRegionPosition: Vector3Like;
  private readonly _playerTimeouts = new Map<GamePlayerEntity, NodeJS.Timeout>();

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
            isSensor: true,
            onCollision: (other, started) => {
              if (!(other instanceof GamePlayerEntity)) return;

              if (started) {
                if (this.delayS > 0) {
                  other.showNotification(`This is a delayed portal! You'll be teleported in ${this.delayS} seconds. You must stay in the portal area.`, 'warning');
                  const timeout = setTimeout(() => this._teleportPlayer(other), this.delayS * 1000);
                  this._playerTimeouts.set(other, timeout);
                } else {
                  this._teleportPlayer(other);
                }
              } else {
                const timeout = this._playerTimeouts.get(other);

                if (timeout) {
                  clearTimeout(timeout);
                  this._playerTimeouts.delete(other);
                  other.showNotification('You exited the delayed portal. Please re-enter the portal again to be teleported.', 'warning');
                }
              }
            },
          },
        ],
      },
      tintColor: options.type === 'boss' ? { r: 255, g: 255, b: 0 } : undefined,
      ...options,
    });

    this.delayS = options.delayS ?? 0;
    this.destinationRegionId = options.destinationRegionId;
    this.destinationRegionFacingAngle = options.destinationRegionFacingAngle ?? 0;
    this.destinationRegionPosition = options.destinationRegionPosition;
  }

  private _teleportPlayer(player: GamePlayerEntity): void {
    const destinationRegion = GameManager.instance.getRegion(this.destinationRegionId);

    if (!destinationRegion) {
      ErrorHandler.warning(`PortalEntity: Destination region ${this.destinationRegionId} not found`);
      return;
    }

    if (player.isDead) {
      return;
    }

    player.gamePlayer.setCurrentRegion(destinationRegion);
    player.gamePlayer.setCurrentRegionSpawnFacingAngle(this.destinationRegionFacingAngle);
    player.gamePlayer.setCurrentRegionSpawnPoint(this.destinationRegionPosition);              
    player.player.joinWorld(destinationRegion.world);

    this._playerTimeouts.delete(player);
  }
}