import {
  Entity,
} from 'hytopia';

import GamePlayerEntity from './GamePlayerEntity';

export default abstract class InteractableEntity extends Entity {
  public abstract interact(interactingPlayer: GamePlayerEntity): void;
}