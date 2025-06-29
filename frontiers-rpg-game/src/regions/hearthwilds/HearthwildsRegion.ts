import { Quaternion } from 'hytopia';
import GameRegion from '../../GameRegion';
import Spawner from '../../systems/Spawner';
import PortalEntity from '../../entities/PortalEntity';
import type { WanderOptions } from '../../entities/BaseEntity';

import hearthwildsMap from '../../../assets/maps/hearthwilds.json';

export default class HearthwildsRegion extends GameRegion {
  public constructor() {
    super({
      id: 'hearthwilds',
      name: 'Hearthwilds',
      map: hearthwildsMap,
      skyboxUri: 'skyboxes/partly-cloudy',
      spawnPoint: { x: 200, y: 15, z: -75 },
      ambientAudioUri: 'audio/music/jungle-theme-looping.mp3',
    });
  }

  protected override setup(): void {
    super.setup();

  }
}
