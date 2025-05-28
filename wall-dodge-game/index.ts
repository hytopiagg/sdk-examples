import {
  Audio,
  CollisionGroup,
  ColliderShape,
  DefaultPlayerEntity,
  BlockType,
  Entity,
  EntityEvent,
  GameServer,
  SceneUI,
  startServer,
  Player,
  PlayerEvent,
  RigidBodyType,
  SimpleEntityController,
  World,
  Collider,
  DefaultPlayerEntityController,
} from 'hytopia';

import worldMap from './assets/map.json';

const GAME_BLOCK_SIZE_RANGE = {
  x: [ 0.5, 4 ],
  y: [ 0.5, 4 ],
  z: [ 0.5, 1.5 ],
};

const GAME_BLOCK_SPAWN_RANGE = {
  x: [ -7, 7 ],
  y: [ 1, 4 ],
  z: [ -25, -25 ],
};

const GAME_BLOCK_RANDOM_TEXTURES = [
  'blocks/grass',
  'blocks/bricks.png',
  'blocks/glass.png',
  'blocks/gravel.png',
  'blocks/sand.png',
  'blocks/void-sand.png',
];

const GAME_BLOCK_DESPAWN_Z = 12; // Blocks will despawn when block z position is > than this.

const GAME_BLOCK_COLLISION_GROUP = CollisionGroup.GROUP_1;

const PLAYER_GAME_START_TIME = new Map<Player, number>(); // Player -> start time of current game
const PLAYER_TOP_SCORES = new Map<Player, number>(); // Player -> highest ever score
let GAME_TOP_SCORES: { name: string, score: number }[] = []; // array user [name, score]

startServer(world => {
  // Uncomment this to visualize physics vertices, will cause noticable lag.
  // world.simulation.enableDebugRendering(true);
  
  world.loadMap(worldMap);
  world.on(PlayerEvent.JOINED_WORLD, ({ player }) => onPlayerJoin(world, player));
  world.on(PlayerEvent.LEFT_WORLD, ({ player }) => onPlayerLeave(world, player));

  setupJoinNPC(world);
  startBlockSpawner(world);

  (new Audio({
    uri: 'audio/bgm.mp3',
    loop: true,
    volume: 0.05,
  })).play(world);
});

/**
 * Creates and sets up the NPC the player can interact
 * with to join the game.
 */
function setupJoinNPC(world: World) {
  let focusedPlayer: DefaultPlayerEntity | null = null;

  // Create our NPC
  const joinNPC = new Entity({
    controller: new SimpleEntityController(),
    name: 'Join NPC',
    modelUri: 'models/npcs/mindflayer.gltf',
    modelLoopedAnimations: [ 'idle' ],
    modelScale: 0.5,
    rigidBodyOptions: {
      type: RigidBodyType.FIXED, // It won't ever move, so we can use a fixed body
      rotation: { x: 0, y: 1, z: 0, w: 0 }, // Rotate the NPC to face the player
      colliders: [
        Collider.optionsFromModelUri('models/npcs/mindflayer.gltf', 0.5), // Uses the model's bounding box to create the hitbox collider
        { // Create a sensor that teleports the player into the game
          shape: ColliderShape.BLOCK,
          halfExtents: { x: 1.5, y: 1, z: 1.5 }, // size it slightly smaller than the platform the join NPC is standing on
          isSensor: true,
          tag: 'teleport-sensor',
          onCollision: (other: BlockType | Entity, started: boolean) => {
            if (started && other instanceof DefaultPlayerEntity) {
              startGame(other); // When a player entity enters this sensor, start the game for them
            }
          },
        },
        { // Create a sensor to detect players for a fun rotation effect
          shape: ColliderShape.CYLINDER,
          radius: 5,
          halfHeight: 2,
          isSensor: true, // This makes the collider not collide with other entities/objets
          tag: 'rotate-sensor',
          onCollision: (other: BlockType | Entity, started: boolean) => {
            if (started && other instanceof DefaultPlayerEntity) {
              focusedPlayer = other;
            }
          },
        },
      ],
    },
  });

  // Rotate to face the last focused player position every 250ms
  setInterval(() => {
    if (focusedPlayer?.isSpawned) {
      (joinNPC.controller! as SimpleEntityController).face(focusedPlayer.position, 2);
    }
  }, 250);

  joinNPC.spawn(world, { x: 1, y: 3.1, z: 15 });
 
  // Create the Scene UI over the NPC
  const npcMessageUI = new SceneUI({
    templateId: 'join-npc-message',
    attachedToEntity: joinNPC,
    offset: { x: 0, y: 1.75, z: 0 },
  });

  npcMessageUI.load(world);
}

/**
 * Start spawning blocks in the game
 */
function startBlockSpawner(world: World) {
  const spawnBlock = () => {
    // Calculate random number of blocks to spawn (1-8)
    const numBlocks = Math.floor(Math.random() * 8) + 1;
    
    for (let i = 0; i < numBlocks; i++) {
      // Calculate random half extents within allowed ranges
      const x = Math.max(0.5, Math.random() * GAME_BLOCK_SIZE_RANGE.x[1]);
      const y = Math.max(0.5, Math.random() * GAME_BLOCK_SIZE_RANGE.y[1]); 
      const z = Math.max(0.5, Math.random() * GAME_BLOCK_SIZE_RANGE.z[1]);
      
      const halfExtents = {
        x: y > 0.5 ? 0.5 : x,
        y: x > 0.5 ? 0.5 : y,
        z,
      };

      // Calculate spawn point ranges accounting for block size
      const spawnPoint = {
        x: Math.random() * (GAME_BLOCK_SPAWN_RANGE.x[1] - GAME_BLOCK_SPAWN_RANGE.x[0] - halfExtents.x * 2) + GAME_BLOCK_SPAWN_RANGE.x[0] + halfExtents.x,
        y: Math.random() * (GAME_BLOCK_SPAWN_RANGE.y[1] - GAME_BLOCK_SPAWN_RANGE.y[0] - halfExtents.y * 2) + GAME_BLOCK_SPAWN_RANGE.y[0] + halfExtents.y,
        z: Math.random() * (GAME_BLOCK_SPAWN_RANGE.z[1] - GAME_BLOCK_SPAWN_RANGE.z[0] - halfExtents.z * 2) + GAME_BLOCK_SPAWN_RANGE.z[0] + halfExtents.z,
      };

      // Calculate random velocity between 5-10
      const linearVelocity = 5 + Math.random() * 5;

      // Apply random angular velocity 10% of the time
      const angularVelocity = Math.random() < 0.1 ? {
        x: (Math.random() - 0.5) * 5, // -5 to 5
        y: (Math.random() - 0.5) * 5,
        z: (Math.random() - 0.5) * 5,
      } : {
        x: 0,
        y: 0, 
        z: 0,
      };

      const blockEntity = new Entity({
        blockTextureUri: GAME_BLOCK_RANDOM_TEXTURES[Math.floor(Math.random() * GAME_BLOCK_RANDOM_TEXTURES.length)],
        blockHalfExtents: halfExtents,
        rigidBodyOptions: {
          type: RigidBodyType.KINEMATIC_VELOCITY,
          linearVelocity: { x: 0, y: 0, z: linearVelocity },
          angularVelocity,
        },
      });
  
      blockEntity.on(EntityEvent.TICK, () => {
        if (blockEntity.isSpawned && blockEntity.position.z > GAME_BLOCK_DESPAWN_Z) {
          // Make it "fall" out of the world for a nice effect and prevent
          // player collision platforming sensors from not getting their off
          // event triggered because of despawning before uncontact.
          blockEntity.setLinearVelocity({ x: 0, y: -5, z: 0 });
        }

        if (blockEntity.isSpawned && blockEntity.position.y < -5) {
          blockEntity.despawn();
        }
      });
  
      blockEntity.spawn(world, spawnPoint);

      // Set groups after spawn so they apply to internally generated colliders too.
      blockEntity.setCollisionGroupsForSolidColliders({
        belongsTo: [ GAME_BLOCK_COLLISION_GROUP ],
        collidesWith: [ CollisionGroup.PLAYER ],
      });
    }
    
    setTimeout(spawnBlock, 250 + Math.random() * 750);
  };

  spawnBlock();
}

function startGame(playerEntity: DefaultPlayerEntity) {
  playerEntity.setPosition({ x: 1, y: 4, z: 1 });
  playerEntity.setOpacity(0.3);
  playerEntity.player.ui.sendData({ type: 'game-start' });
  enablePlayerEntityGameCollisions(playerEntity, false);

  PLAYER_GAME_START_TIME.set(playerEntity.player, Date.now());
  
  setTimeout(() => { // Game starts!
    if (!playerEntity.isSpawned) return;

    playerEntity.setOpacity(1);
    enablePlayerEntityGameCollisions(playerEntity, true);
  }, 3500);
}

function endGame(playerEntity: DefaultPlayerEntity) {
  const startTime = PLAYER_GAME_START_TIME.get(playerEntity.player) ?? Date.now();
  const scoreTime = Date.now() - startTime;
  const lastTopScoreTime = PLAYER_TOP_SCORES.get(playerEntity.player) ?? 0;

  if (scoreTime > lastTopScoreTime) {
    PLAYER_TOP_SCORES.set(playerEntity.player, scoreTime);
  }

  playerEntity.player.ui.sendData({
    type: 'game-end',
    scoreTime,
    lastTopScoreTime,
  });

  // Reset player to lobby area
  playerEntity.setLinearVelocity({ x: 0, y: 0, z: 0 });
  playerEntity.setPosition(getRandomSpawnCoordinate());

  if (playerEntity.world) {
    updateTopScores();
  }
}

/**
 * Handle players joining the game.
 * We create an initial player entity they control
 * and set up their entity's collision groups to not collider
 * with other players.
 */
function onPlayerJoin(world: World, player: Player) {
  // Load the game UI for the player
  player.ui.load('ui/index.html');
  sendPlayerLeaderboardData(player);

  // Create the player entity
  const playerEntity = new DefaultPlayerEntity({
    player,
    name: 'Player',
  });

  playerEntity.on(EntityEvent.TICK, () => {
    if (playerEntity.position.y < -3 || playerEntity.position.y > 10) {
      // Assume the player has fallen off the map or shot over the wall
      endGame(playerEntity);
    }
  });

  // Spawn with a random X coordinate to spread players out a bit.
  playerEntity.spawn(world, getRandomSpawnCoordinate());
  (playerEntity.controller as DefaultPlayerEntityController).canSwim = () => false;
}

/**
 * Despawn the player's entity and perform any other
 * cleanup when they leave the game. 
 */
function onPlayerLeave(world: World, player: Player) {
  world.entityManager.getPlayerEntitiesByPlayer(player).forEach(entity => {
    endGame(entity); // explicitly end their game if they leave
    entity.despawn(); // despawn their entity
  });
}

/**
 * Set collision groups for in the game.
 * Enabled determines if we hit moving blocks, we can set this to false
 * to give players a bit of time to setup before the game starts.
 * We also con't collide with other players.
 * Collision groups work on if both contacted colliders belong to a group the other collides with.
 */
function enablePlayerEntityGameCollisions(playerEntity: DefaultPlayerEntity, enabled: boolean) {
  playerEntity.colliders.forEach(collider => {
    collider.setCollisionGroups({
      belongsTo: [ CollisionGroup.ENTITY, CollisionGroup.PLAYER ],
      collidesWith: enabled ? 
        [ CollisionGroup.BLOCK, CollisionGroup.ENTITY_SENSOR, GAME_BLOCK_COLLISION_GROUP ] : 
        [ CollisionGroup.BLOCK, CollisionGroup.ENTITY_SENSOR ],
    });
  });
}

function getRandomSpawnCoordinate() {
  const randomX = Math.floor(Math.random() * 15) - 6;

  return { x: randomX, y: 10, z: 22 };
}

function updateTopScores() {
  const topScores = Array.from(PLAYER_TOP_SCORES.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([ player, score ]) => ({ player, score }));

  // Get the top 10 highest scores
  const updatedTopScores = topScores.slice(0, 10).map(({ player, score }) => ({ name: player.username, score }));

  // Convert both arrays to strings for comparison
  const currentScoresStr = JSON.stringify(GAME_TOP_SCORES);
  const updatedScoresStr = JSON.stringify(updatedTopScores);

  // Only update if scores have changed
  if (currentScoresStr !== updatedScoresStr) {
    GAME_TOP_SCORES = updatedTopScores;
  }

  GameServer.instance.playerManager.getConnectedPlayers().forEach(sendPlayerLeaderboardData);
}

function sendPlayerLeaderboardData(player: Player) {
  player.ui.sendData({
    type: 'leaderboard',
    scores: GAME_TOP_SCORES,
  });
}
