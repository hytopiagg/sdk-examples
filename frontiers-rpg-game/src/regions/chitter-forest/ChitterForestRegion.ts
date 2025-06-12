import GameRegion from '../../GameRegion';
import RatkinBruteEntity from '../../entities/enemies/RatkinBruteEntity';
import RatkinWarriorEntity from '../../entities/enemies/RatkinWarriorEntity';
import Spawner from '../../systems/Spawner';
import PortalEntity from '../../entities/PortalEntity';

import chitterForestMap from '../../../assets/maps/chitter-forest.json';

export default class ChitterForestRegion extends GameRegion {
  public constructor() {
    super({
      name: 'Chitter Forest',
      map: chitterForestMap,
      skyboxUri: 'skyboxes/partly-cloudy',
      spawnPoint: { x: -7, y: 2, z: 75 },
      ambientAudioUri: 'audio/music/jungle-theme-looping.mp3',
      tag: 'chitterForest',
    });
  }

  protected override setup(): void {
    super.setup();

    const spawner = new Spawner({
      maxSpawns: 20,
      respawnDelayRangeMs: [ 1000, 2000 ],
      spawnableEntities: [
        { entity: RatkinBruteEntity, probability: 0.3 },
        { entity: RatkinWarriorEntity, probability: 0.7 },
      ],
      spawnBounds: { min: { x: -50, y: 10, z: -45 }, max: { x: 36, y: 10, z: 26 } },
      spawnIntervalMs: 1000,
      world: this.world,
    });

    spawner.start(true);

    const testRatkin = new RatkinBruteEntity();
    testRatkin.spawn(this.world, { x: 2, y: 3, z: 63 });

    const stalkhavenPortal = new PortalEntity({
      destinationRegionTag: 'stalkhaven',
      destinationRegionPosition: { x: 1, y: 2, z: 40 },
      modelScale: 2,
    });

    stalkhavenPortal.spawn(this.world, { x: -7, y: 3.5, z: 80.2 });
  }
}
