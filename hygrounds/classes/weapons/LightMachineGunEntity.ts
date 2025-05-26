import { Quaternion, Vector3Like, QuaternionLike } from 'hytopia';
import GunEntity from '../GunEntity';
import type { GunEntityOptions } from '../GunEntity';

const DEFAULT_LIGHT_MACHINE_GUN_OPTIONS: GunEntityOptions = {
  ammo: 50,
  damage: 9,
  fireRate: 10,
  heldHand: 'both',
  iconImageUri: 'icons/light-machine-gun.png',
  idleAnimation: 'idle_gun_both',
  mlAnimation: 'shoot_gun_both',
  name: 'Light Machine Gun',
  maxAmmo: 50,
  totalAmmo: 300,
  scopeZoom: 1.35,
  modelUri: 'models/items/light-machine-gun.glb',
  modelScale: 1.3,
  range: 60,
  reloadAudioUri: 'audio/sfx/machine-gun-reload.mp3',
  reloadTimeMs: 4200,
  shootAudioUri: 'audio/sfx/machine-gun-shoot.mp3',
};

export default class LightMachineGunEntity extends GunEntity {
  public constructor(options: Partial<GunEntityOptions> = {}) {
    super({ ...DEFAULT_LIGHT_MACHINE_GUN_OPTIONS, ...options });
  }

  public override shoot(): void {
    if (!this.parent || !this.processShoot()) return;

    super.shoot();
  }

  public override getMuzzleFlashPositionRotation(): { position: Vector3Like, rotation: QuaternionLike } {
    return {
      position: { x: 0, y: 0.05, z: -1.7 },
      rotation: Quaternion.fromEuler(0, 90, 0),
    };
  }
}

