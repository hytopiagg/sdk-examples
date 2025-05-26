import {
  BlockColliderOptions,
  ColliderShape,
  CollisionGroup,
  Entity,
  QuaternionLike,
  RigidBodyType,
  SceneUI,
  Vector3Like,
  World,
} from 'hytopia';

import GameManager from './GameManager';
import GamePlayerEntity from './GamePlayerEntity';
import InteractableEntity from './InteractableEntity';

const WALL_COLLIDER_OPTIONS: BlockColliderOptions = {
  shape: ColliderShape.BLOCK,
  collisionGroups: {
    belongsTo: [ CollisionGroup.BLOCK ],
    collidesWith: [ CollisionGroup.PLAYER ],
  },
};

export interface PurchaseBarrierEntityOptions {
  name: string;
  removalPrice: number;
  width: number;
  unlockIds: string[];
}

export default class PurchaseBarrierEntity extends InteractableEntity {
  public removalPrice: number;
  private _unlockIds: string[];
  private _width: number;
  public constructor(options: PurchaseBarrierEntityOptions) {
    super({
      name: options.name,
      modelUri: 'models/environment/barbedfence.gltf',
      rigidBodyOptions: {
        type: RigidBodyType.FIXED,
      },
      tag: 'purchase-barrier',
    });

    this.removalPrice = options.removalPrice;
    this._unlockIds = options.unlockIds;
    this._width = options.width;
  }

  public get width(): number {
    return this._width;
  }
  
  public override interact(interactingPlayer: GamePlayerEntity) {
    if (!this.isSpawned || !this.world) {
      return;
    }

    if (!interactingPlayer.spendMoney(this.removalPrice)) {
      this.world.chatManager.sendPlayerMessage(interactingPlayer.player, `You don't have enough money to unlock this barrier!`, 'FF0000');
      return;
    }

    this.world.chatManager.sendBroadcastMessage(`The ${this.name} barrier has been unlocked!`, '00FF00');

    // Add unlocked ids to game state, so zombies can spawn in the new areas
    this._unlockIds.forEach(id => {
      GameManager.instance.addUnlockedId(id);
    });

    this.despawn();
  }

  public override spawn(world: World, position: Vector3Like, rotation?: QuaternionLike): void {
    // Add the barrier collider based on spawn position and width before spawning the barrier.
    this.createAndAddChildCollider({
      ...WALL_COLLIDER_OPTIONS,
      halfExtents: {
        x: rotation?.w === 1 ? (this._width * 0.5) : 0.5,
        y: 5,
        z: rotation?.w === 1 ? 0.5 : (this._width * 0.5),
      },
      relativeRotation: rotation,
    });
    
    super.spawn(world, position, rotation);    

    // Add children barriers for visual barrier width
    if (this._width > 1) {
      const offset = Math.floor((this._width - 1) / 2);
      for (let i = -offset; i <= offset; i++) {
        if (i === 0) continue; // Skip center since parent barrier is there
        
        const barrier = new Entity({
          name: `${this.name} (${Math.abs(i)})`,
          modelUri: 'models/environment/barbedfence.gltf',
          parent: this,
        });

        // Because of the anchor point of the barbedfence model
        // being in the lower corner and not centered, we need
        // to offset the child barriers by half the height to
        // center them, this is just a unique for to this model.
        const halfHeight = this.height / 2;

        barrier.spawn(world, {
          x: i - halfHeight,
          y: -halfHeight,
          z: -halfHeight,
        });
      }
    }

    // Spawn Scene UI that shows barrier removal price
    (new SceneUI({
      attachedToEntity: this,
      offset: { x: 0, y: 1, z: 0 },
      templateId: 'purchase-label',
      viewDistance: 4,
      state: {
        name: this.name,
        cost: this.removalPrice,
      },
    })).load(world);
  }
}

