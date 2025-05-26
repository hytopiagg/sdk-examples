import { Quaternion } from 'hytopia';
import ItemEntity from "../ItemEntity";
import GamePlayerEntity from '../GamePlayerEntity';
import type { ItemEntityOptions } from "../ItemEntity";

const ADD_SHIELD_AMOUNT = 25;

const DEFAULT_SHIELD_POTION_OPTIONS: ItemEntityOptions = {
  heldHand: 'right',
  iconImageUri: 'icons/shield-potion.png',
  idleAnimation: 'idle_gun_right',
  mlAnimation: 'shoot_gun_right',
  modelUri: 'models/items/shield-potion.glb',
  modelScale: 0.4,
  name: 'Shield Potion',
  consumable: true,
  consumeAudioUri: 'audio/sfx/potion-consume.mp3',
  consumeTimeMs: 1000,
  quantity: 1,
}

export default class ShieldPotionEntity extends ItemEntity {
  public constructor(options: Partial<ItemEntityOptions> = {}) {
    super({ ...DEFAULT_SHIELD_POTION_OPTIONS, ...options });
  }

  public override consume(): void {
    if (!(this.parent instanceof GamePlayerEntity) || this.parent.shield >= this.parent.maxShield) {
      return;
    }

    this.parent.updateShield(ADD_SHIELD_AMOUNT);

    super.consume(); 
  }

  public override equip(): void {
    super.equip();

    this.setPosition({ x: 0, y: 0.15, z: -0.2 });
    this.setRotation(Quaternion.fromEuler(-90, 0, 0));
  }
}