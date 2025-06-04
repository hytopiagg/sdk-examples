import {
  ErrorHandler,
  Player,
  PlayerEvent,
  World,
  WorldManager,
  WorldOptions,
  Vector3Like,
} from 'hytopia';

import GamePlayerEntity from './GamePlayerEntity';

export type GameRegionOptions = {
  spawnPoint?: Vector3Like,
} & Omit<WorldOptions, 'id'>;

export default class GameRegion {
  private _isSetup: boolean = false;
  private _spawnPoint: Vector3Like;
  private readonly _world: World;

  public constructor(options: GameRegionOptions) {
    this._spawnPoint = options.spawnPoint ?? { x: 0, y: 10, z: 0 };

    this._world = WorldManager.instance.createWorld(options);
    this._world.on(PlayerEvent.JOINED_WORLD, ({ player }) => this.onPlayerJoin(player));
    this._world.on(PlayerEvent.LEFT_WORLD, ({ player }) => this.onPlayerLeave(player));

    // temp
    this._world.simulation.enableDebugRendering(true);
    this._world.simulation.enableDebugRaycasting(true);

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

    this._isSetup = true;
  }

  protected onPlayerJoin(player: Player) {
    const randomOffset = {
      x: this._spawnPoint.x + (Math.random() * 6) - 3, // Random between spawnPoint.x ± 3
      y: this._spawnPoint.y,
      z: this._spawnPoint.z + (Math.random() * 6) - 3  // Random between spawnPoint.z ± 3
    };
    (new GamePlayerEntity(player)).spawn(this._world, randomOffset);
  }

  protected onPlayerLeave(player: Player) {
    this._world.entityManager.getPlayerEntitiesByPlayer(player).forEach(entity => {
      entity.despawn()
  });
  }
}