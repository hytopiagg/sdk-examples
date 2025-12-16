import {
  startServer,
  Entity,
  EntityEvent,
  DefaultPlayerEntity,
  Player,
  PlayerEvent,
  World,
} from 'hytopia';

import worldMap from './assets/map.json' with { type: 'json' } ;

/**
 * This example demonstrates the interaction system in HYTOPIA.
 * Interactions are the preferred way of creating behaviors when
 * a player clicks/taps on an entity or block. They automatically
 * work on both mobile and desktop without requiring you to handle logic
 * per device type. 
 * 
 * The Interact APIs are used through a simple event system. You can use the
 * EntityEvent.INTERACT or BlockTypeEvent.INTERACT to listen for player interactions.
 * Additionally you can have events on the player instance for interact events regardless
 * of if they register an interact for an entity or block using PlayerEvent.INTERACT.
 * 
 * Below you'll see some example behaviors for interacting in different ways.
 * 
 * Notes about interacts: 
 *   - Interactions are fully compatible with all camera modes and configurations, first person, third person, and spectator, etc.
 *
 *   - On mobile, if a user taps the screen and their finger lands on an entity or block
 *     that's interactable, or if it doesn't land on a clickable UI element, the PlayerEvent.INTERACT
 *     will always emit, and the EntityEvent.INTERACT or BlockTypeEvent.INTERACT will also emit if a block
 *     or entity is determined to have been interacted with by the internally handled raycast.
 * 
 *   - On desktop, if a user's pointer is unlocked, the interaction location is wherever they click on the 
 *     screen. If the pointer is locked, the interaction location will always be the center-most point of 
 *     the screen.
 * 
 *   - You can visualize the interact raycasts in development by calling world.simulation.enableDebugRaycasting(true);
 */

startServer(world => {
  world.loadMap(worldMap);
  world.simulation.enableDebugRaycasting(true);

  spawnInteractableBear(world);
  
  // Spawn a player entity when a player joins the game.
  world.on(PlayerEvent.JOINED_WORLD, ({ player }) => {
    // Load a simple crosshair on the screen, not required for interactions
    // but visually nice to see.
    player.ui.load('ui/index.html');


    // We can set the raycast distance for a player's interactions, allowing us to cap
    // how far their interactions potentially reach. You can see the distance from the
    // debug raycast line's length in the game client.
    player.setMaxInteractDistance(10);  // Default is 20 blocks, we'll set a distance of 10 blocks.

    setupPlayerBlockBreaking(player);

    const playerEntity = new DefaultPlayerEntity({
      player,
      name: 'Player',
      cosmeticHiddenSlots: [ 'ALL' ],
    });
  
    playerEntity.spawn(world, { x: 0, y: 10, z: 0 });
  });

  world.on(PlayerEvent.LEFT_WORLD, ({ player }) => {
    world.entityManager.getPlayerEntitiesByPlayer(player).forEach(entity => entity.despawn());
  });
});

// Entity interact example
function spawnInteractableBear(world: World) {
  const interactableBear = new Entity({
    modelUri: 'models/npcs/bear.gltf',
  });

  // We use the EntityEvent.INTERACT event on this specific entity. If a player interacts with the bear,
  // the callback with the player and the raycast hit result is included.
  interactableBear.on(EntityEvent.INTERACT, ({ player, raycastHit }) => {
    console.log('Interacted with bear, camera origin raycast from', raycastHit?.origin, raycastHit?.originDirection);
    console.log('Raycast collision at point', raycastHit?.hitPoint);

    // Make the bear jump and spin when interacted with!
    interactableBear.applyImpulse({ x: 0, y: 10 * interactableBear.mass, z: 0 });
    interactableBear.applyTorqueImpulse({ x: 0, y: 10 * interactableBear.mass, z: 0 });
  });

  interactableBear.spawn(world, { x: 3, y: 5, z: -3 });
}

// Player interact example, anytime an interact happens
// regardless of if it hits a block or entity, the PlayerEvent.INTERACT event will emit.
function setupPlayerBlockBreaking(player: Player) {
  player.on(PlayerEvent.INTERACT, ({ player, raycastHit }) => {
    if (!player.world) return; // If the player for some reason isn't in a world, this shouldn't happen so it's more a type gaurd.
    console.log('Hit a block?', !!raycastHit?.hitBlock);
    console.log('Hit an entity?', !!raycastHit?.hitEntity);

    if (!raycastHit?.hitBlock) return; // we only care about block hits

    const neighborCoordiante = raycastHit.hitBlock.getNeighborGlobalCoordinateFromHitPoint(raycastHit.hitPoint);
    
    // Set a block on the coordinate next to the neighboring face of the global coordinate we hit.
    player.world.chunkLattice.setBlock(neighborCoordiante, 1); // 1 is bricks in our map.json
  });
}