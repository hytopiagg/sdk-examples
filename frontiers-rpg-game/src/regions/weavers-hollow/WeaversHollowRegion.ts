import GameRegion from '../../GameRegion';
import Spawner from '../../systems/Spawner';
import PortalEntity from '../../entities/PortalEntity';
import type { WanderOptions } from '../../entities/BaseEntity';

import weaversHollowMap from '../../../assets/maps/weavers-hollow.json';

import SpiderWebEntity from '../../entities/environmental/SpiderWebEntity';

export default class WeaversHollowRegion extends GameRegion {
  public constructor() {
    super({
      id: 'weavers-hollow',
      name: `Weaver's Hollow`,
      map: weaversHollowMap,
      maxAmbientLightIntensity: 0.075,
      maxDirectionalLightIntensity: 0.4,
      minAmbientLightIntensity: 0.055,
      minDirectionalLightIntensity: 0.2,
      skyboxUri: 'skyboxes/black',
      spawnPoint: { x: 10, y: 2, z: 13 },
      ambientAudioUri: 'audio/music/cave-theme-looping.mp3',
    });
  }

  protected override setup(): void {
    super.setup();

    this._setupEnemySpawners();
    this._setupPortals();
  }

  private _setupEnemySpawners(): void {
    const spiderWeb = new SpiderWebEntity();
    spiderWeb.spawn(this.world, { x: 6, y: 5, z: 8 });
  }

  private _setupPortals(): void {
    
  }
}
