import { Quaternion, Vector3Like, QuaternionLike } from 'hytopia';
import GunEntity from '../GunEntity';
import type { GunEntityOptions } from '../GunEntity';

const DEFAULT_SUBMACHINE_GUN_OPTIONS: GunEntityOptions = {
  ammo: 60,
  damage: 6,
  fireRate: 12,
  heldHand: 'right',
  iconImageUri: 'icons/submachine-gun.png',
  idleAnimation: 'idle_gun_right',
  mlAnimation: 'shoot_gun_right',
  name: 'Submachine Gun',
  maxAmmo: 60,
  totalAmmo: 240,
  scopeZoom: 1.35,
  modelUri: 'models/items/submachine-gun.glb',
  modelScale: 1.3,
  range: 40,
  reloadAudioUri: 'audio/sfx/rifle-reload.mp3',
  reloadTimeMs: 1500,
  shootAudioUri: 'audio/sfx/pistol-shoot.mp3',
};

export default class SubmachineGunEntity extends GunEntity {
  public constructor(options: Partial<GunEntityOptions> = {}) {
    super({ ...DEFAULT_SUBMACHINE_GUN_OPTIONS, ...options });
  }

  public override shoot(): void {
    if (!this.parent || !this.processShoot()) return;

    super.shoot();
  }

  public override getMuzzleFlashPositionRotation(): { position: Vector3Like, rotation: QuaternionLike } {
    return {
      position: { x: 0, y: 0.05, z: -0.95 },
      rotation: Quaternion.fromEuler(0, 90, 0),
    };
  }
}

