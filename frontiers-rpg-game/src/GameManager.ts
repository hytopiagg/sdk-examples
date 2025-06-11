import { WorldManager, PlayerManagerEvent } from 'hytopia';
import GameClock from './GameClock';
import GamePlayer from './GamePlayer';
import type GameRegion from './GameRegion';

// Regions
import ChitterForestRegion from './regions/ChitterForestRegion';
import StalkhavenRegion from './regions/StalkhavenRegion';

// Since globalEventRouter isn't exported in the main index, we'll handle cleanup differently
// We can rely on the GamePlayer.remove() method being called manually when needed
// or implement a different cleanup strategy

export default class GameManager {
  public static readonly instance = new GameManager();

  private _regions: Map<string, GameRegion> = new Map(); // tag -> region
  private _startRegion: GameRegion;

  public constructor() {
    // Note: Player disconnection cleanup would ideally be handled here
    // but since globalEventRouter isn't directly accessible from the SDK exports,
    // we rely on manual cleanup or the garbage collection of unused instances
    // The GamePlayer instances will remain in memory until explicitly removed
  }

  public get startRegion(): GameRegion { return this._startRegion; }

  public getRegion(tag: string): GameRegion | undefined {
    return this._regions.get(tag);
  }

  public loadRegions(): void {
    // Chitter Forest
    const chitterForestRegion = new ChitterForestRegion();
    this._regions.set(chitterForestRegion.tag!, chitterForestRegion);
    GameClock.instance.addWorldClockCycle(chitterForestRegion.world);
    this._startRegion = chitterForestRegion;

    // Stalkhaven
    const stalkhavenRegion = new StalkhavenRegion();
    this._regions.set(stalkhavenRegion.tag!, stalkhavenRegion);
    GameClock.instance.addWorldClockCycle(stalkhavenRegion.world);
    // this._startRegion = stalkhavenRegion;

    // Set Stalkhaven as the region/world players automatically join when they connected to the game.
    WorldManager.instance.setDefaultWorld(this._startRegion.world);
  }
}