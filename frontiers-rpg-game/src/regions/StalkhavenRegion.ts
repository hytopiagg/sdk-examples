import { Quaternion } from 'hytopia';

import GameRegion from '../GameRegion';
import stalkhavenMap from '../../assets/maps/stalkhaven.json';

import AdventurerEntity from '../entities/npcs/AdventurerEntity';
import BankerEntity from '../entities/npcs/BankerEntity';
import BlacksmithEntity from '../entities/npcs/BlacksmithEntity';
import FarmerEntity from '../entities/npcs/FarmerEntity';
import MerchantEntity from '../entities/npcs/MerchantEntity';
import CapfolkVillagerEntity from '../entities/npcs/CapfolkVillagerEntity';
import CapfolkElderEntity from '../entities/npcs/CapfolkElderEntity';
import CapfolkKnightEntity from '../entities/npcs/CapfolkKnightEntity';

import RatkinWarriorEntity from '../entities/enemies/RatkinWarriorEntity';

export default class StalkhavenRegion extends GameRegion {
  public constructor() {
    super({
      name: 'Stalkhaven',
      map: stalkhavenMap,
      skyboxUri: 'skyboxes/partly-cloudy',
      spawnPoint: { x: 1, y: 5, z: 40 },
    });
  }

  protected override _setup(): void {
    super._setup();
    
    // for (let i = 0; i < 10; i++) {
      const x = Math.random() * 40 - 20; // Random between -20 and 20
      const z = Math.random() * 40 - 20; // Random between -20 and 20
      const facingAngle = Math.random() * 360; // Random facing angle
      
      const ratkin = new RatkinWarriorEntity({ facingAngle });
      ratkin.setCcdEnabled(true);
      ratkin.spawn(this.world, { x, y: 10, z });
    // }
    


    // (new AdventurerEntity({ facingAngle: 90 })).spawn(this.world, { x: 30, y: 2, z: 22 });
    // (new BankerEntity({ facingAngle: 90 })).spawn(this.world, { x: 12, y: 3, z: 41 });
    // (new BlacksmithEntity({ facingAngle: -120 })).spawn(this.world, { x: -25.5, y: 3, z: -12.5 });
    // (new CapfolkElderEntity({ facingAngle: 180 })).spawn(this.world, { x: -13.5, y: 2, z: -30 });
    // (new FarmerEntity({ facingAngle: -90 })).spawn(this.world, { x: -32, y: 3, z: 1 });
    // (new MerchantEntity({ facingAngle: 90 })).spawn(this.world, { x: 13, y: 3, z: 26.5 });

    // (new CapfolkVillagerEntity({ facingAngle: -30 })).spawn(this.world, { x: -1.5, y: 2, z: 45.5 });
    // (new CapfolkVillagerEntity({ facingAngle: 15 })).spawn(this.world, { x: 3, y: 2, z: 45.5 });
    // (new CapfolkKnightEntity({ modelScale: 0.7 })).spawn(this.world, { x: 0.75, y: 2, z: 45 });


    // const wonderDestinations = [
    //   { x: -16.5, y: 1.5, z: -30 },   // church 1
    //   { x: -12.5, y: 1.5, z: -27 },   // church 2
    //   { x: -14,   y: 1.5, z: -24 },   // church 3  
    //   { x: -27,   y: 1.5, z: -22.5 }, // cemetary 1
    //   { x: -22,   y: 1.5, z: -12 },   // blacksmith
    //   { x: -11, y: 1.5, z: -12.5 },  // town square 1
    //   { x: 2, y: 1.5, z: -10.5 },  // town square 2
    //   { x: 12.5, y: 1.5, z: 3 },  // town square 3
    //   { x: -10, y: 1.5, z: -15 },  // town square 4
    //   { x: 10.5, y: 1.5, z: 26.5 },  // merchant
    //   { x: 9, y: 1.5, z: 41 },  // banker
    //   { x: 22, y: 1.5, z: 41 },  // well 1
    //   { x: 30, y: 1.5, z: 42 },  // well 2
    //   { x: 28, y: 1.5, z: 36 },  // well 3
    //   { x: 32, y: 1.5, z: 40 },  // well 4
    //   { x: 28, y: 1.5, z: 25 },  // inn 1
    //   { x: 29, y: 1.5, z: 18.5 },  // inn 2
    //   { x: 26, y: 1.5, z: 16.5 },  // inn 3
    //   { x: 22, y: 1.5, z: 9.5 },  // inn garden
    //   { x: 28, y: 1.5, z: -6 },  // market 1
    //   { x: 27, y: 1.5, z: -20 },  // market 2
    //   { x: 29.5, y: 1.5, z: -29 },  // market 3
    //   { x: 28, y: 1.5, z: -32 },  // market 3
    //   { x: 16, y: 1.5, z: -25 },  // market 4
    //   { x: 17, y: 1.5, z: -15 },  // market 5
    // ];

    // for (let i = 0; i < 20; i++) {
    //   const spawnPoint = wonderDestinations[Math.floor(Math.random() * wonderDestinations.length)];
    //   const villager = new CapfolkVillagerEntity();
    //   villager.spawn(this.world, spawnPoint);
    //   setTimeout(() => {
    //     villager.wander(wonderDestinations, 1 + Math.random() * 3);
    //   }, 5000);
    // }
  }
}