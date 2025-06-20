import BaseEntity, { BaseEntityOptions } from './BaseEntity';
import { SkillId } from '../config';
import type { ItemClass } from '../items/BaseItem';
import type GamePlayerEntity from '../GamePlayerEntity';

export enum BaseForageableEntityPlayerEvent {
  FORAGED = 'BaseForageableEntity.FORAGED',
}

export type BaseForageableEntityPlayerEventPayloads = {
  [BaseForageableEntityPlayerEvent.FORAGED]: { entity: BaseForageableEntity };
}

export type ForageableItemDrop = {
  itemClass: ItemClass;
  maxQuantity?: number;
  minQuantity?: number;
  weight: number;
  quantity?: number;
}

export type BaseForageableEntityOptions = {
  forageDurationMs: number;
  itemDrops: ForageableItemDrop[];
  maxDropsPerForage?: number;
  experienceReward?: number;
} & BaseEntityOptions;

export default class BaseForageableEntity extends BaseEntity {
  private _forageDurationMs: number;
  private _itemDrops: ForageableItemDrop[];
  private _totalDropWeight: number = 0;
  private _maxDropsPerForage: number;
  private _isBeingForaged: boolean = false;
  private _experienceReward: number;

  public constructor(options: BaseForageableEntityOptions) {
    super({
      interactActionText: 'Press "E" to forage',
      nameplateViewDistnace: 10,
      ...options,
    });

    this._forageDurationMs = options.forageDurationMs;
    this._itemDrops = options.itemDrops;
    this._totalDropWeight = this._itemDrops.reduce((sum, drop) => sum + drop.weight, 0);
    this._maxDropsPerForage = options.maxDropsPerForage ?? 1;
    this._experienceReward = options.experienceReward ?? 1;
  }

  public get forageDurationMs(): number { return this._forageDurationMs; }
  public get itemDrops(): ForageableItemDrop[] { return this._itemDrops; }
  public get maxDropsPerForage(): number { return this._maxDropsPerForage; }
  public get isBeingForaged(): boolean { return this._isBeingForaged; }

  public forageItems(): void {
    if (!this.world || !this._itemDrops || this._itemDrops.length === 0) return;

    const maxDrops = Math.floor(Math.random() * this._maxDropsPerForage) + 1;

    for (let i = 0; i < maxDrops; i++) {
      const selectedDrop = this._selectRandomDrop();
      if (!selectedDrop) continue;

      const quantity = this._calculateDropQuantity(selectedDrop);
      const item = selectedDrop.itemClass.create({ quantity });
      item.spawnEntityAsEjectedDrop(this.world, this.position);
    }
  }

  public override interact(interactor: GamePlayerEntity): void {
    if (this._isBeingForaged) return;

    this._isBeingForaged = true;
    interactor.setIsMovementDisabled(true);
    interactor.startModelOneshotAnimations([ 'foraging-transition' ]);
    interactor.playerController.idleLoopedAnimations = [ 'foraging-loop' ]; // player controller stops all looped animations atm for its state, so we set the idle looped animations instead.

    setTimeout(() => {
      if (!this.isSpawned) return;

      if (interactor.isSpawned) {
        interactor.setIsMovementDisabled(false);
        interactor.stopModelAnimations([ 'foraging-transition' ]);
        interactor.playerController.idleLoopedAnimations = [ 'idle-upper', 'idle-lower' ];
      }

      if (!interactor.gamePlayer.isDead) {
        interactor.gamePlayer.adjustSkillExperience(SkillId.FORAGING, this._experienceReward);
        interactor.gamePlayer.eventRouter.emit(BaseForageableEntityPlayerEvent.FORAGED, { entity: this });
      }

      this.forageItems();
      this.despawn();
    }, this._forageDurationMs);
  }

  private _calculateDropQuantity(drop: ForageableItemDrop): number {
    const min = drop.minQuantity ?? 1;
    const max = drop.maxQuantity ?? 1;
    return drop.quantity ?? Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private _selectRandomDrop(): ForageableItemDrop | null {
    if (this._totalDropWeight <= 0) return null;

    const random = Math.random() * this._totalDropWeight;
    let cumulativeWeight = 0;

    for (const drop of this._itemDrops) {
      cumulativeWeight += drop.weight;
      if (random < cumulativeWeight) {
        return drop;
      }
    }

    return null;
  }
}