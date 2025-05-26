import {
  startServer,
  Entity,
  PlayerEvent,
  ModelRegistry,
} from 'hytopia';

import worldMap from './assets/map.json';

/**
 * This is a simple example used to visualize and debug animations.
 * In this example, there is no player control, it simply gives a rotatable
 * camera view around the spawned animated entity and allows slash (/) commands
 * to be used to control the animation playback for visualization.
 */

startServer(world => {
  world.loadMap(worldMap);

  const animatedEntity = new Entity({
    name: 'Entity',
    modelUri: 'models/players/player.gltf', // Change the model here for testing different models
    modelScale: 0.5, // Change the scale here relative to your neeeds.
  })

  animatedEntity.spawn(world, { x: 0, y: 10, z: 0 });


  world.on(PlayerEvent.JOINED_WORLD, ({ player }) => {
    // focus the camera on the animated entity.
    player.camera.setAttachedToEntity(animatedEntity);

    world.chatManager.sendPlayerMessage(player, 'Commands:');
    world.chatManager.sendPlayerMessage(player, '/list - Show animations');
    world.chatManager.sendPlayerMessage(player, '/loop <name> - Start looped animation');
    world.chatManager.sendPlayerMessage(player, '/oneshot <name> - Start one-shot animation');
    world.chatManager.sendPlayerMessage(player, '/stop <name> - Stop animation');
    world.chatManager.sendPlayerMessage(player, '/stopall - Stop all animations');
  });

  world.on(PlayerEvent.LEFT_WORLD, ({ player }) => {
    // Nothing to do, since we aren't spawning any player specific entities, etc.
  });

  world.chatManager.registerCommand('/list', player => {
    const animationNames = ModelRegistry.instance.getAnimationNames(animatedEntity.modelUri!).join(', ');

    world.chatManager.sendPlayerMessage(player, `Available animations: ${animationNames}`);
  });

  world.chatManager.registerCommand('/loop', (player, args) => {
    world.chatManager.sendBroadcastMessage(`Looping ${args.join(' ')}`, '00FF00');
    animatedEntity.startModelLoopedAnimations(args);
  });

  world.chatManager.registerCommand('/oneshot', (player, args) => {
    world.chatManager.sendBroadcastMessage(`Oneshotting ${args.join(' ')}`, '00FF00');
    animatedEntity.startModelOneshotAnimations(args);
  });
  
  world.chatManager.registerCommand('/stop', (player, args) => {
    world.chatManager.sendBroadcastMessage(`Stopped ${args.join(' ')}`, '00FF00');
    animatedEntity.stopModelAnimations(args);
  });
  
  world.chatManager.registerCommand('/stopall', player => {
    world.chatManager.sendBroadcastMessage(`Stopped all animations`, '00FF00');
    const animationNames = ModelRegistry.instance.getAnimationNames(animatedEntity.modelUri!)

    animatedEntity.stopModelAnimations(animationNames);
  });
});
