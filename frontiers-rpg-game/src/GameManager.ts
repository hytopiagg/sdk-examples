import { Player, PlayerManager, World } from 'hytopia';
import GameClock from './GameClock';
import GamePlayer from './GamePlayer';
import { initializeItems } from './items/ItemRegistry';
import type GameRegion from './GameRegion';

// Regions
import ChitterForestRegion from './regions/chitter-forest/ChitterForestRegion';
import StalkhavenRegion from './regions/stalkhaven/StalkhavenRegion';

// Since globalEventRouter isn't exported in the main index, we'll handle cleanup differently
// We can rely on the GamePlayer.remove() method being called manually when needed
// or implement a different cleanup strategy

export default class GameManager {
  public static readonly instance = new GameManager();

  private _regions: Map<string, GameRegion> = new Map(); // id -> region
  private _startRegion: GameRegion;

  public constructor() {
    PlayerManager.instance.worldSelectionHandler = this._selectWorldForPlayer;
  }

  public get startRegion(): GameRegion { return this._startRegion; }

  public getRegion(id: string): GameRegion | undefined {
    return this._regions.get(id);
  }

  public loadItems(): void {
    initializeItems();
  }

  public loadRegions(): void {
    // Chitter Forest
    const chitterForestRegion = new ChitterForestRegion();
    this._regions.set(chitterForestRegion.id, chitterForestRegion);
    GameClock.instance.addWorldClockCycle(chitterForestRegion.world);

    // Stalkhaven
    const stalkhavenRegion = new StalkhavenRegion();
    this._regions.set(stalkhavenRegion.id, stalkhavenRegion);
    GameClock.instance.addWorldClockCycle(stalkhavenRegion.world);
    this._startRegion = stalkhavenRegion;
  }

  private _selectWorldForPlayer = async (player: Player): Promise<World | undefined> => {
    const gamePlayer = await GamePlayer.getOrCreate(player);
    return gamePlayer.currentRegion?.world ?? this._startRegion.world;
  }
}