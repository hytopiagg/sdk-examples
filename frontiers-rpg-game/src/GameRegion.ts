import {
  Audio,
  Collider,
  ColliderShape,
  BlockType,
  Entity,
  ErrorHandler,
  Player,
  PlayerEvent,
  World,
  WorldManager,
  WorldOptions,
  Vector3Like,
} from 'hytopia';

import GamePlayer from './GamePlayer';
import GamePlayerEntity from './GamePlayerEntity';

export type GameRegionOptions = {
  ambientAudioUri?: string,
  ambientAudioVolume?: number,
  spawnPoint?: Vector3Like,
} & Omit<WorldOptions, 'id'>;

export default class GameRegion {
  private _ambientAudio: Audio | undefined;
  private _isSetup: boolean = false;
  private _outOfWorldCollider: Collider | undefined;
  private _spawnPoint: Vector3Like;
  private readonly _world: World;

  public constructor(options: GameRegionOptions) {
    this._ambientAudio = options.ambientAudioUri ? new Audio({
      uri: options.ambientAudioUri,
      volume: options.ambientAudioVolume ?? 0.05,
      loop: true,
    }) : undefined;

    this._spawnPoint = options.spawnPoint ?? { x: 0, y: 10, z: 0 };

    this._world = WorldManager.instance.createWorld(options);
    this._world.on(PlayerEvent.JOINED_WORLD, ({ player }) => this.onPlayerJoin(player));
    this._world.on(PlayerEvent.LEFT_WORLD, ({ player }) => this.onPlayerLeave(player));

    // temp
    // this._world.simulation.enableDebugRendering(true);
    // this._world.simulation.enableDebugRaycasting(true);

    this.setup();
  }

  public get name(): string { return this._world.name; }
  public get spawnPoint(): Vector3Like { return this._spawnPoint; }
  public get tag(): string | undefined { return this._world.tag; }
  public get world(): World { return this._world; }

  protected setup(): void { // intended to be overridden by subclasses
    if (this._isSetup) {
      return ErrorHandler.warning(`GameRegion.setup(): ${this.name} already setup.`);
    }

    if (this._ambientAudio) {
      this._ambientAudio.play(this._world);
    }

    this._outOfWorldCollider = new Collider({
      shape: ColliderShape.BLOCK,
      halfExtents: { x: 500, y : 32, z: 500 },
      isSensor: true,
      relativePosition: { x: 0, y: -64, z: 0 },
      onCollision: this.onEntityOutOfWorld,
      simulation: this._world.simulation, // setting this auto adds collider to simulation upon creation.
    });

    this._isSetup = true;
  }

  protected onEntityOutOfWorld(other: BlockType | Entity, started: boolean) {
    if (!started) return;

    if (other instanceof GamePlayerEntity) {
      other.setPosition(other.gamePlayer.respawnPoint); // move them to respawn point
      return other.takeDamage(other.maxHealth); // kill player
    }

    if (other instanceof Entity) {
      return other.despawn();
    }
  }

  protected onPlayerJoin(player: Player) {
    const gamePlayer = GamePlayer.getOrCreate(player);
    
    // Set the current region for the player
    gamePlayer.setCurrentRegion(this);
    
    // Get the region spawn point if set by a portal or something else, otherwise use the default region spawn point.
    const spawnPoint = gamePlayer.regionSpawnPoint ?? this._spawnPoint;
    
    (new GamePlayerEntity(gamePlayer)).spawn(this._world, spawnPoint);
  }

  protected onPlayerLeave(player: Player) {
    this._world.entityManager.getPlayerEntitiesByPlayer(player).forEach(entity => {
      entity.despawn();
    });
    
    // Note: We don't remove the GamePlayer instance here since the player
    // might move to another region and we want to preserve their state
  }
}