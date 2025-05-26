import {
  Audio,
  CollisionGroup,
  CollisionGroupsBuilder,
  Entity,
  PlayerEntity,
  Vector3Like,
  QuaternionLike,
  World,
  PlayerEntityController,
  ModelEntityOptions,
} from 'hytopia';

import EnemyEntity from './EnemyEntity';
import type GamePlayerEntity from './GamePlayerEntity';

export type GunHand = 'left' | 'right' | 'both';

export type GunEntityOptions = {
  ammo: number;              // The amount of ammo in the clip.
  damage: number;            // The damage of the gun.
  fireRate: number;          // Bullets shot per second.
  hand: GunHand;             // The hand the weapon is held in.
  iconImageUri: string;      // The image uri of the weapon icon.
  idleAnimation: string;     // The animation played when the gun is idle.
  maxAmmo: number;           // The amount of ammo the clip can hold.
  parent?: GamePlayerEntity; // The parent player entity.
  range: number;             // The max range bullets travel for raycast hits
  reloadAudioUri: string;    // The audio played when reloading
  reloadTimeMs: number;      // Seconds to reload.
  shootAnimation: string;    // The animation played when the gun is shooting.
  shootAudioUri: string;     // The audio played when shooting
} & ModelEntityOptions;

export default abstract class GunEntity extends Entity {
  public ammo: number;
  public damage: number;
  public fireRate: number;
  public hand: GunHand;
  public iconImageUri: string;
  public idleAnimation: string;
  public maxAmmo: number;
  public range: number;
  public reloadTimeMs: number;
  public shootAnimation: string;
  private _lastFireTime: number = 0;
  private _muzzleFlashChildEntity: Entity | undefined;
  private _reloadAudio: Audio;
  private _reloading: boolean = false;
  private _shootAudio: Audio;

  public constructor(options: GunEntityOptions) {
    super({
      ...options,
      parent: options.parent,
      parentNodeName: options.parent ? GunEntity._getParentNodeName(options.hand) : undefined,
    });

    this.ammo = options.ammo;
    this.damage = options.damage;
    this.fireRate = options.fireRate;
    this.hand = options.hand;
    this.iconImageUri = options.iconImageUri;
    this.idleAnimation = options.idleAnimation;
    this.maxAmmo = options.maxAmmo;
    this.range = options.range;
    this.reloadTimeMs = options.reloadTimeMs;
    this.shootAnimation = options.shootAnimation;

    // Create reusable audio instances
    this._reloadAudio = new Audio({
      attachedToEntity: this,
      uri: options.reloadAudioUri,  
    });

    this._shootAudio = new Audio({
      attachedToEntity: this,
      uri: options.shootAudioUri,
      volume: 0.3,
      referenceDistance: 8,
    });

    if (options.parent) {
      this.setParentAnimations();
    }
  }

  public get isEquipped(): boolean { return !!this.parent; }

  public override spawn(world: World, position: Vector3Like, rotation: QuaternionLike) {
    super.spawn(world, position, rotation);
    this.createMuzzleFlashChildEntity();
    this._updatePlayerUIAmmo();
    this._updatePlayerUIWeapon();
  }

  public createMuzzleFlashChildEntity() {
    if (!this.isSpawned || !this.world) {
      return;
    }

    this._muzzleFlashChildEntity = new Entity({
      parent: this,
      modelUri: 'models/environment/muzzle-flash.gltf',
      modelScale: 0.5,
      opacity: 0,
    });

    // pistol specific atm
    const { position, rotation } = this.getMuzzleFlashPositionRotation();
    this._muzzleFlashChildEntity.spawn(this.world, position, rotation);
  }

  public abstract getMuzzleFlashPositionRotation(): { position: Vector3Like, rotation: QuaternionLike };

  public getShootOriginDirection(): { origin: Vector3Like, direction: Vector3Like } {
    const parentPlayerEntity = this.parent as GamePlayerEntity;

    const { x, y, z } = parentPlayerEntity.position;
    const cameraYOffset = parentPlayerEntity.player.camera.offset.y;    
    const direction = parentPlayerEntity.player.camera.facingDirection;
    const origin = {
      x: x + (direction.x * 0.5),
      y: y + (direction.y * 0.5) + cameraYOffset,
      z: z + (direction.z * 0.5),
    };

    return { origin, direction };
  }

  // simple convenience helper for handling ammo and fire rate in shoot() overrides.
  public processShoot(): boolean {
    const now = performance.now();

    if (this._lastFireTime && now - this._lastFireTime < 1000 / this.fireRate) {
      return false;
    }

    if (this.ammo <= 0) {
      this.reload();
      return false;
    }

    this.ammo--;
    this._lastFireTime = now;

    return true;
  }

  public reload() {
    if (!this.parent || !this.parent.world || this._reloading) {
      return;
    }

    this.ammo = 0; // set the ammo to 0 to prevent fire while reloading if clip wasn't empty.
    this._reloading = true;
    this._reloadAudio.play(this.parent.world, true);
    this._updatePlayerUIReload();

    setTimeout(() => {
      if (!this.isEquipped) {
        return;
      }

      this.ammo = this.maxAmmo;
      this._reloading = false;
      this._updatePlayerUIAmmo();
    }, this.reloadTimeMs);
  }

  public setParentAnimations() {
    if (!this.parent || !this.parent.world) {
      return;
    }

    const playerEntityController = this.parent.controller as PlayerEntityController;

    playerEntityController.idleLoopedAnimations = [ this.idleAnimation, 'idle_lower' ];
    playerEntityController.walkLoopedAnimations = [ this.idleAnimation, 'walk_lower' ];
    playerEntityController.runLoopedAnimations = [ this.idleAnimation, 'run_lower' ];
  }

  // override to create specific gun shoot logic
  public shoot() {
    if (!this.parent || !this.parent.world) {
      return;
    }

    const parentPlayerEntity = this.parent as GamePlayerEntity;
    
    // Deal damage and raycast
    const { origin, direction } = this.getShootOriginDirection();
    this.shootRaycast(origin, direction, this.range);

    // Play shoot animation
    parentPlayerEntity.startModelOneshotAnimations([ this.shootAnimation ]);

    // Show Muzzle Flash
    if (this._muzzleFlashChildEntity) {
      this._muzzleFlashChildEntity.setOpacity(1);
      setTimeout(() => {
        if (this.isSpawned && this._muzzleFlashChildEntity?.isSpawned) {
          this._muzzleFlashChildEntity.setOpacity(0);
        }
      }, 35);
    }
    
    // Update player ammo
    this._updatePlayerUIAmmo();
    
    // Play shoot audio
    this._shootAudio.play(this.parent.world, true);
  }

  public shootRaycast(origin: Vector3Like, direction: Vector3Like, length: number) {
    if (!this.parent || !this.parent.world) {
      return;
    }

    const parentPlayerEntity = this.parent as GamePlayerEntity;
   
    const raycastHit = this.parent.world.simulation.raycast(origin, direction, length, {
      filterGroups: CollisionGroupsBuilder.buildRawCollisionGroups({ // filter group is the group the raycast belongs to.
        belongsTo: [ CollisionGroup.ALL ],
        collidesWith: [ CollisionGroup.BLOCK, CollisionGroup.ENTITY ],
      }),
    });

    const hitEntity = raycastHit?.hitEntity;

    if (hitEntity && hitEntity instanceof EnemyEntity) {
      hitEntity.takeDamage(this.damage, parentPlayerEntity);
    }
  }

  private _updatePlayerUIAmmo() {
    if (!this.parent || !this.parent.world) {
      return;
    }

    const parentPlayerEntity = this.parent as PlayerEntity;

    parentPlayerEntity.player.ui.sendData({
      type: 'ammo',
      ammo: this.ammo,
      maxAmmo: this.maxAmmo,
    });
  }

  private _updatePlayerUIReload() {
    if (!this.parent || !this.parent.world) {
      return;
    }

    const parentPlayerEntity = this.parent as PlayerEntity;

    parentPlayerEntity.player.ui.sendData({ type: 'reload' });
  }

  private _updatePlayerUIWeapon() {
    if (!this.parent || !this.parent.world) {
      return;
    }

    const parentPlayerEntity = this.parent as PlayerEntity;

    parentPlayerEntity.player.ui.sendData({
      type: 'weapon',
      name: this.name,
      iconImageUri: this.iconImageUri,
    });
  }

  // convenience helper for getting the node name of the hand the gun is held in.
  private static _getParentNodeName(hand: GunHand): string {
    return hand === 'left' ? 'hand_left_anchor' : 'hand_right_anchor';
  }
}
