import { Quaternion } from 'hytopia';
import ItemEntity from "../ItemEntity";
import GamePlayerEntity from '../GamePlayerEntity';
import type { ItemEntityOptions } from "../ItemEntity";

const ADD_HEALTH_AMOUNT = 50;

const DEFAULT_MEDPACK_OPTIONS: ItemEntityOptions = {
  heldHand: 'right',
  iconImageUri: 'icons/medpack.png',
  idleAnimation: 'idle_gun_right',
  mlAnimation: 'shoot_gun_right',
  modelUri: 'models/items/medpack.glb',
  modelScale: 0.4,
  name: 'Med Pack',
  consumable: true,
  consumeAudioUri: 'audio/sfx/medpack-consume.mp3',
  consumeTimeMs: 1000,
  quantity: 1,
}

export default class MedPackEntity extends ItemEntity {
  public constructor(options: Partial<ItemEntityOptions> = {}) {
    super({ ...DEFAULT_MEDPACK_OPTIONS, ...options });
  }

  public override consume(): void {
    if (!(this.parent instanceof GamePlayerEntity) || this.parent.health >= this.parent.maxHealth) {
      return;
    }

    this.parent.updateHealth(ADD_HEALTH_AMOUNT);

    super.consume(); 
  }

  public override equip(): void {
    super.equip();

    this.setPosition({ x: 0, y: 0.15, z: 0.3 });
    this.setRotation(Quaternion.fromEuler(-90, 0, 270));
  }
}