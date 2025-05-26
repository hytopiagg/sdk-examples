import { Quaternion, Vector3Like, QuaternionLike } from 'hytopia';
import GunEntity from '../GunEntity';
import type { GunEntityOptions } from '../GunEntity';

const DEFAULT_BOLT_ACTION_SNIPER_OPTIONS: GunEntityOptions = {
  ammo: 1,
  damage: 75,
  fireRate: 0.5,
  heldHand: 'both',
  iconImageUri: 'icons/bolt-action-sniper.png',
  idleAnimation: 'idle_gun_both',
  mlAnimation: 'shoot_gun_both',
  name: 'Bolt Action Sniper',
  maxAmmo: 1,
  totalAmmo: 12,
  scopeZoom: 5,
  modelUri: 'models/items/bolt-action-sniper.glb',
  modelScale: 1.3,
  range: 100,
  reloadAudioUri: 'audio/sfx/sniper-reload.mp3',
  reloadTimeMs: 2200,
  shootAudioUri: 'audio/sfx/sniper-shoot.mp3',
};

export default class BoltActionSniperEntity extends GunEntity {
  public constructor(options: Partial<GunEntityOptions> = {}) {
    super({ ...DEFAULT_BOLT_ACTION_SNIPER_OPTIONS, ...options });
  }

  public override shoot(): void {
    if (!this.parent || !this.processShoot()) return;

    super.shoot();

    // It's bolt action, auto reload it 300ms after a shot.
    setTimeout(() => { this.reload() }, 300);
  }

  public override getMuzzleFlashPositionRotation(): { position: Vector3Like, rotation: QuaternionLike } {
    return { // TODO: FIX MUZZLE FLASH POSITION
      position: { x: 0, y: 0.01, z: -1.25 },
      rotation: Quaternion.fromEuler(0, 90, 0),
    };
  }
}

