import { ColliderShape, RigidBodyType } from 'hytopia';
import BaseEntity, { BaseEntityOptions } from '../BaseEntity';

export default class WoolranEntity extends BaseEntity {
  public constructor(options?: BaseEntityOptions) {
    super({
      idleAnimations: [ 'idle' ],
      modelUri: 'models/mounts/woolran.gltf',
      modelScale: 0.75,
      moveAnimations: [ 'walk' ],
      moveAnimationSpeed: 3,
      moveSpeed: 2.5,
      name: 'Woolran',
      rigidBodyOptions: {
        type: RigidBodyType.DYNAMIC,
        colliders: [
          {
            shape: ColliderShape.BLOCK,
            halfExtents: { x: 0.75, y: 0.9, z: 1.5 },
          },
        ],
      },
      ...options,
    });
  }
}