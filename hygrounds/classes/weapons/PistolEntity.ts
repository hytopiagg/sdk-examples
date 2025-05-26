import { Quaternion, Vector3Like, QuaternionLike } from 'hytopia';
import GunEntity from '../GunEntity';
import type { GunEntityOptions } from '../GunEntity';
import type GamePlayerEntity from '../GamePlayerEntity';

const DEFAULT_PISTOL_OPTIONS: GunEntityOptions = {
  ammo: 15,
  damage: 14,
  fireRate: 4,
  heldHand: 'right',
  iconImageUri: 'icons/pistol.png',
  idleAnimation: 'idle_gun_right',
  mlAnimation: 'shoot_gun_right',
  name: 'Pistol',
  maxAmmo: 15,
  totalAmmo: 75,
  modelUri: 'models/items/pistol.glb',
  modelScale: 1.3,
  range: 30,
  reloadAudioUri: 'audio/sfx/pistol-reload.mp3',
  reloadTimeMs: 1500,
  shootAudioUri: 'audio/sfx/pistol-shoot.mp3',
};

export default class PistolEntity extends GunEntity {
  public constructor(options: Partial<GunEntityOptions> = {}) {
    super({ ...DEFAULT_PISTOL_OPTIONS, ...options });
  }

  public override shoot(): void {
    if (!this.parent || !this.processShoot()) return;

    super.shoot();
    
    // Cancel input since pistol requires click-to-shoot
    // (this.parent as GamePlayerEntity).player.input.ml = false;
  }

  public override getMuzzleFlashPositionRotation(): { position: Vector3Like, rotation: QuaternionLike } {
    return {
      position: { x: 0.03, y: 0.1, z: -0.5 },
      rotation: Quaternion.fromEuler(0, 90, 0),
    };
  }
}

