import {
  startServer,
  DefaultPlayerEntity,
  PlayerEvent,
  Player,
  PersistenceManager,
} from 'hytopia';

import worldMap from './assets/map.json';

startServer(world => {  
  world.loadMap(worldMap);

  // Handle player join
  world.on(PlayerEvent.JOINED_WORLD, ({ player }) => {
    const playerEntity = new DefaultPlayerEntity({
      player,
      name: 'Player',
    });
  
    playerEntity.spawn(world, { x: 0, y: 10, z: 0 });

    help(player);
  });

  // Handle player leave
  world.on(PlayerEvent.LEFT_WORLD, ({ player }) => {
    world.entityManager.getPlayerEntitiesByPlayer(player).forEach(entity => entity.despawn());
  });

  // Command definitions with help text
  type Command = {
    command: string;
    description: string;
    args?: string;
    handler: (player: Player, args: string[]) => void;
  };

  const commands: Record<string, Command> = {
    help: {
      command: '/help',
      description: 'Shows all available commands',
      handler: (player: Player) => help(player),
    },
    whoami: {
      command: '/whoami',
      description: 'Shows your username and ID',
      handler: (player: Player) => {
        sendMessage(player, `You are ${player.username} | Your ID is ${player.id}`);
      }
    },
    setPlayerKeyValue: {
      command: '/setplayerkeyvalue',
      description: 'Sets a player state key with a string value',
      args: '<key> <value>',
      handler: (player: Player, args: string[]) => {
        const [key, ...value] = args;
        if (!key || value.length === 0) return sendMessage(player, 'Usage: /setplayerkeyvalue <key> <value>', 'FF0000');
        
        player.setPersistedData({ [key]: value.join(' ') });
        sendMessage(player, `Set player state: ${key} = ${value.join(' ')}`);
      }
    },
    setPlayerKeyJson: {
      command: '/setplayerkeyjson',
      description: 'Sets a player state key with a JSON value',
      args: '<key> <json>',
      handler: (player: Player, args: string[]) => {
        const [key, ...value] = args;
        if (!key || value.length === 0) return sendMessage(player, 'Usage: /setplayerkeyjson <key> <json>', 'FF0000');
        
        try {
          const jsonValue = JSON.parse(value.join(' '));
          player.setPersistedData({ [key]: jsonValue });
          sendMessage(player, `Set player state: ${key} = ${JSON.stringify(jsonValue)}`);
        } catch (e) {
          sendMessage(player, 'Invalid JSON value', 'FF0000');
        }
      }
    },
    getPlayerState: {
      command: '/getplayerstate',
      description: 'Gets all player state',
      handler: async (player: Player) => {
        const value = await player.getPersistedData();
        sendMessage(player, `Player state: ${JSON.stringify(value, null, 2)}`);
      }
    },
    deletePlayerKey: {
      command: '/deleteplayerkey',
      description: 'Deletes a player state key',
      args: '<key>',
      handler: (player: Player, args: string[]) => {
        const [key] = args;
        if (!key) return sendMessage(player, 'Usage: /deleteplayerkey <key>', 'FF0000');

        player.setPersistedData({ [key]: undefined });
        sendMessage(player, `Deleted player state key: ${key}`);
      }
    }
  };

  // Helper function for sending messages
  function sendMessage(player: Player, message: string, color = '00FF00') {
    world.chatManager.sendPlayerMessage(player, message, color);
  }

  // Register all commands
  Object.values(commands).forEach(({ command, handler }) => {
    world.chatManager.registerCommand(command, handler);
  });

  // Help command implementation
  function help(player: Player) {
    sendMessage(player, '=== Available Commands ===');
    Object.values(commands).forEach(cmd => {
      const usage = cmd.args ? `${cmd.command} ${cmd.args}` : cmd.command;
      sendMessage(player, `${usage}`);
      sendMessage(player, `  ${cmd.description}`);
      sendMessage(player, '---');
    });
  }
});
