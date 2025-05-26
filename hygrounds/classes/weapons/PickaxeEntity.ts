import { Quaternion } from 'hytopia';
import MeleeWeaponEntity from '../MeleeWeaponEntity';
import type { MeleeWeaponEntityOptions } from '../MeleeWeaponEntity';

const DEFAULT_PICKAXE_OPTIONS: MeleeWeaponEntityOptions = {
  damage: 10,         // 10 hits to kill unshielded
  attackRate: 4.5,    // Slower attack rate to prevent spam
  heldHand: 'right',
  iconImageUri: 'icons/pickaxe.png',
  idleAnimation: 'idle_gun_right',
  mlAnimation: 'simple_interact', 
  name: 'Pickaxe',
  modelUri: 'models/items/pickaxe.gltf',
  modelScale: 1.25,
  range: 2,
  minesMaterials: true,
  attackAudioUri: 'audio/sfx/player/player-swing-woosh.mp3',
  hitAudioUri: 'audio/sfx/dig/dig-stone.mp3',
};

export default class PickaxeEntity extends MeleeWeaponEntity {
  public constructor(options: Partial<MeleeWeaponEntityOptions> = {}) {
    super({ ...DEFAULT_PICKAXE_OPTIONS, ...options, tag: 'pickaxe' });
  }

  public override attack(): void {
    if (!this.parent || !this.processAttack()) return;

    super.attack();
  }

  public override equip(): void {
    super.equip();

    this.setPosition({ x: 0, y: 0.2, z: 0 });
    this.setRotation(Quaternion.fromEuler(-90, 0, 90));
  }
}
