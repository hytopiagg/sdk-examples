import {
  BaseEntityControllerEvent,
  DefaultPlayerEntity,
  DefaultPlayerEntityController,
  EventPayloads,
  Player,
  Quaternion,
} from 'hytopia';

const DODGE_IMPULSE_STRENGTH = 10;

export default class GamePlayerEntity extends DefaultPlayerEntity {

  public get playerController(): DefaultPlayerEntityController { return this.controller as DefaultPlayerEntityController; }

  public constructor(player: Player) {
    super({
      player,
      name: 'Player',
    });
    
    this._setupPlayerController();
  }

  public dodge(): void {
    this.startModelOneshotAnimations([ 'dodge-roll' ]);

    const facingDirection = this.directionFromRotation;
console.log(facingDirection);
    this.applyImpulse({
      x: facingDirection.x * this.mass * DODGE_IMPULSE_STRENGTH,
      y: facingDirection.y * this.mass * DODGE_IMPULSE_STRENGTH,
      z: facingDirection.z * this.mass * DODGE_IMPULSE_STRENGTH,
    })
  }

  private _onTickWithPlayerInput = (payload: EventPayloads[BaseEntityControllerEvent.TICK_WITH_PLAYER_INPUT]): void => {
    const { input } = payload;

    if (input.q) {
      this.dodge();
    }
  }

  private _setupPlayerController(): void {
    this.playerController.on(BaseEntityControllerEvent.TICK_WITH_PLAYER_INPUT, this._onTickWithPlayerInput);
  } 
}