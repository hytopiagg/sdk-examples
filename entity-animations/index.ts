import {
  startServer,
  Entity,
  EntityModelAnimationLoopMode,
  PlayerEvent,
  ModelRegistry,
} from 'hytopia';

import worldMap from './assets/map.json' with { type: 'json' } ;

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
    for (const name of args) { const anim = animatedEntity.getModelAnimation(name); if (anim) { anim.setLoopMode(EntityModelAnimationLoopMode.LOOP); anim.play(); } }
  });

  world.chatManager.registerCommand('/oneshot', (player, args) => {
    world.chatManager.sendBroadcastMessage(`Oneshotting ${args.join(' ')}`, '00FF00');
    for (const name of args) { animatedEntity.getModelAnimation(name)?.restart(); }
  });
  
  world.chatManager.registerCommand('/stop', (player, args) => {
    world.chatManager.sendBroadcastMessage(`Stopped ${args.join(' ')}`, '00FF00');
    animatedEntity.stopModelAnimations(args);
  });
  
  world.chatManager.registerCommand('/stopall', player => {
    world.chatManager.sendBroadcastMessage(`Stopped all animations`, '00FF00');
    animatedEntity.stopAllModelAnimations();
  });
});
