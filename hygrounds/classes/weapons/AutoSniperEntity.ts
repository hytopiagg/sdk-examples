import { Quaternion, Vector3Like, QuaternionLike } from 'hytopia';
import GunEntity from '../GunEntity';
import type { GunEntityOptions } from '../GunEntity';

const DEFAULT_AUTO_SNIPER_OPTIONS: GunEntityOptions = {
  ammo: 10,
  damage: 50,
  fireRate: 1.5,
  heldHand: 'both',
  iconImageUri: 'icons/auto-sniper.png',
  idleAnimation: 'idle_gun_both',
  mlAnimation: 'shoot_gun_both',
  name: 'Auto Sniper',
  maxAmmo: 10,
  totalAmmo: 20,
  scopeZoom: 5,
  modelUri: 'models/items/auto-sniper.glb',
  modelScale: 1.3,
  range: 100,
  reloadAudioUri: 'audio/sfx/sniper-reload.mp3',
  reloadTimeMs: 2200,
  shootAudioUri: 'audio/sfx/sniper-shoot.mp3',
};

export default class AutoSniperEntity extends GunEntity {
  public constructor(options: Partial<GunEntityOptions> = {}) {
    super({ ...DEFAULT_AUTO_SNIPER_OPTIONS, ...options });
  }

  public override shoot(): void {
    if (!this.parent || !this.processShoot()) return;

    super.shoot();
  }

  public override getMuzzleFlashPositionRotation(): { position: Vector3Like, rotation: QuaternionLike } {
    return {
      position: { x: 0, y: 0.01, z: -2.7 },
      rotation: Quaternion.fromEuler(0, 90, 0),
    };
  }
}

