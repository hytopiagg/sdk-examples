import {
  EventPayloads,
  EventRouter,
  Player,
  PlayerCameraMode,
  PlayerInput,
  PlayerUIEvent,
  QuaternionLike,
  Vector3Like,
  World,
  WorldLoopEvent,
} from 'hytopia';

import ChestEntity from './ChestEntity';
import GamePlayerEntity from './GamePlayerEntity';
import GunEntity from './GunEntity';
import ItemEntity from './ItemEntity';
import { SPAWN_REGION_AABB } from '../gameConfig';

const AIM_JITTER_RADIANS = 0.055;
const AIM_JITTER_RANDOM_MIN_SCALE = 0.6;
const AIM_JITTER_RANDOM_MAX_SCALE = 2.6;
const MELEE_ATTACK_RANGE = 2.4;
const PICKAXE_SLOT_INDEX = 0;
const LOOT_INTERACT_RANGE = 1.5;
const NAVIGATION_PROGRESS_INTERVAL_MS = 600;
const NAVIGATION_MIN_PROGRESS = 0.35;
const MAX_VERTICAL_TARGET_DELTA = 12;
const MELEE_LOOT_OPPORTUNITY_RANGE = 8;
const BEHAVIOR_LOCK_MS = 450;
const REACTION_DELAY_MS = 180;
const ENEMY_RETARGET_COOLDOWN_MS = 750;
const ENEMY_LOST_GRACE_MS = 1400;
const LOOT_RETARGET_COOLDOWN_MS = 550;
const LOOT_LOST_GRACE_MS = 2200;

enum BotBehaviorState {
  IDLE = 'IDLE',
  LOOT = 'LOOT',
  COMBAT = 'COMBAT',
}

type PlayerUiListener = (payload: { data: Record<string, unknown> }) => void;

class BotPlayerUI {
  private _listeners: Map<PlayerUIEvent, Set<PlayerUiListener>> = new Map();

  public load(_: string): void {}

  public sendData(_: object): void {}

  public on(event: PlayerUIEvent, callback: PlayerUiListener): void {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, new Set());
    }

    this._listeners.get(event)!.add(callback);
  }

  public emitData(data: Record<string, unknown>): void {
    const listeners = this._listeners.get(PlayerUIEvent.DATA);
    listeners?.forEach(listener => listener({ data }));
  }
}

class BotPlayerCamera {
  public mode: PlayerCameraMode = PlayerCameraMode.FIRST_PERSON;
  public offset: Vector3Like = { x: 0, y: 0.5, z: 0 };
  public zoom: number = 1;
  private _orientation = { pitch: 0, yaw: 0 };
  private _attachedEntity: GamePlayerEntity | undefined;

  public get orientation(): { pitch: number; yaw: number } {
    return this._orientation;
  }

  public get facingDirection(): Vector3Like {
    return {
      x: -Math.sin(this._orientation.yaw) * Math.cos(this._orientation.pitch),
      y: Math.sin(this._orientation.pitch),
      z: -Math.cos(this._orientation.yaw) * Math.cos(this._orientation.pitch),
    };
  }

  public get facingQuaternion(): QuaternionLike {
    const hp = this._orientation.pitch * 0.5;
    const hy = this._orientation.yaw * 0.5;
    const cp = Math.cos(hp);
    const sp = Math.sin(hp);
    const cy = Math.cos(hy);
    const sy = Math.sin(hy);

    return {
      x: sp * cy,
      y: cp * sy,
      z: -sp * sy,
      w: cp * cy,
    };
  }

  public setMode(mode: PlayerCameraMode): void {
    this.mode = mode;
  }

  public setAttachedToEntity(entity: GamePlayerEntity): void {
    this._attachedEntity = entity;
  }

  public setViewModelHiddenNodes(_: string[]): void {}

  public setViewModelShownNodes(_: string[]): void {}

  public setViewModelYawsWithCamera(_: boolean): void {}

  public setViewModelPitchesWithCamera(_: boolean): void {}

  public setOffset(offset: Vector3Like): void {
    this.offset = { ...offset };
  }

  public setOrientationYaw(yaw: number): void {
    this._orientation.yaw = yaw;
  }

  public setOrientationPitch(pitch: number): void {
    this._orientation.pitch = pitch;
  }

  public facePosition(position: Vector3Like): void {
    if (!this._attachedEntity) {
      return;
    }

    const origin = this._attachedEntity.position;
    const dir = {
      x: position.x - origin.x,
      y: position.y - origin.y,
      z: position.z - origin.z,
    };
    const flat = Math.hypot(dir.x, dir.z) || 1;

    this._orientation.yaw = Math.atan2(-dir.x, -dir.z);
    this._orientation.pitch = Math.atan2(dir.y, flat);
  }

  public setZoom(zoom: number): void {
    this.zoom = zoom;
  }
}

class BotStubPlayer extends EventRouter {
  private static _idCounter = 1;

  public readonly id: string;
  public readonly camera: BotPlayerCamera;
  public readonly cosmetics: Promise<void>;
  public readonly ui: BotPlayerUI;
  public input: PlayerInput = {};
  public profilePictureUrl: string | undefined;
  public username: string;
  public world: World | undefined;
  private _persistedData: Record<string, unknown> | undefined;

  public constructor(username: string) {
    super();

    this.id = `bot-${BotStubPlayer._idCounter++}`;
    this.username = username;
    this.camera = new BotPlayerCamera();
    this.cosmetics = Promise.resolve(undefined);
    this.ui = new BotPlayerUI();
  }

  public joinWorld(world: World): void {
    this.world = world;
  }

  public getPersistedData(): Record<string, unknown> | undefined {
    return this._persistedData;
  }

  public setPersistedData(data: Record<string, unknown>): void {
    this._persistedData = { ...(this._persistedData ?? {}), ...data };
  }

  public setMaxInteractDistance(_distance: number): void {
    // No-op for bot stub player - bots interact directly via method calls
  }

  public scheduleNotification(): Promise<string | void> {
    return Promise.resolve();
  }

  public unscheduleNotification(): Promise<boolean> {
    return Promise.resolve(false);
  }

  public resetInputs(): void {
    this.input = {};
  }
}

export default class BotPlayerEntity extends GamePlayerEntity {
  private static readonly _botsByWorld: Map<number, Set<BotPlayerEntity>> = new Map();
  private static readonly _activeWorlds: Set<number> = new Set();
  private static readonly _maxBots = 3;
  private static readonly _humanPlayersBeforeBotRemoval = 5;

  public static ensureForWorld(world: World): void {
    const bots = this._botsByWorld.get(world.id) ?? new Set<BotPlayerEntity>();

    if (!this._botsByWorld.has(world.id)) {
      this._botsByWorld.set(world.id, bots);
    }

    const humanPlayers = world.entityManager
      .getAllPlayerEntities()
      .filter(entity => !(entity instanceof BotPlayerEntity))
      .length;

    const playersAboveThreshold = Math.max(0, humanPlayers - this._humanPlayersBeforeBotRemoval);
    const desiredBots = Math.max(0, Math.min(this._maxBots, this._maxBots - playersAboveThreshold));

    while (bots.size < desiredBots) {
      const botName = this._generateRandomBotName();
      const driver = new BotStubPlayer(botName);
      const bot = new BotPlayerEntity(driver);
      bot.spawn(world, BotPlayerEntity._randomSpawnPosition());
      bots.add(bot);
    }

    while (bots.size > desiredBots) {
      const iterator = bots.values().next();
      if (iterator.done) {
        break;
      }

      const bot = iterator.value;
      bot.despawn();
      bots.delete(bot);
    }
  }

  public static despawnAll(world: World | undefined): void {
    if (!world) {
      return;
    }

    const bots = this._botsByWorld.get(world.id);
    bots?.forEach(bot => bot.despawn());
    this._botsByWorld.delete(world.id);
  }

  public static setWorldActive(world: World | undefined, active: boolean): void {
    if (!world) {
      return;
    }

    if (active) {
      this._activeWorlds.add(world.id);
    } else {
      this._activeWorlds.delete(world.id);
    }
  }

  private static _randomSpawnPosition(): Vector3Like {
    return {
      x: SPAWN_REGION_AABB.min.x + Math.random() * (SPAWN_REGION_AABB.max.x - SPAWN_REGION_AABB.min.x),
      y: SPAWN_REGION_AABB.min.y + Math.random() * (SPAWN_REGION_AABB.max.y - SPAWN_REGION_AABB.min.y),
      z: SPAWN_REGION_AABB.min.z + Math.random() * (SPAWN_REGION_AABB.max.z - SPAWN_REGION_AABB.min.z),
    };
  }

  private static _generateRandomBotName(): string {
    const digits = Math.floor(Math.random() * 1_000_000_000)
      .toString()
      .padStart(9, '0');
    return `guest-${digits}`;
  }

  private readonly _driver: BotStubPlayer;
  private _behaviorState: BotBehaviorState = BotBehaviorState.IDLE;
  private _behaviorLockUntil = 0;
  private _targetEnemy: GamePlayerEntity | undefined;
  private _targetLootEntity: ItemEntity | ChestEntity | undefined;
  private _idleDestination: Vector3Like | undefined;
  private _nextSenseAt = 0;
  private _strafeDirection: 1 | -1 = 1;
  private _strafeSwitchAt = 0;
  private _loopHandler: ((payload: EventPayloads[WorldLoopEvent.TICK_START]) => void) | undefined;
  private _loopWorld: World | undefined;
  private _lastWorldId: number | undefined;
  private _navLastTarget: Vector3Like | undefined;
  private _navLastDistance: number = Number.POSITIVE_INFINITY;
  private _navLastCheckAt = 0;
  private _navLastShortProgressAt = 0;
  private _jumpRetryDebounceAt = 0;
  private _unstickLastPosition: Vector3Like | undefined;
  private _unstickNextCheckAt = 0;
  private _blockBreakTarget: Vector3Like | undefined;
  private _blockBreakExpiresAt = 0;
  private _spentWeaponIds: Set<number> = new Set();
  private _targetReevalAt = 0;
  private _spentWeapons = new WeakSet<GunEntity>();
  private _enemyRetargetCooldownUntil = 0;
  private _enemyForgetAt = 0;
  private _lootRetargetCooldownUntil = 0;
  private _lootForgetAt = 0;
  private _activeLootTargetId: number | undefined;
  private _lootOverrideUntil = 0;
  private _nextReactionAt = 0;

  private constructor(driver: BotStubPlayer) {
    super(driver as unknown as Player);
    this._driver = driver;
  }

  public override spawn(world: World, position: Vector3Like, rotation?: QuaternionLike): void {
    this._driver.joinWorld(world);
    super.spawn(world, position, rotation);
    this._lastWorldId = world.id;
    this._bindLoop(world);
  }

  public override despawn(): void {
    this._unbindLoop();
    const worldId = this._lastWorldId;
    super.despawn();

    if (worldId !== undefined) {
      BotPlayerEntity._botsByWorld.get(worldId)?.delete(this);
    }
  }

  public override setupPlayerUI(): void {
    // Bots do not need UI.
  }

  public override async loadPersistedData(): Promise<void> {
    // No-op for bots.
  }

  public override savePersistedData(): void {
    // No-op for bots.
  }

  public override respawn(): void {
    super.respawn();
    this._idleDestination = undefined;
    this._blockBreakTarget = undefined;
    this._targetLootEntity = undefined;
    this._activeLootTargetId = undefined;
    this._blockBreakTarget = undefined;
    this._blockBreakExpiresAt = 0;
    this._activeLootTargetId = undefined;
    this._activeLootTargetId = undefined;
    this._spentWeaponIds.clear();
    this._spentWeapons = new WeakSet<GunEntity>();
  }

  private _bindLoop(world: World): void {
    this._loopHandler = ({ tickDeltaMs }) => this._updateBehavior(tickDeltaMs);
    this._loopWorld = world;
    world.loop.on(WorldLoopEvent.TICK_START, this._loopHandler);
  }

  private _unbindLoop(): void {
    if (this._loopHandler && this._loopWorld) {
      this._loopWorld.loop.off(WorldLoopEvent.TICK_START, this._loopHandler);
    }

    this._loopHandler = undefined;
    this._loopWorld = undefined;
  }

  private _updateBehavior(deltaTimeMs: number): void {
    if (!this.world || !BotPlayerEntity._activeWorlds.has(this.world.id) || this.isDead) {
      this._resetInput();
      return;
    }

    this._resetInput();
    this._navLastCheckAt = Math.min(this._navLastCheckAt, performance.now());
    this._senseEnvironment();
    this._monitorAndUnstick();

    const hasEnemy = Boolean(this._targetEnemy?.isSpawned);
    const now = performance.now();
    const lootOverrideActive = now < this._lootOverrideUntil;
    let desiredState = BotBehaviorState.IDLE;
    if (hasEnemy && !lootOverrideActive) {
      desiredState = BotBehaviorState.COMBAT;
    } else if (this._targetLootEntity?.isSpawned) {
      desiredState = BotBehaviorState.LOOT;
    }

    const forceCombat = desiredState === BotBehaviorState.COMBAT && this._behaviorState !== BotBehaviorState.COMBAT;
    this._setBehaviorState(desiredState, forceCombat);

    switch (this._behaviorState) {
      case BotBehaviorState.COMBAT:
        this._driveCombat(deltaTimeMs);
        break;
      case BotBehaviorState.LOOT:
        this._driveLoot();
        break;
      default:
        this._driveIdle();
        break;
    }
  }

  private _setBehaviorState(state: BotBehaviorState, force: boolean = false): void {
    if (state === this._behaviorState) {
      return;
    }

    const now = performance.now();
    if (!force && now < this._behaviorLockUntil) {
      return;
    }

    this._behaviorState = state;
    this._behaviorLockUntil = now + BEHAVIOR_LOCK_MS;
    this._blockBreakTarget = undefined;
    this._blockBreakExpiresAt = 0;
    this._navLastTarget = undefined;
    this._navLastDistance = Number.POSITIVE_INFINITY;
    if (state === BotBehaviorState.LOOT) {
      this._targetReevalAt = now + 4000;
    } else {
      this._targetReevalAt = 0;
      if (state === BotBehaviorState.COMBAT) {
        this._lootOverrideUntil = 0;
      }
    }
  }

  private _senseEnvironment(): void {
    if (!this.world) {
      return;
    }

    if (performance.now() < this._nextSenseAt) {
      return;
    }

    this._nextSenseAt = performance.now() + 200;
    const position = this.position;

    let closestEnemy: GamePlayerEntity | undefined;
    let closestEnemyDist = Number.POSITIVE_INFINITY;

    for (const entity of this.world.entityManager.getAllPlayerEntities()) {
      if (!(entity instanceof GamePlayerEntity)) {
        continue;
      }

      if (entity === (this as GamePlayerEntity)) {
        continue;
      }

      if (Math.abs(entity.position.y - position.y) > MAX_VERTICAL_TARGET_DELTA) {
        continue;
      }

      const dist = this._distanceSq(position, entity.position);
      if (dist < closestEnemyDist) {
        closestEnemy = entity;
        closestEnemyDist = dist;
      }
    }

    this._updateEnemyTarget(closestEnemy);

    let closestGun: GunEntity | undefined;
    let closestGunDist = Number.POSITIVE_INFINITY;
    let closestChest: ChestEntity | undefined;
    let closestChestDist = Number.POSITIVE_INFINITY;
    let closestItem: ItemEntity | undefined;
    let closestItemDist = Number.POSITIVE_INFINITY;

    for (const entity of this.world.entityManager.getAllEntities()) {
      if (!entity.isSpawned) {
        continue;
      }

      if (Math.abs(entity.position.y - position.y) > MAX_VERTICAL_TARGET_DELTA) {
        continue;
      }

      if (entity instanceof ChestEntity) {
        if (entity.isOpened) {
          continue;
        }

        const dist = this._distanceSq(position, entity.position);
        if (dist < closestChestDist) {
          closestChestDist = dist;
          closestChest = entity;
        }

        continue;
      }

      if (!(entity instanceof ItemEntity)) {
        continue;
      }

      if (entity.parent) {
        continue;
      }

      if (entity instanceof GunEntity && this._isSpentGun(entity)) {
        continue;
      }

      const dist = this._distanceSq(position, entity.position);
      if (entity instanceof GunEntity) {
        if (dist < closestGunDist) {
          closestGunDist = dist;
          closestGun = entity;
        }
      } else if (dist < closestItemDist) {
        closestItemDist = dist;
        closestItem = entity;
      }
    }

    const weaponNeeded = !this._hasUsableGun();
    const lowOnAmmo = this._shouldSeekAmmo();
    const prioritizeWeapons = weaponNeeded || lowOnAmmo;

    const desiredLoot = prioritizeWeapons
      ? closestGun ?? closestChest ?? closestItem
      : closestChest ?? closestGun ?? closestItem;

    this._updateLootTarget(desiredLoot);

    if (!this._targetEnemy && !this._targetLootEntity) {
      if (!this._idleDestination || this._distanceSq(this._idleDestination, position) < 1) {
        this._idleDestination = BotPlayerEntity._randomSpawnPosition();
      }
    }
  }

  private _updateEnemyTarget(candidate: GamePlayerEntity | undefined): void {
    const now = performance.now();
    const current = this._targetEnemy;
    const candidateValid = Boolean(
      candidate && candidate.isSpawned && !candidate.isDead,
    );

    if (candidateValid && candidate) {
      if (current === candidate) {
        this._enemyForgetAt = now + ENEMY_LOST_GRACE_MS;
        return;
      }

      const canRetarget =
        !current ||
        !current.isSpawned ||
        current.isDead ||
        now >= this._enemyRetargetCooldownUntil;

      if (canRetarget) {
        this._targetEnemy = candidate;
        this._enemyRetargetCooldownUntil = now + ENEMY_RETARGET_COOLDOWN_MS;
        this._enemyForgetAt = now + ENEMY_LOST_GRACE_MS;
        this._blockBreakTarget = undefined;
        this._blockBreakExpiresAt = 0;
        this._nextReactionAt = now + REACTION_DELAY_MS + Math.random() * REACTION_DELAY_MS;
      }

      return;
    }

    if (
      current &&
      (!current.isSpawned || current.isDead || now > this._enemyForgetAt)
    ) {
      this._targetEnemy = undefined;
      this._nextReactionAt = 0;
    }
  }

  private _updateLootTarget(candidate: ItemEntity | ChestEntity | undefined): void {
    const now = performance.now();
    const current = this._targetLootEntity;

    if (this._isValidLootTarget(candidate)) {
      if (current === candidate) {
        this._lootForgetAt = now + LOOT_LOST_GRACE_MS;
        return;
      }

      const canRetarget =
        !this._isValidLootTarget(current) ||
        now >= this._lootRetargetCooldownUntil;

      if (canRetarget) {
        this._targetLootEntity = candidate;
        this._activeLootTargetId = candidate.id;
        this._lootRetargetCooldownUntil = now + LOOT_RETARGET_COOLDOWN_MS;
        this._lootForgetAt = now + LOOT_LOST_GRACE_MS;
        this._blockBreakTarget = undefined;
        this._blockBreakExpiresAt = 0;
        this._targetReevalAt = now + 4000;
      }

      return;
    }

    if (
      current &&
      (!this._isValidLootTarget(current) || now > this._lootForgetAt)
    ) {
      this._targetLootEntity = undefined;
      this._activeLootTargetId = undefined;
    }
  }

  private _isValidLootTarget(entity: ItemEntity | ChestEntity | undefined): entity is ItemEntity | ChestEntity {
    if (!entity || !entity.isSpawned) {
      return false;
    }

    if (entity instanceof ItemEntity) {
      return !entity.parent;
    }

    if (entity instanceof ChestEntity) {
      return !entity.isOpened;
    }

    return true;
  }

  private _findNearbyLootOpportunity(radius: number): ItemEntity | ChestEntity | undefined {
    if (!this.world) {
      return undefined;
    }

    const radiusSq = radius * radius;
    let closestGun: GunEntity | undefined;
    let closestGunDist = Number.POSITIVE_INFINITY;
    let closestChest: ChestEntity | undefined;
    let closestChestDist = Number.POSITIVE_INFINITY;

    for (const entity of this.world.entityManager.getAllEntities()) {
      if (!entity.isSpawned) {
        continue;
      }

      const distSq = this._distanceSq(this.position, entity.position);
      if (distSq > radiusSq) {
        continue;
      }

      if (entity instanceof GunEntity) {
        if (entity.parent || this._isSpentGun(entity)) {
          continue;
        }
        if (distSq < closestGunDist) {
          closestGun = entity;
          closestGunDist = distSq;
        }
        continue;
      }

      if (entity instanceof ChestEntity) {
        if (entity.isOpened) {
          continue;
        }
        if (distSq < closestChestDist) {
          closestChest = entity;
          closestChestDist = distSq;
        }
      }
    }

    return closestGun ?? closestChest;
  }

  private _driveCombat(deltaTimeMs: number): void {
    if (
      !this.world ||
      !this._targetEnemy ||
      !this._targetEnemy.isSpawned ||
      this._targetEnemy.isDead
    ) {
      this._targetEnemy = undefined;
      return;
    }

    const enemyPosition = this._targetEnemy.position;
    const distance = Math.sqrt(this._distanceSq(this.position, enemyPosition));
    if (performance.now() < this._nextReactionAt) {
      this._facePosition(enemyPosition, true, AIM_JITTER_RADIANS);
      return;
    }

    const gun = this._ensureBestWeaponEquipped();

    if (gun && gun.hasUsableAmmo()) {
      this._handleGunCombat(gun, enemyPosition, distance, deltaTimeMs);
      return;
    }

    const lootOpportunity = this._findNearbyLootOpportunity(MELEE_LOOT_OPPORTUNITY_RANGE);
    if (lootOpportunity) {
      this._targetLootEntity = lootOpportunity;
      this._activeLootTargetId = lootOpportunity.id;
      this._targetReevalAt = performance.now() + 4000;
      this._lootOverrideUntil = performance.now() + 3000;
      this._setBehaviorState(BotBehaviorState.LOOT, true);
      return;
    }

    // No usable gun available and no nearby loot; engage with melee.
    this._handleMeleeCombat(enemyPosition, distance, deltaTimeMs);
    return;
  }

  private _driveLoot(): void {
    const target = this._targetLootEntity;
    const now = performance.now();

    if (!target) {
      this._activeLootTargetId = undefined;
      this._lootOverrideUntil = 0;
      return;
    }

    if (target.id !== undefined && target.id !== this._activeLootTargetId) {
      this._targetReevalAt = now + 4000;
      this._activeLootTargetId = target.id;
    }

    if (!this._isValidLootTarget(target)) {
      this._targetLootEntity = undefined;
      this._activeLootTargetId = undefined;
      return;
    }

    if (now > this._targetReevalAt) {
      this._targetLootEntity = undefined;
      this._activeLootTargetId = undefined;
      this._blockBreakTarget = undefined;
      this._blockBreakExpiresAt = 0;
      this._targetReevalAt = now + 4000;
      this._lootOverrideUntil = 0;
      return;
    }

    const targetPosition = { ...target.position };
    const distance = Math.sqrt(this._distanceSq(this.position, targetPosition));
    this._facePosition(targetPosition, false, AIM_JITTER_RADIANS * 0.25);
    if (this._blockBreakTarget && this._continueBlockBreaking(targetPosition)) {
      return;
    }

    if (this._maybeBreakBlockForTarget(targetPosition)) {
      return;
    }
    if (this._recordNavigationProgress(targetPosition)) {
      this._moveTowards(targetPosition);
    } else {
      this._targetLootEntity = undefined;
      this._activeLootTargetId = undefined;
      return;
    }

    if (distance < LOOT_INTERACT_RANGE) {
      if (target instanceof ItemEntity) {
        target.pickup(this);
      } else if (target instanceof ChestEntity) {
        target.open();
      }

      this._targetLootEntity = undefined;
      this._activeLootTargetId = undefined;
    }
  }

  private _driveIdle(): void {
    if (!this._idleDestination) {
      this._idleDestination = BotPlayerEntity._randomSpawnPosition();
    }

    this._facePosition(this._idleDestination);
    this._moveTowards(this._idleDestination);

    if (this._distanceSq(this.position, this._idleDestination) < 4) {
      this._idleDestination = BotPlayerEntity._randomSpawnPosition();
    }
  }

  private _moveTowards(target: Vector3Like): void {
    const direction = this._directionTo(target);
    this._faceDirection(direction);

    const input = this.player.input as PlayerInput;
    input.w = true;
    input.sh = true;

    const shouldJump = this._shouldAutoJump(target);
    if (shouldJump) {
      input.sp = true;
      this._jumpRetryDebounceAt = performance.now() + 550;
    } else if (!this._hasHeadroom() && this.playerController.isGrounded) {
      input.sp = true;
    }

    if (this._isPathBlocked()) {
      this._strafe(0);
      if (this.playerController.isGrounded && performance.now() > this._jumpRetryDebounceAt) {
        input.sp = true;
        this._jumpRetryDebounceAt = performance.now() + 550;
      }
    }

    this._recordNavigationProgress(target);
  }

  private _strafe(deltaTimeMs: number): void {
    const now = performance.now();
    if (now > this._strafeSwitchAt) {
      this._strafeDirection = this._strafeDirection === 1 ? -1 : 1;
      this._strafeSwitchAt = now + 1500 + Math.random() * 1200;
    }

    const input = this.player.input as PlayerInput;
    if (this._strafeDirection > 0) {
      input.d = true;
    } else {
      input.a = true;
    }

    if (deltaTimeMs > 0 && Math.random() < 0.008 && this.playerController.isGrounded) {
      input.sp = true;
    }
  }

  private _resetInput(): void {
    const input = this.player.input as PlayerInput;

    Object.keys(input).forEach(key => {
      delete (input as Record<string, unknown>)[key];
    });
  }

  private _directionTo(target: Vector3Like): Vector3Like {
    const dir = {
      x: target.x - this.position.x,
      y: target.y - this.position.y,
      z: target.z - this.position.z,
    };

    const length = Math.hypot(dir.x, dir.y, dir.z) || 1;

    return {
      x: dir.x / length,
      y: dir.y / length,
      z: dir.z / length,
    };
  }

  private _distanceSq(a: Vector3Like, b: Vector3Like): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dz = a.z - b.z;

    return dx * dx + dy * dy + dz * dz;
  }

  private _faceDirection(direction: Vector3Like, jitterRadians: number = 0): void {
    let yaw = Math.atan2(-direction.x, -direction.z);
    let pitch = Math.atan2(direction.y, Math.hypot(direction.x, direction.z));

    if (jitterRadians > 0) {
      const jitterScale =
        AIM_JITTER_RANDOM_MIN_SCALE +
        Math.random() * (AIM_JITTER_RANDOM_MAX_SCALE - AIM_JITTER_RANDOM_MIN_SCALE);
      const yawJitter = (Math.random() - 0.5) * 2 * jitterRadians * jitterScale;
      const pitchJitter = (Math.random() - 0.5) * jitterRadians * jitterScale;
      yaw += yawJitter;
      pitch += pitchJitter;
    }

    const camera = this._botCamera;
    camera.setOrientationYaw(yaw);
    camera.setOrientationPitch(pitch);
  }

  private _facePosition(position: Vector3Like, flatten: boolean = false, jitterRadians: number = 0): void {
    const dir = this._directionTo(position);
    if (flatten) {
      dir.y = 0;
    }

    this._faceDirection(dir, jitterRadians);
  }

  private _isPathBlocked(): boolean {
    if (!this.world) {
      return false;
    }

    const origin = {
      x: this.position.x,
      y: this.position.y + this._botCamera.offset.y,
      z: this.position.z,
    };

    const raycast = this.world.simulation.raycast(
      origin,
      this._botCamera.facingDirection,
      0.75,
      {
        filterExcludeRigidBody: this.rawRigidBody,
      },
    );

    return Boolean(raycast?.hitBlock);
  }

  private get _botCamera(): BotPlayerCamera {
    return this.player.camera as unknown as BotPlayerCamera;
  }

  private _recordNavigationProgress(target: Vector3Like): boolean {
    const now = performance.now();
    const distance = Math.sqrt(this._distanceSq(this.position, target));

    if (
      !this._navLastTarget ||
      this._distanceSq(this._navLastTarget, target) > 1
    ) {
      this._navLastTarget = { ...target };
      this._navLastDistance = Number.POSITIVE_INFINITY;
      this._navLastCheckAt = now;
      return true;
    }

    if (now - this._navLastCheckAt < NAVIGATION_PROGRESS_INTERVAL_MS) {
      return true;
    }

    const progress = this._navLastDistance - distance;
    this._navLastCheckAt = now;
    this._navLastDistance = distance;

    if (progress < NAVIGATION_MIN_PROGRESS) {
      this._handleNavigationFailure();
      return false;
    }

    return true;
  }

  private _handleNavigationFailure(): void {
    const now = performance.now();
    if (now > this._jumpRetryDebounceAt && this.playerController.isGrounded) {
      (this.player.input as PlayerInput).sp = true;
      this._jumpRetryDebounceAt = now + 550;
    }

    if (!this._blockBreakTarget) {
      const forward = this._blockAheadCoordinate();
      if (forward && this._assignBlockBreak(forward)) {
        return;
      }
    }

    this._targetLootEntity = undefined;
    this._idleDestination = BotPlayerEntity._randomSpawnPosition();
    this._navLastTarget = undefined;
    this._navLastDistance = Number.POSITIVE_INFINITY;
  }

  private _hasHeadroom(): boolean {
    if (!this.world) {
      return true;
    }

    const origin = {
      x: this.position.x,
      y: this.position.y + 0.5,
      z: this.position.z,
    };

    const hit = this.world.simulation.raycast(origin, { x: 0, y: 1, z: 0 }, 1.8, {
      filterExcludeRigidBody: this.rawRigidBody,
    });

    return !hit?.hitBlock;
  }

  private _shouldAutoJump(target: Vector3Like): boolean {
    if (!this.world || performance.now() < this._jumpRetryDebounceAt) {
      return false;
    }

    const direction = this._directionTo(target);
    const horizontal = Math.hypot(direction.x, direction.z) || 1;
    const forward = { x: direction.x / horizontal, z: direction.z / horizontal };

    const footOrigin = {
      x: this.position.x + forward.x * 0.4,
      y: this.position.y - this.height * 0.5 + 0.1,
      z: this.position.z + forward.z * 0.4,
    };

    const blockAhead = this._castBlock(footOrigin, { x: forward.x, y: 0, z: forward.z }, 0.9);
    if (!blockAhead) {
      return false;
    }

    const headOrigin = {
      x: footOrigin.x,
      y: this.position.y + this.height * 0.4,
      z: footOrigin.z,
    };

    const headClear = !this._castBlock(headOrigin, { x: forward.x, y: 0, z: forward.z }, 0.75);
    return headClear;
  }

  private _castBlock(origin: Vector3Like, direction: Vector3Like, length: number): boolean {
    if (!this.world) {
      return false;
    }

    const hit = this.world.simulation.raycast(origin, direction, length, {
      filterExcludeRigidBody: this.rawRigidBody,
    });

    return Boolean(hit?.hitBlock);
  }

  private _monitorAndUnstick(): void {
    if (!this.world) {
      return;
    }

    const now = performance.now();

    if (!this._unstickLastPosition) {
      this._unstickLastPosition = { ...this.position };
      this._unstickNextCheckAt = now + 650;
      return;
    }

    if (now < this._unstickNextCheckAt) {
      return;
    }

    const moved = Math.sqrt(this._distanceSq(this.position, this._unstickLastPosition));
    this._unstickLastPosition = { ...this.position };
    this._unstickNextCheckAt = now + 650;

    if (moved > 0.25) {
      return;
    }

    this._forceUnstick();
  }

  private _forceUnstick(): void {
    const mass = Math.max(1, this.mass);
    const impulseMagnitude = 4 * mass;
    const angle = Math.random() * Math.PI * 2;
    const impulse = {
      x: Math.cos(angle) * impulseMagnitude,
      y: impulseMagnitude * 0.6,
      z: Math.sin(angle) * impulseMagnitude,
    };

    this.applyImpulse(impulse);
    (this.player.input as PlayerInput).sp = true;
    this._jumpRetryDebounceAt = performance.now() + 520;

    if (this._behaviorState === BotBehaviorState.LOOT) {
      this._targetLootEntity = undefined;
      this._activeLootTargetId = undefined;
    }

    this._blockBreakTarget = undefined;
    this._blockBreakExpiresAt = 0;
    this._idleDestination = BotPlayerEntity._randomSpawnPosition();
  }

  private _continueBlockBreaking(desiredPosition?: Vector3Like): boolean {
    if (!this.world || !this._blockBreakTarget) {
      return false;
    }

    if (this._blockBreakExpiresAt && performance.now() > this._blockBreakExpiresAt) {
      this._blockBreakTarget = undefined;
      this._blockBreakExpiresAt = 0;
      return false;
    }

    const blockType = this.world.chunkLattice.getBlockType(this._blockBreakTarget);
    if (!blockType) {
      this._blockBreakTarget = undefined;
      this._blockBreakExpiresAt = 0;
      return false;
    }

    const blockCenter = {
      x: this._blockBreakTarget.x + 0.5,
      y: this._blockBreakTarget.y + 0.5,
      z: this._blockBreakTarget.z + 0.5,
    };

    const distance = Math.sqrt(this._distanceSq(this.position, blockCenter));
    if (desiredPosition && distance > 2.5) {
      this._moveTowards(desiredPosition);
      return true;
    }

    this.setActiveInventorySlotIndex(PICKAXE_SLOT_INDEX);
    const input = this.player.input as PlayerInput;
    input.ml = true;

    this._facePosition(blockCenter);

    return true;
  }

  private _maybeBreakBlockForTarget(targetPosition: Vector3Like, allowAbove: boolean = false): boolean {
    if (!this.world) {
      return false;
    }

    if (this._blockBreakTarget) {
      return this._continueBlockBreaking(targetPosition);
    }

    const verticalDelta = this.position.y - targetPosition.y;
    const horizontalSq = this._distanceSq(
      { x: this.position.x, y: 0, z: this.position.z },
      { x: targetPosition.x, y: 0, z: targetPosition.z },
    );

    const botAboveTarget = verticalDelta > 0.5;
    const botBelowTarget = verticalDelta < -0.5;

    if (botAboveTarget && horizontalSq < 4) {
      const below = this._blockBelowCoordinate();
      if (below && this._assignBlockBreak(below)) {
        return true;
      }
    }

    const ahead = this._blockAheadCoordinate();
    if (
      ahead &&
      (allowAbove || !botAboveTarget || targetPosition.y <= this.position.y + 0.25) &&
      this._assignBlockBreak(ahead)
    ) {
      return true;
    }

    if (allowAbove && botBelowTarget && horizontalSq < 4) {
      const above = this._blockAboveCoordinate();
      if (above && this._assignBlockBreak(above)) {
        return true;
      }
    }

    return false;
  }

  private _blockBelowCoordinate(): Vector3Like | undefined {
    if (!this.world) {
      return undefined;
    }

    const coord = {
      x: Math.floor(this.position.x),
      y: Math.floor(this.position.y - this.height * 0.5),
      z: Math.floor(this.position.z),
    };

    return this.world.chunkLattice.getBlockType(coord) ? coord : undefined;
  }

  private _blockAheadCoordinate(): Vector3Like | undefined {
    if (!this.world) {
      return undefined;
    }

    const forward = this._botCamera.facingDirection;
    const horizontal = Math.hypot(forward.x, forward.z) || 1;
    const coord = {
      x: Math.floor(this.position.x + forward.x / horizontal),
      y: Math.floor(this.position.y - this.height * 0.25),
      z: Math.floor(this.position.z + forward.z / horizontal),
    };

    return this.world.chunkLattice.getBlockType(coord) ? coord : undefined;
  }

  private _blockAboveCoordinate(): Vector3Like | undefined {
    if (!this.world) {
      return undefined;
    }

    const coord = {
      x: Math.floor(this.position.x),
      y: Math.floor(this.position.y + this.height * 0.5),
      z: Math.floor(this.position.z),
    };

    return this.world.chunkLattice.getBlockType(coord) ? coord : undefined;
  }

  private _assignBlockBreak(coord: Vector3Like): boolean {
    if (!this.world) {
      return false;
    }

    const block = this.world.chunkLattice.getBlockType(coord);
    if (!block) {
      return false;
    }

    this._blockBreakTarget = { ...coord };
    this._blockBreakExpiresAt = performance.now() + 3000;
    return true;
  }

  private _hasLineOfSight(target: Vector3Like, distance: number): boolean {
    if (!this.world) {
      return false;
    }

    const origin = {
      x: this.position.x,
      y: this.position.y + this._botCamera.offset.y,
      z: this.position.z,
    };

    const direction = {
      x: target.x - origin.x,
      y: target.y - origin.y,
      z: target.z - origin.z,
    };

    const length = Math.hypot(direction.x, direction.y, direction.z) || 1;
    direction.x /= length;
    direction.y /= length;
    direction.z /= length;

    const hit = this.world.simulation.raycast(origin, direction, distance, {
      filterExcludeRigidBody: this.rawRigidBody,
    });

    if (!hit) {
      return true;
    }

    if (hit.hitEntity && hit.hitEntity === this._targetEnemy) {
      return true;
    }

    return false;
  }

  private _hasUsableGun(): boolean {
    return !!this._findBestGun();
  }

  private _shouldSeekAmmo(): boolean {
    const bestGun = this._findBestGun(true);
    if (!bestGun) { return true; }
    const ammoTotal = bestGun.gun.getClipAmmo() + bestGun.gun.getReserveAmmo();
    return ammoTotal < 5;
  }

  private _findBestGun(requireAmmo: boolean = true): { gun: GunEntity; slot: number } | undefined {
    const items = this.inventoryItems;
    let best: { gun: GunEntity; slot: number; score: number } | undefined;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!(item instanceof GunEntity)) continue;

      if (this._isSpentGun(item)) continue;

      if (!item.hasUsableAmmo()) {
        this._markWeaponSpent(item);
        continue;
      }

      const ammoScore = item.getClipAmmo() + item.getReserveAmmo();
      if (requireAmmo && ammoScore <= 0) continue;

      if (!best || ammoScore > best.score) {
        best = { gun: item, slot: i, score: ammoScore };
      }
    }

    return best ? { gun: best.gun, slot: best.slot } : undefined;
  }

  private _isSpentGun(gun: GunEntity): boolean {
    if (this._spentWeapons.has(gun)) {
      return true;
    }

    const id = typeof gun.id === 'number' ? gun.id : undefined;
    return id !== undefined && this._spentWeaponIds.has(id);
  }

  private _markWeaponSpent(gun: GunEntity): void {
    this._spentWeapons.add(gun);
    if (typeof gun.id === 'number') {
      this._spentWeaponIds.add(gun.id);
    }
  }

  private _reloadUntilFull(gun: GunEntity, attempt: number = 0): void {
    if (gun.getReserveAmmo() <= 0) {
      return;
    }

    if (gun.getClipAmmo() > 0) {
      return;
    }

    const activeItem = this.activeInventoryItem;
    if (activeItem !== gun) {
      const slot = this.getItemInventorySlot(gun);
      if (slot !== -1) {
        this.setActiveInventorySlotIndex(slot);
      }
    }

    if (!gun.isReloading()) {
      gun.reload();
    }

    if (attempt > 6) {
      return;
    }

    const retryDelay = Math.max(100, gun.getReloadTimeMs());
    setTimeout(() => this._reloadUntilFull(gun, attempt + 1), retryDelay);
  }

  private _ensureBestWeaponEquipped(): GunEntity | undefined {
    const activeItem = this.activeInventoryItem;
    const activeGun = activeItem instanceof GunEntity ? activeItem : undefined;
    const bestGunInfo = this._findBestGun();

    if (!bestGunInfo) {
      if (!activeGun) {
        this.setActiveInventorySlotIndex(PICKAXE_SLOT_INDEX);
      }
      return undefined;
    }

    if (activeGun === bestGunInfo.gun) {
      return activeGun;
    }

    this.setActiveInventorySlotIndex(bestGunInfo.slot);
    return bestGunInfo.gun;
  }

  private _handleGunCombat(gun: GunEntity, enemyPosition: Vector3Like, distance: number, deltaTimeMs: number): void {
    const hasLineOfSight = this._hasLineOfSight(enemyPosition, distance);
    this._facePosition(enemyPosition, true, AIM_JITTER_RADIANS);

    if (!gun.hasUsableAmmo()) {
      const alternate = this._findBestGun(true);
      if (gun.getClipAmmo() <= 0 && gun.getReserveAmmo() <= 0 && this.activeInventoryItem === gun) {
        this._markWeaponSpent(gun);
        this.dropActiveInventoryItem();
      }

      if (alternate) {
        this.setActiveInventorySlotIndex(alternate.slot);
        return;
      }

      this._handleMeleeCombat(enemyPosition, distance, deltaTimeMs);
      return;
    }

    if (gun.getClipAmmo() <= 0) {
      if (gun.getReserveAmmo() > 0) {
        if (!gun.isReloading()) {
          this._reloadUntilFull(gun);
        }
        return;
      }

      // Gun is empty; drop and flag it as spent.
      this._markWeaponSpent(gun);
      if (this.isItemActiveInInventory(gun)) {
        this.dropActiveInventoryItem();
      }

      const fallback = this._findBestGun(false);
      if (fallback && fallback.gun.hasUsableAmmo()) {
        this.setActiveInventorySlotIndex(fallback.slot);
        return;
      }

      this._targetLootEntity = undefined;
      this._activeLootTargetId = undefined;
      this._handleMeleeCombat(enemyPosition, distance, deltaTimeMs);
      return;
    }

    const input = this.player.input as PlayerInput;
    const preferredRange = Math.max(6, gun.getEffectiveRange() * 0.6);

    if (!hasLineOfSight) {
      if (this._maybeBreakBlockForTarget(enemyPosition, true)) {
        return;
      }
      this._moveTowards(enemyPosition);
      return;
    }

    if (this._blockBreakTarget) {
      this._blockBreakTarget = undefined;
      this._blockBreakExpiresAt = 0;
    }

    if (distance > preferredRange) {
      this._moveTowards(enemyPosition);
    } else if (distance < preferredRange * 0.4) {
      input.s = true;
    } else {
      this._strafe(deltaTimeMs);
    }

    input.ml = true;
    input.sh = true;

    if (gun.getClipAmmo() <= 1 && gun.getReserveAmmo() > 0 && !gun.isReloading()) {
      gun.reload();
    }

    if (!gun.hasUsableAmmo()) {
      this._activeLootTargetId = undefined;
    }
  }

  private _handleMeleeCombat(enemyPosition: Vector3Like, distance: number, deltaTimeMs: number): void {
    this.setActiveInventorySlotIndex(PICKAXE_SLOT_INDEX);
    this._facePosition(enemyPosition, true, AIM_JITTER_RADIANS * 0.5);

    const input = this.player.input as PlayerInput;

    if (distance > MELEE_ATTACK_RANGE || !this._hasLineOfSight(enemyPosition, distance)) {
      this._moveTowards(enemyPosition);
      return;
    }

    input.ml = true;
    this._strafe(deltaTimeMs);

    if (Math.random() < 0.05 && this.playerController.isGrounded) {
      input.sp = true;
    }
  }
}

