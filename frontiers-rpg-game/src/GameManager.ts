import { WorldManager } from 'hytopia';
import GameClock from './GameClock';
import type GameRegion from './GameRegion';

// Regions
import StalkhavenRegion from './regions/StalkhavenRegion';

export default class GameManager {
  public static readonly instance = new GameManager();

  private _regions: Map<string, GameRegion> = new Map(); // tag -> region
  private _startRegion: GameRegion;

  public get startRegion(): GameRegion { return this._startRegion; }

  public getRegion(tag: string): GameRegion | undefined {
    return this._regions.get(tag);
  }

  public loadRegions(): void {
    // Stalkhaven, Main City (Start)
    const stalkhavenRegion = new StalkhavenRegion();
    this._regions.set(stalkhavenRegion.tag!, stalkhavenRegion);
    GameClock.instance.addWorldClockCycle(stalkhavenRegion.world);
    this._startRegion = stalkhavenRegion;

    // Other regions...

    // Set Stalkhaven as the region/world players automatically join when they connect to the game.
    WorldManager.instance.setDefaultWorld(stalkhavenRegion.world);
  }
}