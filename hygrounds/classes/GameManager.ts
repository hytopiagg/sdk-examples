import {
  GameServer,
  Player,
  Quaternion,
  Vector3Like,
  World,
} from 'hytopia';

import worldMap from '../assets/map.json';

import {
  BEDROCK_BLOCK_ID,
  CHEST_SPAWNS,
  CHEST_SPAWNS_AT_START,
  CHEST_DROP_INTERVAL_MS,
  CHEST_DROP_REGION_AABB,
  GAME_DURATION_MS,
  ITEM_SPAWNS,
  ITEM_SPAWNS_AT_START,
  ITEM_SPAWN_ITEMS,
  MINIMUM_PLAYERS_TO_START,
  SPAWN_REGION_AABB,
  RANK_WIN_EXP,
} from '../gameConfig';

import GamePlayerEntity from './GamePlayerEntity';
import ChestEntity from './ChestEntity';
import ItemFactory from './ItemFactory';

export default class GameManager {
  public static readonly instance = new GameManager();

  public world: World | undefined;
  private _chestDropInterval: NodeJS.Timeout | undefined;
  private _gameStartAt: number = 0;
  private _gameTimer: NodeJS.Timeout | undefined;
  private _playerCount: number = 0;
  private _restartTimer: NodeJS.Timeout | undefined;
  private _killCounter: Map<string, number> = new Map();
  private _gameActive: boolean = false;

  public get isGameActive(): boolean { return this._gameActive; }

  public get playerCount(): number { return this._playerCount; }
  public set playerCount(value: number) {
    this._playerCount = value;
    this._updatePlayerCountUI();
  }

  /**
   * Sets up the game world and waits for players to join
   */
  public setupGame(world: World) {
    this.world = world;
    this._spawnBedrock(world);
    this._waitForPlayersToStart();
  }

  /**
   * Starts a new game round
   */
  public startGame() {
    if (!this.world) return;

    // Clean up any previous game state
    this._cleanup();
    
    // Set game as active
    this._gameActive = true;
    this._gameStartAt = Date.now();
    
    // Spawn initial game elements
    this._spawnStartingChests();
    this._spawnStartingItems();
    this._startChestDropInterval();

    // Move all players to random spawn positions
    this.world.entityManager.getAllPlayerEntities().forEach(playerEntity => {
      playerEntity.setPosition(this.getRandomSpawnPosition());
      playerEntity.player.ui.sendData({ type: 'game-start' });
      this._sendGameStartAnnouncements(playerEntity.player);
    });
    
    // Set game timer
    this._gameTimer = setTimeout(() => this.endGame(), GAME_DURATION_MS);

    // Sync UI for all players
    this._syncAllPlayersUI();
  }

  /**
   * Ends the current game round and schedules the next one
   */
  public endGame() {
    if (!this.world || !this._gameActive) return;
    
    this._gameActive = false;
    this.world.chatManager.sendBroadcastMessage('Game over! Starting the next round in 10 seconds...', 'FF0000');
    
    this._identifyWinningPlayer();

    // Clear any existing restart timer
    if (this._restartTimer) {
      clearTimeout(this._restartTimer);
    }
    
    this._restartTimer = setTimeout(() => this.startGame(), 10 * 1000);
  }

  /**
   * Spawns a player entity in the world
   */
  public spawnPlayerEntity(player: Player) {
    if (!this.world) return;

    const playerEntity = new GamePlayerEntity(player);
    
    playerEntity.spawn(this.world, this.getRandomSpawnPosition());
  
    // Sync UI for the new player
    this.syncTimer(player);
    this.syncLeaderboard(player);

    // Send start announcement if game is active
    if (this._gameActive) {
      player.ui.sendData({ type: 'game-start' });
      this._sendGameStartAnnouncements(player);
    }

    // Load player's data
    playerEntity.loadPersistedData();
  }

  /**
   * Increments kill count for a player and updates the leaderboard
   */
  public addKill(playerUsername: string): void {
    const killCount = this._killCounter.get(playerUsername) ?? 0;
    const newKillCount = killCount + 1;
    
    this._killCounter.set(playerUsername, newKillCount);
    this._updateLeaderboardUI(playerUsername, newKillCount);
  }

  /**
   * Gets a random spawn position within the defined spawn region
   */
  public getRandomSpawnPosition(): Vector3Like {
    return {
      x: SPAWN_REGION_AABB.min.x + Math.random() * (SPAWN_REGION_AABB.max.x - SPAWN_REGION_AABB.min.x),
      y: SPAWN_REGION_AABB.min.y + Math.random() * (SPAWN_REGION_AABB.max.y - SPAWN_REGION_AABB.min.y),
      z: SPAWN_REGION_AABB.min.z + Math.random() * (SPAWN_REGION_AABB.max.z - SPAWN_REGION_AABB.min.z),
    };
  }

  /**
   * Returns the current kill counts for all players
   */
  public getKillCounts(): Record<string, number> {
    return Object.fromEntries(this._killCounter);
  }

  /**
   * Syncs the leaderboard UI for a specific player
   */
  public syncLeaderboard(player: Player) {
    if (!this.world) return;

    player.ui.sendData({
      type: 'leaderboard-sync',
      killCounts: this.getKillCounts(),
    });
  }

  /**
   * Syncs the game timer UI for a specific player
   */
  public syncTimer(player: Player) {
    if (!this.world || !this._gameStartAt) return;

    player.ui.sendData({
      type: 'timer-sync',
      startedAt: this._gameStartAt,
      endsAt: this._gameStartAt + GAME_DURATION_MS,
    });
  }

  /**
   * Resets the leaderboard and syncs it for all players
   */
  public resetLeaderboard() {
    if (!this.world) return;

    this._killCounter.clear();
    
    GameServer.instance.playerManager.getConnectedPlayersByWorld(this.world).forEach(player => {
      this.syncLeaderboard(player);
    });
  }

  /**
   * Cleans up the game state for a new round
   */
  private _cleanup() {
    if (!this.world) return;

    // Reset map to initial state
    this.world.loadMap(worldMap);
    this._spawnBedrock(this.world);

    // Reset player state
    this.world.entityManager.getAllPlayerEntities().forEach(playerEntity => {
      if (playerEntity instanceof GamePlayerEntity) {
        playerEntity.setActiveInventorySlotIndex(0); // reset to pickaxe at slot 0
        playerEntity.dropAllInventoryItems();
        playerEntity.resetCamera();
        playerEntity.resetMaterials();
        playerEntity.health = 100;
        playerEntity.shield = 0;
      }
    });

    // Remove non-player entities except pickaxes
    this.world.entityManager.getAllEntities().forEach(entity => {
      if (!(entity instanceof GamePlayerEntity) && entity.tag !== 'pickaxe') {
        // allow 1 event loop for drop to resolve, there's some 
        // weird bug here otherwise we need to investigate later.
        setTimeout(() => {
          if (entity.isSpawned) {
            entity.despawn();
          }
        }, 0);
      }
    });

    // Clear timers
    if (this._gameTimer) {
      clearTimeout(this._gameTimer);
      this._gameTimer = undefined;
    }
    
    if (this._chestDropInterval) {
      clearInterval(this._chestDropInterval);
      this._chestDropInterval = undefined;
    }

    // Reset leaderboard
    this.resetLeaderboard();
  }

  public _identifyWinningPlayer() {
    if (!this.world) return;

    // Find player with most kills
    let highestKills = 0;
    let winningPlayer = '';
    
    this._killCounter.forEach((kills, player) => {
      if (kills > highestKills) {
        highestKills = kills;
        winningPlayer = player;
      }
    });

    // Get winning player entity
    const winningPlayerEntity = this.world.entityManager
      .getAllPlayerEntities()
      .find(entity => entity.player.username === winningPlayer);

    if (!winningPlayerEntity) return;

    // Give winning player XP for winning
    if (winningPlayerEntity instanceof GamePlayerEntity) {
      winningPlayerEntity.addExp(RANK_WIN_EXP);
    }

    this.world.entityManager.getAllPlayerEntities().forEach(playerEntity => {
      if (playerEntity instanceof GamePlayerEntity) {
        if (playerEntity.player.username !== winningPlayer) { // don't change camera for the winner
          playerEntity.focusCameraOnPlayer(winningPlayerEntity as GamePlayerEntity);
        }
          
        playerEntity.player.ui.sendData({
          type: 'announce-winner',
          username: winningPlayer,
        });
      }
    });
  }

  /**
   * Syncs UI for all connected players
   */
  private _syncAllPlayersUI() {
    if (!this.world) return;
    
    const players = GameServer.instance.playerManager.getConnectedPlayersByWorld(this.world);
    players.forEach(player => {
      this.syncTimer(player);
      this.syncLeaderboard(player);
    });
  }

  /**
   * Sends game start announcements to a specific player
   */
  private _sendGameStartAnnouncements(player: Player) {
    if (!this.world) return;
    
    this.world.chatManager.sendPlayerMessage(player, 'Game started - most kills wins!', '00FF00');
    this.world.chatManager.sendPlayerMessage(player, '- Search for chests and weapons to survive');
    this.world.chatManager.sendPlayerMessage(player, '- Break blocks with your pickaxe to gain materials');
    this.world.chatManager.sendPlayerMessage(player, '- Right click to spend 3 materials to place a block');
    this.world.chatManager.sendPlayerMessage(player, '- Some weapons zoom with "Z". Drop items with "Q"');
  }

  /**
   * Creates bedrock floor for the game world
   */
  private _spawnBedrock(world: World) {
    for (let x = -50; x <= 50; x++) {
      for (let z = -50; z <= 50; z++) {
        world.chunkLattice.setBlock({ x, y: -1, z }, BEDROCK_BLOCK_ID);
      }
    }
  }

  /**
   * Spawns initial chests at random positions
   */
  private _spawnStartingChests() {
    if (!this.world) return;

    const shuffledChestSpawns = [...CHEST_SPAWNS].sort(() => Math.random() - 0.5);
    const selectedChestSpawns = shuffledChestSpawns.slice(0, CHEST_SPAWNS_AT_START);

    for (const spawn of selectedChestSpawns) {
      const chest = new ChestEntity();
      chest.spawn(this.world, spawn.position, spawn.rotation);
    }
  }

  /**
   * Spawns initial items at random positions
   */
  private _spawnStartingItems() {
    if (!this.world) return;
    
    const shuffledItemSpawns = [...ITEM_SPAWNS].sort(() => Math.random() - 0.5);
    const selectedItemSpawns = shuffledItemSpawns.slice(0, ITEM_SPAWNS_AT_START);
    const totalWeight = ITEM_SPAWN_ITEMS.reduce((sum, item) => sum + item.pickWeight, 0);

    selectedItemSpawns.forEach(async spawn => {
      // Select random item based on weight
      let random = Math.random() * totalWeight;
      let selectedItem = ITEM_SPAWN_ITEMS[0];
      
      for (const item of ITEM_SPAWN_ITEMS) {
        random -= item.pickWeight;
        if (random <= 0) {
          selectedItem = item;
          break;
        }
      }

      const item = await ItemFactory.createItem(selectedItem.itemId);
      item.spawn(this.world!, spawn.position, Quaternion.fromEuler(0, Math.random() * 360 - 180, 0));
    });
  }

  /**
   * Starts the interval for dropping chests during the game
   */
  private _startChestDropInterval() {
    if (this._chestDropInterval) {
      clearInterval(this._chestDropInterval);
    }

    this._chestDropInterval = setInterval(() => {
      if (!this.world || !this._gameActive) return;

      const randomPosition = {
        x: Math.floor(Math.random() * (CHEST_DROP_REGION_AABB.max.x - CHEST_DROP_REGION_AABB.min.x + 1)) + CHEST_DROP_REGION_AABB.min.x,
        y: CHEST_DROP_REGION_AABB.min.y,
        z: Math.floor(Math.random() * (CHEST_DROP_REGION_AABB.max.z - CHEST_DROP_REGION_AABB.min.z + 1)) + CHEST_DROP_REGION_AABB.min.z,
      };
      
      const chest = new ChestEntity();
      const randomRotation = Quaternion.fromEuler(0, [0, 90, -90, 180][Math.floor(Math.random() * 4)], 0);      
      chest.spawn(this.world, randomPosition, randomRotation);
    }, CHEST_DROP_INTERVAL_MS);
  }

  /**
   * Updates the leaderboard UI for all players
   */
  private _updateLeaderboardUI(username: string, killCount: number) {
    if (!this.world) return;

    GameServer.instance.playerManager.getConnectedPlayersByWorld(this.world).forEach(player => {
      player.ui.sendData({
        type: 'leaderboard-update',
        username,
        killCount,
      });
    });
  }

  private _updatePlayerCountUI() {
    setTimeout(() => { // have to wait 1 tick, we need to figure out this race condition later
      if (!this.world) return;

      GameServer.instance.playerManager.getConnectedPlayersByWorld(this.world).forEach(player => {
        player.ui.sendData({ type: 'players-count', count: this._playerCount });
      });
    }, 25);
  }

  /**
   * Waits for enough players to join before starting the game
   */
  private _waitForPlayersToStart() {
    if (!this.world) return;

    const connectedPlayers = GameServer.instance.playerManager.getConnectedPlayersByWorld(this.world).length;

    if (connectedPlayers >= MINIMUM_PLAYERS_TO_START) {
      this.startGame();
    } else {
      setTimeout(() => this._waitForPlayersToStart(), 1000);
    }
  }
}