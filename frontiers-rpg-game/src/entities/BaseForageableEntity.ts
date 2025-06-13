import BaseEntity, { BaseEntityOptions } from './BaseEntity';
import { SkillId } from '../config';
import type BaseItem from '../items/BaseItem';
import type GamePlayerEntity from '../GamePlayerEntity';

export type BaseForageableEntityItemDrop = {
  item: BaseItem;
  maxQuantity?: number;
  minQuantity?: number;
  weight: number;
  quantity?: number;
}

export type BaseForageableEntityOptions = {
  forageDurationMs: number;
  forageItemDrops: BaseForageableEntityItemDrop[];
  forageItemMaxDrops?: number;
  foragingExperienceReward?: number;
} & BaseEntityOptions;

export default class BaseForageableEntity extends BaseEntity {
  private _forageDurationMs: number;
  private _forageItemDrops: BaseForageableEntityItemDrop[];
  private _forageItemDropsTotalWeight: number = 0;
  private _forageItemMaxDrops: number;
  private _isBeingForaged: boolean = false;
  private _foragingExperienceReward: number;

  public constructor(options: BaseForageableEntityOptions) {
    super({
      interactActionText: 'Press "E" to forage',
      nameplateViewDistnace: 10,
      ...options,
    });

    this._forageDurationMs = options.forageDurationMs;
    this._forageItemDrops = options.forageItemDrops;
    this._forageItemDropsTotalWeight = this._forageItemDrops.reduce((sum, drop) => sum + drop.weight, 0);
    this._forageItemMaxDrops = options.forageItemMaxDrops ?? 1;
    this._foragingExperienceReward = options.foragingExperienceReward ?? 1;
  }

  public get forageDurationMs(): number { return this._forageDurationMs; }
  public get forageItemDrops(): BaseForageableEntityItemDrop[] { return this._forageItemDrops; }
  public get forageItemMaxDrops(): number { return this._forageItemMaxDrops; }
  public get isBeingForaged(): boolean { return this._isBeingForaged; }

  public forageItems(): void {
    if (!this.world || !this._forageItemDrops || this._forageItemDrops.length === 0) return;

    const maxDrops = Math.floor(Math.random() * this._forageItemMaxDrops) + 1;

    for (let i = 0; i < maxDrops; i++) {
      const pickedDrop = this._pickRandomForageItemDrop();
      if (!pickedDrop) continue;

      const min = pickedDrop.minQuantity ?? 1;
      const max = pickedDrop.maxQuantity ?? 1;
      const quantity = pickedDrop.quantity ?? Math.floor(Math.random() * (max - min + 1)) + min;
      
      pickedDrop.item.setQuantity(quantity);
      pickedDrop.item.spawnEntityAsEjectedDrop(this.world, this.position);
    }
  }

  public override interact(interactor: GamePlayerEntity): void {
    if (this._isBeingForaged) return;

    this._isBeingForaged = true;
    interactor.setIsMovementDisabled(true);
    interactor.startModelOneshotAnimations([ 'crawling' ]);

    setTimeout(() => {
      if (!this.isSpawned) return;

      if (interactor.isSpawned) {
        interactor.setIsMovementDisabled(false);
        interactor.stopModelAnimations([ 'crawling' ]);
      }

      if (!interactor.gamePlayer.isDead) {
        interactor.gamePlayer.adjustSkillExperience(SkillId.FORAGING, this._foragingExperienceReward);
      }

      this.forageItems();
      this.despawn();
    }, this._forageDurationMs);
  }

  private _pickRandomForageItemDrop(): BaseForageableEntityItemDrop | null {
    if (this._forageItemDropsTotalWeight <= 0) return null;

    const random = Math.random() * this._forageItemDropsTotalWeight;
    let cumulativeWeight = 0;

    for (const drop of this._forageItemDrops) {
      cumulativeWeight += drop.weight;
      if (random < cumulativeWeight) {
        return drop;
      }
    }

    return null;
  }
}