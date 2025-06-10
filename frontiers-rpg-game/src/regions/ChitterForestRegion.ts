import GameRegion from '../GameRegion';
import chitterForestMap from '../../assets/maps/chitter-forest.json';

export default class StalkhavenRegion extends GameRegion {
  public constructor() {
    super({
      name: 'Chitter Forest',
      map: chitterForestMap,
      skyboxUri: 'skyboxes/partly-cloudy',
      spawnPoint: { x: -7, y: 5, z: 75 },
    });
  }

  protected override setup(): void {
    super.setup();
  }
}