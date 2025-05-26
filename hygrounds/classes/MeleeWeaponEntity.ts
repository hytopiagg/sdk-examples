import {
  Audio,
  Entity,
  Quaternion,
  RaycastHit,
  Vector3Like,
} from 'hytopia';

import GamePlayerEntity from './GamePlayerEntity';
import ItemEntity from './ItemEntity';
import TerrainDamageManager from './TerrainDamageManager';
import type { ItemEntityOptions } from './ItemEntity';

export type MeleeWeaponEntityOptions = {
  damage: number;           // The damage dealt by the weapon
  attackRate: number;       // Attacks per second
  range: number;            // The range of the melee attack
  attackAudioUri: string;   // The audio played when attacking
  hitAudioUri: string;      // The audio played when hitting an entity or block
  minesMaterials: boolean;  // Whether the weapon mines materials when it hits a block
} & ItemEntityOptions;

export default abstract class MeleeWeaponEntity extends ItemEntity {
  protected readonly damage: number;
  protected readonly attackRate: number;
  protected readonly range: number;
  protected readonly minesMaterials: boolean;

  private _lastAttackTime: number = 0;
  private _attackAudio: Audio;
  private _hitAudio: Audio;

  public constructor(options: MeleeWeaponEntityOptions) {
    super(options);

    this.damage = options.damage;
    this.attackRate = options.attackRate;
    this.range = options.range;
    this.minesMaterials = options.minesMaterials;

    this._attackAudio = new Audio({
      attachedToEntity: this,
      uri: options.attackAudioUri,
      volume: 0.3,
      referenceDistance: 3,
      cutoffDistance: 15,
    });

    this._hitAudio = new Audio({
      attachedToEntity: this,
      uri: options.hitAudioUri,
      volume: 0.3,
      referenceDistance: 3,
      cutoffDistance: 15,
    });
  }

  public override equip(): void {
    if (!this.world) return;
    
    super.equip();
    
    this.setRotation(Quaternion.fromEuler(-90, 0, 0));
  }

  public attack(): void {
    if (!this.parent?.world) return;

    const player = this.parent as GamePlayerEntity;
    const { origin, direction } = this.getAttackOriginDirection();
    
    this._performAttackEffects(player);
    this.attackRaycast(origin, direction, this.range);
  }

  protected getAttackOriginDirection(): { origin: Vector3Like, direction: Vector3Like } {
    const player = this.parent as GamePlayerEntity;
    const { x, y, z } = player.position;
    const cameraYOffset = player.player.camera.offset.y;    
    const direction = player.player.camera.facingDirection;

    return {
      origin: { x, y: y + cameraYOffset, z },
      direction
    };
  }

  protected processAttack(): boolean {
    const now = performance.now();
    if (this._lastAttackTime && now - this._lastAttackTime < 1000 / this.attackRate) return false;

    this._lastAttackTime = now;
    return true;
  }

  protected attackRaycast(origin: Vector3Like, direction: Vector3Like, length: number): RaycastHit | null | undefined {
    if (!this.parent?.world) return;
   
    const { world } = this.parent;
    const raycastHit = world.simulation.raycast(origin, direction, length, {
      filterExcludeRigidBody: this.parent.rawRigidBody,
    });

    if (raycastHit?.hitBlock) {
      const brokeBlock = TerrainDamageManager.instance.damageBlock(world, raycastHit.hitBlock, this.damage);

      if (this.minesMaterials && brokeBlock) {
        const player = this.parent as GamePlayerEntity;
        const blockId = raycastHit.hitBlock.blockType.id;
        const materialCount = TerrainDamageManager.getBreakMaterialCount(blockId);

        player.addMaterial(materialCount);
      }
    }

    if (raycastHit?.hitEntity) {
      this._handleHitEntity(raycastHit.hitEntity, direction);
    }

    if (raycastHit?.hitBlock || raycastHit?.hitEntity) {
      this._hitAudio.play(world, true);
    }

    return raycastHit;
  }

  private _performAttackEffects(player: GamePlayerEntity): void {
    player.startModelOneshotAnimations([ this.mlAnimation ]);
    this._attackAudio.play(this.parent!.world!, true);
  }

  protected _handleHitEntity(hitEntity: Entity, hitDirection: Vector3Like): void {
    if (!(hitEntity instanceof GamePlayerEntity) || hitEntity.isDead) return;
    
    const attacker = this.parent as GamePlayerEntity;

    attacker.dealtDamage(this.damage);
    hitEntity.takeDamage(this.damage, hitDirection, attacker);
  }
}
