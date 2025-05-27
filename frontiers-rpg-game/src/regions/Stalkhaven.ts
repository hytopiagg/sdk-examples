import GameRegion from '../GameRegion';
import stalkhavenMap from '../../assets/maps/stalkhaven.json';

export default class Stalkhaven extends GameRegion {
  public constructor() {
    super({
      name: 'Stalkhaven',
      map: stalkhavenMap,
      skyboxUri: 'skyboxes/partly-cloudy',
      spawnPoint: { x: 1, y: 5, z: 40 },
    });
  }
}