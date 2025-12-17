import {
  startServer,
  DefaultPlayerEntity,
  PlayerEvent,
  Player,
} from 'hytopia';

import worldMap from './assets/map.json' with { type: 'json' } ;

startServer(world => {  
  world.loadMap(worldMap);

  // Handle player join
  world.on(PlayerEvent.JOINED_WORLD, ({ player }) => {
    const playerEntity = new DefaultPlayerEntity({
      player,
      name: 'Player',
    });
  
    playerEntity.spawn(world, { x: 0, y: 10, z: 0 });
  
    setTimeout(async () => {
      await player.scheduleNotification('GIFT', Date.now() + 60 * 1000); // Schedule for 2 minutes from now. 120s * 1000ms = 2 minutes in ms
    });

    world.chatManager.sendPlayerMessage(player, 'Schedule a notification for 1 minute from now by entering /schedule [type] [secondsFromNow]');
    world.chatManager.sendPlayerMessage(player, 'Unschedule a notification by entering /unschedule [notificationId]');
  });

  // Handle player leave
  world.on(PlayerEvent.LEFT_WORLD, ({ player }) => {
    world.entityManager.getPlayerEntitiesByPlayer(player).forEach(entity => entity.despawn());
  });

  world.chatManager.registerCommand('/schedule', async (player, args) => {
    const types = args[0] || 'GIFT';
    const secondsFromNow = parseInt(args[1] || '60');
    const notificationId = await player.scheduleNotification(types, Date.now() + secondsFromNow * 1000);

    if (notificationId) {
      world.chatManager.sendPlayerMessage(player, `Scheduled notification for ${types} in ${secondsFromNow} seconds. Notification ID: ${notificationId}`);
    }
  });

  world.chatManager.registerCommand('/unschedule', async (player, args) => {
    const notificationId = args[0];
    const success = await player.unscheduleNotification(notificationId);
    world.chatManager.sendPlayerMessage(player, `Unscheduled notification ${notificationId}: ${success}`);
  });
});
