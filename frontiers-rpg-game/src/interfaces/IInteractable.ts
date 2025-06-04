import type GamePlayerEntity from '../GamePlayerEntity';

export default interface IInteractable {
  interact(playerEntity: GamePlayerEntity): void;
}