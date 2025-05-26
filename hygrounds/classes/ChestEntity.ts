import {
  Audio,
  BallColliderOptions,
  Collider,
  Entity,
  ModelEntityOptions,
  QuaternionLike,
  SceneUI,
  Vector3Like,
  World,
} from 'hytopia';

import { CHEST_DROP_ITEMS, CHEST_MAX_DROP_ITEMS, CHEST_OPEN_DESPAWN_MS } from '../gameConfig';
import ItemFactory from './ItemFactory';

export default class ChestEntity extends Entity {
  private _labelSceneUI: SceneUI;
  private _openAudio: Audio;
  private _opened: boolean = false;

  public constructor(options: Partial<ModelEntityOptions> = {}) {
    super({
      modelUri: 'models/environment/chest.gltf',
      modelScale: 1,
      name: 'Item Chest',
      rigidBodyOptions: {
        additionalMass: 10000,
        enabledPositions: { x: false, y: true, z: false },
        enabledRotations: { x: false, y: false, z: false },
        ccdEnabled: true,
        gravityScale: 0.3, // we want it to drop slow when spawned mid-game in the sky randomly.
        colliders: [
          {
            ...Collider.optionsFromModelUri('models/environment/chest.gltf') as BallColliderOptions,
            radius: 0.45, // collider isn't calculating perfect because of the coin positions in the model.
            bounciness: 0.25,
          }
        ]
      },
      ...options,
    });

    this._labelSceneUI = this._createLabelUI();

    this._openAudio = new Audio({
      attachedToEntity: this,
      uri: 'audio/sfx/chest-open-2.mp3',
      volume: 0.7,
      referenceDistance: 8,
      cutoffDistance: 20,
    });
  }

  public open(): void {
    if (this._opened || !this.world) return;

    this._opened = true;
    this._openAudio.play(this.world, true);
    this._labelSceneUI.unload();

    this.startModelOneshotAnimations(['opening']);

    setTimeout(() => {
      this.startModelLoopedAnimations([ 'open' ]);

      const numItems = Math.floor(Math.random() * CHEST_MAX_DROP_ITEMS) + 1;

      for (let i = 0; i < numItems; i++) {
        this._spawnRandomChestItem();
      }
    }, 600);

    // despawn chest after 20 seconds
    setTimeout(() => {
      if (this.isSpawned) {
        this.despawn();
      }
    }, CHEST_OPEN_DESPAWN_MS);
  }

  public override spawn(world: World, position: Vector3Like, rotation?: QuaternionLike): void {
    super.spawn(world, position, rotation);
    this._labelSceneUI.load(world);
  }

  private _createLabelUI(): SceneUI {
    return new SceneUI({
      attachedToEntity: this,
      templateId: 'chest-label',
      state: { name: this.name },
      viewDistance: 8,
      offset: { x: 0, y: 0.85, z: 0 },
    });
  }

  private async _spawnRandomChestItem(): Promise<void> {
    if (!this.world) return;

    // Calculate total weight
    const totalWeight = CHEST_DROP_ITEMS.reduce((sum, item) => sum + item.pickWeight, 0);

    // Get random value between 0 and total weight
    let random = Math.random() * totalWeight;

    // Find the selected item
    let selectedItem = CHEST_DROP_ITEMS[0];
    for (const item of CHEST_DROP_ITEMS) {
      random -= item.pickWeight;
      if (random <= 0) {
        selectedItem = item;
        break;
      }
    }

    const item = await ItemFactory.createItem(selectedItem.itemId);
    
    if (item) {
      item.spawn(this.world, {
        x: this.position.x,
        y: this.position.y + 2,
        z: this.position.z,
      });

      item.startDespawnTimer();

      item.applyImpulse({ // apply an impulse in a random x/z direction
        x: (Math.random() - 0.5) * 10 * item.mass,
        y: 5 * item.mass,
        z: (Math.random() - 0.5) * 10 * item.mass,
      });
    } else {
      console.error(`Failed to create item: ${selectedItem.itemId}`);
    }
  }
}