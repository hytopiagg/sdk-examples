import { GameServer, PathfindingEntityController } from 'hytopia';
import type { QuaternionLike, Vector3Like, World } from 'hytopia';

import EnemyEntity from '../EnemyEntity';
import type { EnemyEntityOptions } from '../EnemyEntity';
import type GamePlayerEntity from '../GamePlayerEntity';

export default class RipperEntity extends EnemyEntity {
  public constructor(options: Partial<EnemyEntityOptions> = {}) {
    const speed = options.speed ?? 2;
    const animation = speed > 6 ? 'animation.ripper_zombie.sprint' : 'animation.ripper_zombie.walk';

    super({
      damage: options.damage ?? 6,
      damageAudioUri: options.damageAudioUri ?? 'audio/sfx/entity/zombie/zombie-hurt.mp3',
      health: options.health ?? 300,
      idleAudioUri: options.idleAudioUri ?? 'audio/sfx/ripper-idle.mp3',
      idleAudioVolume: 1,
      idleAudioReferenceDistance: 8,
      jumpHeight: options.jumpHeight ?? 2,
      preferJumping: true,
      reward: options.reward ?? 300,
      speed,
      controller: new PathfindingEntityController(),
      modelUri: 'models/npcs/ripper-boss.gltf',
      modelLoopedAnimations: [ animation ],
      modelScale: 0.5,
      rigidBodyOptions: {
        enabledRotations: { x: false, y: true, z: false },
        ccdEnabled: true,
      },
    });
  }

  public override spawn(world: World, position: Vector3Like, rotation?: QuaternionLike) {
    super.spawn(world, position, rotation);

    this._updateBossUI({
      type: 'boss',
      name: 'BOSS: RIPPER',
      health: this.health,
      maxHealth: this.maxHealth,
      show: true,
    });
  }

  public override takeDamage(damage: number, fromPlayer: GamePlayerEntity) {
    // Do the UI check first, because otherwise
    // takeDamage can trigger a despawn if health < 0
    this._updateBossUI({
      type: 'boss',
      show: this.health - damage > 0,
      healthPercent: ((this.health - damage) / this.maxHealth) * 100,
    });

    super.takeDamage(damage, fromPlayer);
  }

  private _updateBossUI(data = {}) {
    if (!this.world) {
      return;
    }

    GameServer.instance.playerManager.getConnectedPlayersByWorld(this.world).forEach(player => {
      player.ui.sendData(data);
    });
  }
}
