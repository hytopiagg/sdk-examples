import {
  DefaultPlayerEntity,
  Player,
  PlayerEvent,
  World,
  WorldManager,
  WorldOptions,
  Vector3Like,
} from 'hytopia';

export type GameRegionOptions = {
  spawnPoint?: Vector3Like,
} & Omit<WorldOptions, 'id'>;

export default class GameRegion {
  private readonly _spawnPoint: Vector3Like;
  private readonly _world: World;

  public constructor(options: GameRegionOptions) {
    this._spawnPoint = options.spawnPoint ?? { x: 0, y: 10, z: 0 };

    this._world = WorldManager.instance.createWorld(options);
    this._world.on(PlayerEvent.JOINED_WORLD, ({ player }) => this._onPlayerJoin(player));
    this._world.on(PlayerEvent.LEFT_WORLD, ({ player }) => this._onPlayerLeave(player));
  }

  public get world(): World { return this._world; }

  public get name(): string { return this._world.name; }

  public get tag(): string | undefined { return this._world.tag; }

  private _onPlayerJoin(player: Player) {
    (new DefaultPlayerEntity({ player })).spawn(this._world, this._spawnPoint);
  }

  private _onPlayerLeave(player: Player) {
    this._world.entityManager.getPlayerEntitiesByPlayer(player).forEach(entity => {
      entity.despawn()
  });
  }
}