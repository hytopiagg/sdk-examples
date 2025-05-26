import { Quaternion } from 'hytopia';
import ItemEntity from "../ItemEntity";
import GamePlayerEntity from '../GamePlayerEntity';
import type { ItemEntityOptions } from "../ItemEntity";

const GRAVITY_SCALE = 0.3;
const GRAVITY_DURATION_MS = 15 * 1000; // 15 seconds

const DEFAULT_GRAVITY_POTION_OPTIONS: ItemEntityOptions = {
  heldHand: 'right',
  iconImageUri: 'icons/gravity-potion.png',
  idleAnimation: 'idle_gun_right',
  mlAnimation: 'shoot_gun_right',
  modelUri: 'models/items/gravity-potion.glb',
  modelScale: 0.4,
  name: 'Gravity Potion',
  consumable: true,
  consumeAudioUri: 'audio/sfx/potion-consume.mp3',
  consumeTimeMs: 1000,
  quantity: 1,
}

export default class GravityPotionEntity extends ItemEntity {
  public constructor(options: Partial<ItemEntityOptions> = {}) {
    super({ ...DEFAULT_GRAVITY_POTION_OPTIONS, ...options });
  }

  public override consume(): void {
    if (!(this.parent instanceof GamePlayerEntity)) {
      return;
    }

    const parent = this.parent as GamePlayerEntity;

    // Apply gravity potion effect
    parent.setGravity(GRAVITY_SCALE);
    setTimeout(() => parent.setGravity(1), GRAVITY_DURATION_MS);

    super.consume(); 
  }

  public override equip(): void {
    super.equip();

    this.setPosition({ x: 0, y: 0.15, z: -0.2 });
    this.setRotation(Quaternion.fromEuler(-90, 0, 0));
  }
}