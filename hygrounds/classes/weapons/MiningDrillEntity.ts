import { Quaternion } from 'hytopia';
import MeleeWeaponEntity from '../MeleeWeaponEntity';
import type { MeleeWeaponEntityOptions } from '../MeleeWeaponEntity';

const DEFAULT_MINING_DRILL_OPTIONS: MeleeWeaponEntityOptions = {
  damage: 40,
  attackRate: 5, 
  heldHand: 'right',
  iconImageUri: 'icons/mining-drill.png',
  idleAnimation: 'idle_gun_right',
  mlAnimation: 'shoot_gun_right', 
  name: 'Mining Drill',
  modelUri: 'models/items/mining-drill.glb',
  modelScale: 0.05,
  range: 1.5,
  minesMaterials: true,
  attackAudioUri: 'audio/sfx/mining-drill-drilling.mp3',
  hitAudioUri: 'audio/sfx/dig/dig-stone.mp3',
};

export default class MiningDrillEntity extends MeleeWeaponEntity {
  public constructor(options: Partial<MeleeWeaponEntityOptions> = {}) {
    super({ ...DEFAULT_MINING_DRILL_OPTIONS, ...options, tag: 'mining-drill' });
  }

  public override attack(): void {
    if (!this.parent || !this.processAttack()) return;

    super.attack();
  }

  public override equip(): void {
    super.equip();

    this.setPosition({ x: -0.3, y: 0.5, z: -0.1 });
    this.setRotation(Quaternion.fromEuler(180, 0, -90));
  }
}
