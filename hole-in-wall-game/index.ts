import {
  Audio,
  BlockType,
  Collider,
  ColliderShape,
  DefaultPlayerEntity,
  Entity,
  EntityEvent,
  GameServer,
  RigidBodyType,
  startServer,
  Player,
  PlayerEvent,
  SceneUI,
  World,
  CollisionGroup,
  PlayerEntity,
} from 'hytopia';

import GAME_WALL_SHAPES from './wall-shapes';

import worldMap from './assets/map.json';

// Game constants
enum GameWallDirection {
  NORTH = 'NORTH',
  SOUTH = 'SOUTH',
  WEST = 'WEST', 
  EAST = 'EAST',
}

const GAME_CONFIG = {
  LEVEL_DURATION: 10,
  START_DELAY: 30,
  WALL_COLLISION_GROUP: CollisionGroup.GROUP_1,
  WALL_DESPAWN_DISTANCE: 18,
  POSITIONS: {
    START: { x: 1, y: 22, z: 1 },
    JOIN_NPC: { x: 1, y: 35, z: -7 },
    PLAYER_SPAWN: { x: 1, y: 35, z: 2 },
    WALLS: {
      [GameWallDirection.NORTH]: { x: 1, y: 20, z: -10 },
      [GameWallDirection.SOUTH]: { x: 1, y: 20, z: 12 },
      [GameWallDirection.WEST]: { x: -10, y: 20, z: 1 },
      [GameWallDirection.EAST]: { x: 12, y: 20, z: 1 },
    }
  },
  WALL_VELOCITIES: {
    [GameWallDirection.NORTH]: { x: 0, y: 0, z: 1 },
    [GameWallDirection.SOUTH]: { x: 0, y: 0, z: -1 },
    [GameWallDirection.WEST]: { x: 1, y: 0, z: 0 },
    [GameWallDirection.EAST]: { x: -1, y: 0, z: 0 },
  }
};

// Game state
const QUEUED_PLAYER_ENTITIES = new Set<DefaultPlayerEntity>();
const GAME_PLAYER_ENTITIES = new Set<DefaultPlayerEntity>();

let gameLevel = 1;
let gameState: 'awaitingPlayers' | 'starting' | 'inProgress' = 'awaitingPlayers';
let gameCountdownStartTime: number | null = null;
let gameInterval: NodeJS.Timeout;
let gameStartTime: number | null = null;
let gameUiState: object = {};

// Audio
const gameActiveAudio = new Audio({
  uri: 'audio/music.mp3',
  loop: true,
  volume: 0.2,
});

const gameInactiveAudio = new Audio({
  uri: 'audio/music/hytopia-main.mp3',
  loop: true,
  volume: 0.2,
});

startServer(world => {
  world.loadMap(worldMap);
  world.on(PlayerEvent.JOINED_WORLD, ({ player }) => onPlayerJoin(world, player));
  world.on(PlayerEvent.LEFT_WORLD, ({ player }) => onPlayerLeave(world, player));

  spawnJoinNpc(world);
  gameInactiveAudio.play(world);
});

function onPlayerJoin(world: World, player: Player) {
  player.ui.load('ui/index.html');
  player.ui.sendData(gameUiState);

  const playerEntity = new DefaultPlayerEntity({
    player,
    name: 'Player',
    modelUri: 'models/players/soldier-player.gltf',
  });

  playerEntity.spawn(world, GAME_CONFIG.POSITIONS.PLAYER_SPAWN);
  
  playerEntity.setCollisionGroupsForSolidColliders({
    belongsTo: [CollisionGroup.PLAYER],
    collidesWith: [CollisionGroup.BLOCK, CollisionGroup.ENTITY, CollisionGroup.ENTITY_SENSOR, GAME_CONFIG.WALL_COLLISION_GROUP],
  });

  playerEntity.setCollisionGroupsForSensorColliders({
    belongsTo: [CollisionGroup.ENTITY_SENSOR],
    collidesWith: [CollisionGroup.BLOCK, GAME_CONFIG.WALL_COLLISION_GROUP],
  });

  playerEntity.on(EntityEvent.TICK, () => {
    if (playerEntity.position.y < 5) {
      killPlayer(playerEntity);
    }
  });
}

function onPlayerLeave(world: World, player: Player) {
  world.entityManager.getPlayerEntitiesByPlayer(player).forEach(entity => {
    removePlayerFromQueue(entity);
    killPlayer(entity);
    entity.despawn();
  });
}

function spawnJoinNpc(world: World) {
  const joinNpc = new Entity({
    name: 'Join NPC',
    modelUri: 'models/npcs/mindflayer.gltf',
    modelLoopedAnimations: ['idle'],
    modelScale: 0.4,
    rigidBodyOptions: {
      rotation: { x: 0, y: 1, z: 0, w: 0 },
      enabledPositions: { x: false, y: true, z: false },
      enabledRotations: { x: false, y: true, z: false },
      colliders: [
        Collider.optionsFromModelUri('models/npcs/mindflayer.gltf', 0.4),
        {
          shape: ColliderShape.CYLINDER,
          radius: 2,
          halfHeight: 2,
          isSensor: true,
          onCollision: (other: BlockType | Entity, started: boolean) => {
            if (other instanceof PlayerEntity && started) {
              addPlayerEntityToQueue(world, other);
            }
          }
        }
      ],
    },
  });

  joinNpc.spawn(world, GAME_CONFIG.POSITIONS.JOIN_NPC);

  const sceneUi = new SceneUI({
    templateId: 'join-npc-ui',
    attachedToEntity: joinNpc,
    offset: { x: 0, y: 2.5, z: 0 },
  });

  sceneUi.load(world);
}

function addPlayerEntityToQueue(world: World, playerEntity: PlayerEntity) {
  if (QUEUED_PLAYER_ENTITIES.has(playerEntity)) return;
  
  QUEUED_PLAYER_ENTITIES.add(playerEntity);
  world.chatManager.sendPlayerMessage(playerEntity.player, 'You have joined the next game queue!', '00FF00');
  uiUpdate({ queueCount: QUEUED_PLAYER_ENTITIES.size });

  if (gameState === 'awaitingPlayers' && QUEUED_PLAYER_ENTITIES.size > 1) {
    queueGame(world);
  }

  const queuedSceneUi = new SceneUI({
    templateId: 'player-queued',
    attachedToEntity: playerEntity,
    offset: { x: 0, y: 1, z: 0 },
  });

  queuedSceneUi.load(world);
}

function queueGame(world: World) {
  gameState = 'starting';
  gameCountdownStartTime = Date.now();

  uiUpdate({
    gameState,
    gameCountdownStartTime,
    countdown: GAME_CONFIG.START_DELAY,
  });

  setTimeout(() => {
    QUEUED_PLAYER_ENTITIES.forEach(playerEntity => {
      playerEntity.setPosition(GAME_CONFIG.POSITIONS.START);
      GAME_PLAYER_ENTITIES.add(playerEntity);

      world.sceneUIManager.getAllEntityAttachedSceneUIs(playerEntity).forEach(sceneUi => {
        sceneUi.unload();
      });
    });

    QUEUED_PLAYER_ENTITIES.clear();
    uiUpdate({ queueCount: 0 });
    startGame(world);
  }, GAME_CONFIG.START_DELAY * 1000);
}

function startGame(world: World) {
  gameState = 'inProgress';
  gameStartTime = Date.now();

  gameInactiveAudio.pause();
  gameActiveAudio.play(world, true);

  const gameLoop = () => {
    if (!gameStartTime) return clearTimeout(gameInterval);

    const elapsedTime = Date.now() - gameStartTime;
    const level = Math.floor(elapsedTime / (GAME_CONFIG.LEVEL_DURATION * 1000)) + 1;

    const speedModifier = 1 + (level * 0.15);
    const spawnInterval = Math.max(2000, 10000 - (level * 1000));
    
    const directions = Object.values(GameWallDirection);
    const randomDirection = directions[Math.floor(Math.random() * directions.length)];

    generateWall(world, randomDirection, speedModifier);

    clearTimeout(gameInterval);
    gameInterval = setTimeout(gameLoop, spawnInterval);

    if (level > gameLevel) {
      gameLevel = level;
      uiUpdate({ gameLevel });
    }
  }

  gameLoop();

  uiUpdate({
    gameState: 'inProgress',
    gameStartTime,
    playersRemaining: Array.from(GAME_PLAYER_ENTITIES).map(playerEntity => playerEntity.player.username),
  });
}

function endGame() {
  clearTimeout(gameInterval);
  gameState = 'awaitingPlayers';
  gameLevel = 1;

  const winner = Array.from(GAME_PLAYER_ENTITIES)[0];
  if (winner) {
    winner.setPosition(GAME_CONFIG.POSITIONS.PLAYER_SPAWN);
    winner.world!.chatManager.sendBroadcastMessage(`${winner.player.username} wins!`, '00FF00');
  }

  GAME_PLAYER_ENTITIES.clear();

  gameActiveAudio.pause();
  gameInactiveAudio.play(gameInactiveAudio.world!, true);
  
  uiUpdate({ gameState: 'awaitingPlayers', gameLevel: 1 });
}

function killPlayer(playerEntity: PlayerEntity) {
  if (!GAME_PLAYER_ENTITIES.has(playerEntity)) return;

  playerEntity.setPosition(GAME_CONFIG.POSITIONS.PLAYER_SPAWN);
  GAME_PLAYER_ENTITIES.delete(playerEntity);

  if (GAME_PLAYER_ENTITIES.size <= 1) {
    endGame();
  }

  uiUpdate({
    playersRemaining: Array.from(GAME_PLAYER_ENTITIES).map(playerEntity => playerEntity.player.username),
  });
}

function removePlayerFromQueue(playerEntity: PlayerEntity) {
  if (!QUEUED_PLAYER_ENTITIES.has(playerEntity)) return;
  QUEUED_PLAYER_ENTITIES.delete(playerEntity);
  uiUpdate({ queueCount: QUEUED_PLAYER_ENTITIES.size });
}

function generateWall(world: World, direction: GameWallDirection, speedModifier: number = 1) {
  const selectedShape = GAME_WALL_SHAPES[Math.floor(Math.random() * GAME_WALL_SHAPES.length)];
  const isNorthSouth = direction === GameWallDirection.NORTH || direction === GameWallDirection.SOUTH;

  for (let y = 0; y < selectedShape.length; y++) {
    for (let x = 0; x < selectedShape[y].length; x++) {
      if (selectedShape[y][x] === 0) continue;

      const xOffset = (x - selectedShape[y].length / 2) * 1 + 0.5;
      const yOffset = (selectedShape.length - y - 1) * 1 + 0.5;

      const wallSegment = new Entity({
        blockTextureUri: selectedShape[y][x] === 2 ? 'blocks/dirt.png' : 
                        selectedShape[y][x] === 3 ? 'blocks/sand.png' : 
                        'blocks/oak-leaves.png',
        blockHalfExtents: {
          x: isNorthSouth ? 0.5 : 0.5,
          y: 0.5,
          z: isNorthSouth ? 0.5 : 0.5
        },
        rigidBodyOptions: {
          type: RigidBodyType.KINEMATIC_VELOCITY,
        }
      });

      const spawnPosition = { ...GAME_CONFIG.POSITIONS.WALLS[direction] };
      
      if (isNorthSouth) {
        spawnPosition.x += xOffset;
        spawnPosition.y += yOffset;
        if (selectedShape[y][x] === 2) {
          spawnPosition.z += direction === GameWallDirection.NORTH ? 1 : -1;
        } else if (selectedShape[y][x] === 3) {
          spawnPosition.z += direction === GameWallDirection.NORTH ? 2 : -2;
        }
      } else {
        spawnPosition.z += xOffset;
        spawnPosition.y += yOffset;
        if (selectedShape[y][x] === 2) {
          spawnPosition.x += direction === GameWallDirection.WEST ? 1 : -1;
        } else if (selectedShape[y][x] === 3) {
          spawnPosition.x += direction === GameWallDirection.WEST ? 2 : -2;
        }
      }

      wallSegment.spawn(world, spawnPosition);
      
      wallSegment.setCollisionGroupsForSolidColliders({
        belongsTo: [GAME_CONFIG.WALL_COLLISION_GROUP],
        collidesWith: [CollisionGroup.PLAYER, CollisionGroup.ENTITY_SENSOR],
      });

      wallSegment.setLinearVelocity({
        x: GAME_CONFIG.WALL_VELOCITIES[direction].x * speedModifier,
        y: GAME_CONFIG.WALL_VELOCITIES[direction].y * speedModifier,
        z: GAME_CONFIG.WALL_VELOCITIES[direction].z * speedModifier,
      });

      wallSegment.on(EntityEvent.TICK, () => {
        if (!wallSegment.isSpawned) return;
        const position = wallSegment.position;

        if (Math.abs(position.x - spawnPosition.x) > GAME_CONFIG.WALL_DESPAWN_DISTANCE || 
            Math.abs(position.z - spawnPosition.z) > GAME_CONFIG.WALL_DESPAWN_DISTANCE) {
          wallSegment.setLinearVelocity({ x: 0, y: -32, z: 0 });
          
          setTimeout(() => {
            if (wallSegment.isSpawned) {
              wallSegment.despawn();
            }
          }, 1000);
        }
      });
    }
  }
}

function uiUpdate(data: object) {
  gameUiState = { ...gameUiState, ...data };
  GameServer.instance.playerManager.getConnectedPlayers().forEach(player => {
    player.ui.sendData(data);
  });
}