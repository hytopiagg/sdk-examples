import { WorldManager } from 'hytopia';
import type GameRegion from './GameRegion';

// Regions
import Stalkhaven from './regions/Stalkhaven';

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
    const stalkhaven = new Stalkhaven();
    this._regions.set(stalkhaven.tag!, stalkhaven);
    this._startRegion = stalkhaven;

    // Other regions...

    // Set Stalkhaven as the region/world players automatically join when they connect to the game.
    WorldManager.instance.setDefaultWorld(stalkhaven.world);
  }
}