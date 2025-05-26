import {
  Audio,
  Entity,
  Vector3Like,
  Quaternion,
  QuaternionLike,
  World,
} from 'hytopia';

import GamePlayerEntity from './GamePlayerEntity';
import ItemEntity from './ItemEntity';
import TerrainDamageManager from './TerrainDamageManager';
import type { ItemEntityOptions } from './ItemEntity';

export type GunHand = 'left' | 'right' | 'both';

export type GunEntityOptions = {
  ammo: number;              // The amount of ammo in the clip.
  damage: number;            // The damage of the gun.
  fireRate: number;          // Bullets shot per second.
  maxAmmo: number;           // The amount of ammo the clip can hold.
  totalAmmo: number;         // The amount of ammo remaining for this gun.
  range: number;             // The max range bullets travel for raycast hits
  reloadAudioUri: string;    // The audio played when reloading
  reloadTimeMs: number;      // Seconds to reload.
  shootAudioUri: string;     // The audio played when shooting
  scopeZoom?: number;         // The zoom level when scoped in.
} & ItemEntityOptions;

export default abstract class GunEntity extends ItemEntity {
  protected readonly damage: number;
  protected readonly fireRate: number;
  protected readonly maxAmmo: number;
  protected readonly range: number;
  protected readonly reloadTimeMs: number;
  protected readonly scopeZoom: number = 1;

  protected ammo: number;
  protected totalAmmo: number;
  private _lastFireTime: number = 0;
  private _muzzleFlashChildEntity: Entity | undefined;
  private _reloadAudio: Audio;
  private _reloading: boolean = false;
  private _shootAudio: Audio;

  public constructor(options: GunEntityOptions) {
    if (!('modelUri' in options)) {
      throw new Error('GunEntity requires modelUri');
    }

    super(options);

    this.ammo = options.ammo;
    this.damage = options.damage;
    this.fireRate = options.fireRate;
    this.maxAmmo = options.maxAmmo;
    this.totalAmmo = options.totalAmmo;
    this.range = options.range;
    this.reloadTimeMs = options.reloadTimeMs;
    this.scopeZoom = options.scopeZoom ?? 1;

    this._reloadAudio = new Audio({
      attachedToEntity: this,
      uri: options.reloadAudioUri,  
      referenceDistance: 8,
      cutoffDistance: 20,
    });

    this._shootAudio = new Audio({
      attachedToEntity: this,
      uri: options.shootAudioUri,
      volume: 0.3,
      referenceDistance: 8,
      cutoffDistance: 100,
    });
  }

  public override equip(): void {
    if (!this.world) return;
    
    super.equip();
    
    this.setPosition({ x: 0, y: 0, z: -0.2 });
    this.setRotation(Quaternion.fromEuler(-90, 0, 0));
    this._reloadAudio.play(this.world, true);

  }

  public override unequip(): void {
    super.unequip();

    // reset any scope zoom
    const player = this.parent as GamePlayerEntity;
    this.zoomScope(true);
  }

  public override spawn(world: World, position: Vector3Like, rotation?: QuaternionLike): void {
    super.spawn(world, position, rotation);

    this._createMuzzleFlash();
  }

  public override getQuantity(): number {
    return this.totalAmmo;
  }

  public reload(): void {
    if (!this.parent?.world || this._reloading || !this.totalAmmo) return;
    this._startReload();
    this._reloadAudio.play(this.parent.world, true);

    setTimeout(() => this._finishReload(), this.reloadTimeMs);
  }

  public abstract getMuzzleFlashPositionRotation(): { position: Vector3Like, rotation: QuaternionLike };

  public shoot(): void {
    if (!this.parent?.world) return;

    const player = this.parent as GamePlayerEntity;
    const { origin, direction } = this.getShootOriginDirection();
    
    this._performShootEffects(player);
    this.shootRaycast(origin, direction, this.range);
    this._updateUI(player);
  }

  public zoomScope(reset: boolean = false): void {
    if (!this.parent?.world || this.scopeZoom === 1) return;

    const player = this.parent as GamePlayerEntity;
    const zoom = player.player.camera.zoom === 1 && !reset ? this.scopeZoom : 1;

    player.player.camera.setZoom(zoom);
    player.player.ui.sendData({
      type: 'scope-zoom',
      zoom,
    });
  }

  protected getShootOriginDirection(): { origin: Vector3Like, direction: Vector3Like } {
    const player = this.parent as GamePlayerEntity;
    const { x, y, z } = player.position;
    const cameraYOffset = player.player.camera.offset.y;    
    const direction = player.player.camera.facingDirection;
    
    return {
      origin: { x, y: y + cameraYOffset, z },
      direction
    };
  }

  protected processShoot(): boolean {
    if (this.totalAmmo <= 0 || this._reloading) return false;

    const now = performance.now();
    if (this._lastFireTime && now - this._lastFireTime < 1000 / this.fireRate) return false;

    if (this.ammo <= 0) {
      this.reload();
      return false;
    }

    this.ammo--;
    this.totalAmmo--;
    this._lastFireTime = now;

    return true;
  }

  protected shootRaycast(origin: Vector3Like, direction: Vector3Like, length: number): void {
    if (!this.parent?.world) return;
   
    const { world } = this.parent;
    const raycastHit = this.parent.world.simulation.raycast(origin, direction, length, {
      filterExcludeRigidBody: this.parent.rawRigidBody,
    });

    if (raycastHit?.hitBlock) {
      TerrainDamageManager.instance.damageBlock(world, raycastHit.hitBlock, this.damage);
    }

    if (raycastHit?.hitEntity) {
      this._handleHitEntity(raycastHit.hitEntity, direction);
    }
  }

  private _createMuzzleFlash(): void {
    if (!this.isSpawned || !this.world) return;

    this._muzzleFlashChildEntity = new Entity({
      parent: this,
      modelUri: 'models/environment/muzzle-flash.gltf',
      modelScale: 0.5,
      opacity: 0,
    });

    const { position, rotation } = this.getMuzzleFlashPositionRotation();
    this._muzzleFlashChildEntity.spawn(this.world, position, rotation);
  }

  private _startReload(): void {
    this.ammo = 0;
    this._reloading = true;
    this.updateAmmoIndicatorUI(true);
  }

  private _finishReload(): void {
    this._reloading = false;

    // prevent reloads if they swapped active item mid reload.
    if (!this.parent || !(this.parent as GamePlayerEntity).isItemActiveInInventory(this)) return;

    this.ammo = Math.min(this.maxAmmo, this.totalAmmo);
    this.updateAmmoIndicatorUI();
  }

  private _performShootEffects(player: GamePlayerEntity): void {
    player.startModelOneshotAnimations([ this.mlAnimation ]);
    this._showMuzzleFlash();
    this._shootAudio.play(this.parent!.world!, true);
  }

  private _showMuzzleFlash(): void {
    if (!this._muzzleFlashChildEntity) return;

    this._muzzleFlashChildEntity.setOpacity(1);
    setTimeout(() => {
      if (this.isSpawned && this._muzzleFlashChildEntity?.isSpawned) {
        this._muzzleFlashChildEntity.setOpacity(0);
      }
    }, 35);
  }

  private _updateUI(player: GamePlayerEntity): void {
    player.updateItemInventoryQuantity(this);
    this.updateAmmoIndicatorUI();
  }

  protected _handleHitEntity(hitEntity: Entity, hitDirection: Vector3Like): void {
    if (!(hitEntity instanceof GamePlayerEntity) || hitEntity.isDead) return;

    const attacker = this.parent as GamePlayerEntity;

    attacker.dealtDamage(this.damage);
    hitEntity.takeDamage(this.damage, hitDirection, attacker);
  }

  public updateAmmoIndicatorUI(reloading: boolean = false): void {
    if (!this.parent) {
      return;
    }

    const player = this.parent as GamePlayerEntity;

    player.player.ui.sendData(reloading ? {
      type: 'ammo-indicator',
      reloading: true,
    } : {
      type: 'ammo-indicator',
      ammo: this.ammo,
      totalAmmo: this.totalAmmo,
      show: true,
    });
  }
}
