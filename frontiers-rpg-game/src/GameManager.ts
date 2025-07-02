import { Player, PlayerManager, World } from 'hytopia';
import GameClock from './GameClock';
import GamePlayer from './GamePlayer';
import ItemRegistry from './items/ItemRegistry';
import QuestRegistry from './quests/QuestRegistry';
import type GameRegion from './GameRegion';

// Regions
import ChitterForestRegion from './regions/chitter-forest/ChitterForestRegion';
import HearthwildsRegion from './regions/hearthwilds/HearthwildsRegion';
import RatkinNestRegion from './regions/ratkin-nest/RatkinNestRegion';
import StalkhavenRegion from './regions/stalkhaven/StalkhavenRegion';
import StalkhavenPortRegion from './regions/stalkhaven-port/StalkhavenPortRegion';
import WeaversHollowRegion from './regions/weavers-hollow/WeaversHollowRegion';

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
    ItemRegistry.initializeItems();
  }

  public loadQuests(): void {
    QuestRegistry.initializeQuests();
  }

  public loadRegions(): void {
    // Chitter Forest
    const chitterForestRegion = new ChitterForestRegion();
    this._regions.set(chitterForestRegion.id, chitterForestRegion);
    GameClock.instance.addRegionClockCycle(chitterForestRegion);

    // Hearthwilds
    // const hearthwildsRegion = new HearthwildsRegion();
    // this._regions.set(hearthwildsRegion.id, hearthwildsRegion);
    // GameClock.instance.addRegionClockCycle(hearthwildsRegion);

    // Ratkin Nest
    const ratkinNestRegion = new RatkinNestRegion();
    this._regions.set(ratkinNestRegion.id, ratkinNestRegion);
    GameClock.instance.addRegionClockCycle(ratkinNestRegion);
    
    // Stalkhaven
    const stalkhavenRegion = new StalkhavenRegion();
    this._regions.set(stalkhavenRegion.id, stalkhavenRegion);
    GameClock.instance.addRegionClockCycle(stalkhavenRegion);

    // Stalkhaven Port
    const stalkhavenPortRegion = new StalkhavenPortRegion();
    this._regions.set(stalkhavenPortRegion.id, stalkhavenPortRegion);
    GameClock.instance.addRegionClockCycle(stalkhavenPortRegion);
    this._startRegion = stalkhavenPortRegion;

    // Weaver's Hollow
    const weaversHollowRegion = new WeaversHollowRegion();
    this._regions.set(weaversHollowRegion.id, weaversHollowRegion);
    GameClock.instance.addRegionClockCycle(weaversHollowRegion);
  }

  private _selectWorldForPlayer = async (player: Player): Promise<World | undefined> => {
    const gamePlayer = GamePlayer.getOrCreate(player);
    return gamePlayer.currentRegion?.world ?? this._startRegion.world;
  }
}