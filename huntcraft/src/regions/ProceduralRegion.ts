import { ColliderShape, ErrorHandler, Quaternion } from 'hytopia';
import type { WorldMap, Vector3Like, BlockTypeOptions } from 'hytopia'

const SECTION_JOINT_BLOCK_NAME = 'diamond-block';

export enum BlockRotation {
  ZERO_DEGREES = 0,
  NINETY_DEGREES = 90,
  ONE_EIGHTY_DEGREES = 180,
  TWO_SEVENTY_DEGREES = 270,
}

export enum JointOrientation {
  UP = 'up', // -Z
  DOWN = 'down', // +Z
  LEFT = 'left', // -X
  RIGHT = 'right', // +X
}

export type Joint = {
  coordinate: Vector3Like;
  orientation: JointOrientation;
}

export type LoadableProceduralRegionSection = {
  id: string;
  map: WorldMap;
  maxSpawns?: number;
  weight: number;
};

export type ProceduralRegionOptions = {
  liquidBlockNames: string[];
  loadableSections: LoadableProceduralRegionSection[];
  ignoreColliderForModelNames: string[];
};

export type ProceduralRegionSection = {
  id: string;
  blockTypes: BlockTypeOptions[];
  blocks: NonNullable<WorldMap['blocks']>;
  entities: WorldMap['entities'];
  localJoints: Joint[];
  maxSpawns?: number;
  weight: number;
};

export default class ProceduralRegion {
  private _consolidatedBlockTypes: BlockTypeOptions[];
  private _ignoreColliderForModelNames: string[];
  private _liquidBlockNames: string[];
  private _sections: ProceduralRegionSection[];
  
  public constructor(options: ProceduralRegionOptions) {
    this._ignoreColliderForModelNames = options.ignoreColliderForModelNames;
    this._liquidBlockNames = options.liquidBlockNames;
    this._load(options.loadableSections);
  }

  public generateMap(maxExpansionSections: number = 10): WorldMap {
    const startSection = this._selectDeadEndSection();

    const map: WorldMap = {
      blocks: Object.assign({}, startSection.blocks),
      blockTypes: this._consolidatedBlockTypes,
      entities: Object.assign({}, startSection.entities || {}),
    };

    const jointBlockId = this._consolidatedBlockTypes.find(b => b.name === SECTION_JOINT_BLOCK_NAME)?.id;

    // Helpers for rotation and orientation math
    const toIndex = (o: JointOrientation) => (
      o === JointOrientation.UP ? 0 :
      o === JointOrientation.RIGHT ? 1 :
      o === JointOrientation.DOWN ? 2 : 3
    );
    
    const fromIndex = (i: number): JointOrientation => (
      i === 0 ? JointOrientation.UP :
      i === 1 ? JointOrientation.RIGHT :
      i === 2 ? JointOrientation.DOWN : JointOrientation.LEFT
    );
    
    const opposite = (o: JointOrientation) => fromIndex((toIndex(o) + 2) % 4);
    
    const rotatePoint = (x: number, z: number, steps: number) => {
      const s = ((steps % 4) + 4) % 4;
      if (s === 0) return { x, z };
      if (s === 1) return { x: -z, z: x };  // 90 CW
      if (s === 2) return { x: -x, z: -z }; // 180
      return { x: z, z: -x };               // 270 CW
    };

    const rotateOrientation = (o: JointOrientation, steps: number) => fromIndex((toIndex(o) + steps + 4) % 4);

    // Queue of open world joints to attach to
    const pendingWorldJoints: Joint[] = startSection.localJoints.map(j => ({ coordinate: { ...j.coordinate }, orientation: j.orientation }));
    const worldBlocks = map.blocks as NonNullable<WorldMap['blocks']>;
    const occupiedXZCounts = new Map<string, number>();
    for (const k in worldBlocks) {
      const [x, , z] = k.split(',');
      const xz = `${x},${z}`;
      occupiedXZCounts.set(xz, (occupiedXZCounts.get(xz) || 0) + 1);
    }
    let processed = 0;

    while (pendingWorldJoints.length > 0) {
      const parentJoint = pendingWorldJoints.shift();
      if (!parentJoint) break;

      processed += 1;
      let placed = false;
      let attempts = 0;
      while (!placed && attempts < 5) {
        attempts += 1;
        const nextSection = processed > maxExpansionSections ? this._selectDeadEndSection() : this._selectConnectableSection();
        const nextJointIndex = Math.floor(Math.random() * nextSection.localJoints.length);
        const nextJoint = nextSection.localJoints[nextJointIndex];

        // Determine rotation to face parent joint, then shift to align
        const facing = opposite(parentJoint.orientation);
        const steps = (toIndex(facing) - toIndex(nextJoint.orientation) + 4) % 4;

        const rotatedNextJoint = rotatePoint(nextJoint.coordinate.x, nextJoint.coordinate.z, steps);
        let shiftX = parentJoint.coordinate.x - rotatedNextJoint.x;
        const shiftY = parentJoint.coordinate.y - nextJoint.coordinate.y;
        let shiftZ = parentJoint.coordinate.z - rotatedNextJoint.z;

        // Additional unit shift to butt sections (move next section one block toward parent)
        if (facing === JointOrientation.UP) shiftZ -= 1;         // -Z
        else if (facing === JointOrientation.DOWN) shiftZ += 1;  // +Z
        else if (facing === JointOrientation.LEFT) shiftX -= 1;  // -X
        else if (facing === JointOrientation.RIGHT) shiftX += 1; // +X

        // Prepare transformed block keys and count overlaps; allow at most 1
        const nextJointKey = `${nextJoint.coordinate.x},${nextJoint.coordinate.y},${nextJoint.coordinate.z}`;
        const transformedPairs: Array<{ key: string; id: number }> = [];
        const parentXZKey = `${parentJoint.coordinate.x},${parentJoint.coordinate.z}`;
        let overlapsAtParentXZ = 0;
        let overlapsElsewhere = 0;
        for (const coordinate in nextSection.blocks) {
          if (coordinate === nextJointKey) continue; // skip processed joint diamond
          const blockId = nextSection.blocks[coordinate];
          const [x, y, z] = coordinate.split(',').map(Number);
          const r = rotatePoint(x, z, steps);
          const key = `${r.x + shiftX},${y + shiftY},${r.z + shiftZ}`;
          const xz = `${r.x + shiftX},${r.z + shiftZ}`;
          if ((occupiedXZCounts.get(xz) || 0) > 0) {
            if (xz === parentXZKey) overlapsAtParentXZ += 1; else overlapsElsewhere += 1;
          }
          transformedPairs.push({ key, id: blockId });
        }

        if (overlapsElsewhere > 0 || overlapsAtParentXZ > 1) {
          continue; // try a different candidate; only allow overlap at the parent joint
        }

        // Remove the parent joint diamond block to create a clean connection
        if (jointBlockId !== undefined) {
          const parentKeyDel = `${parentJoint.coordinate.x},${parentJoint.coordinate.y},${parentJoint.coordinate.z}`;
          if ((worldBlocks as any)[parentKeyDel] === jointBlockId) {
            delete (worldBlocks as any)[parentKeyDel];
            const xz = `${parentJoint.coordinate.x},${parentJoint.coordinate.z}`;
            const cnt = (occupiedXZCounts.get(xz) || 1) - 1;
            if (cnt > 0) occupiedXZCounts.set(xz, cnt); else occupiedXZCounts.delete(xz);
          }
        }

        // Merge rotated+shifted blocks
        for (let i = 0; i < transformedPairs.length; i++) {
          const { key, id } = transformedPairs[i];
          if (worldBlocks[key] === undefined) {
            worldBlocks[key] = id;
            const [x, , z] = key.split(',');
            const xz = `${x},${z}`;
            occupiedXZCounts.set(xz, (occupiedXZCounts.get(xz) || 0) + 1);
          }
        }

        // Merge rotated+shifted entities
        if (nextSection.entities) {
          const worldEntities = map.entities as NonNullable<WorldMap['entities']>;
          for (const position in nextSection.entities) {
            const entityOptions = nextSection.entities[position] as any;
            const [ex, ey, ez] = position.split(',').map(Number);
            const er = rotatePoint(ex, ez, steps);
            const worldPos = `${er.x + shiftX},${ey + shiftY},${er.z + shiftZ}`;
            worldEntities[worldPos] = entityOptions;

            const entity = worldEntities[worldPos] as any;
            const rotation = entity?.rigidBodyOptions?.rotation;
            
            if (rotation && steps !== 0) {
              const rotationQuat = Quaternion.fromQuaternionLike(rotation);
              rotationQuat.rotateY(steps * 90);
              entity.rigidBodyOptions.rotation = rotationQuat as any;
            }

            if (this._ignoreColliderForModelNames.includes(entity.name)) {
              entity.modelPreferredShape = ColliderShape.NONE;
            }
          }
        }

        // Enqueue other joints from next section in world space
        for (const local of nextSection.localJoints) {
          if (local === nextJoint) continue;
          const r = rotatePoint(local.coordinate.x, local.coordinate.z, steps);
          const worldCoord = { x: r.x + shiftX, y: local.coordinate.y + shiftY, z: r.z + shiftZ };
          const worldOrientation = rotateOrientation(local.orientation, steps);
          pendingWorldJoints.push({ coordinate: worldCoord, orientation: worldOrientation });
        }

        placed = true;
      }
    }

    // Process Entities
    for (const entity of Object.values(map.entities as Record<string, any>)) {
      if (!entity.name) continue;

      if (this._ignoreColliderForModelNames.includes(entity.name)) {
        entity.modelPreferredShape = ColliderShape.NONE;
      }
    }

    return map;
  }

  private _load(loadableSections: LoadableProceduralRegionSection[]): void {
    const consolidatedByName = new Map<string, BlockTypeOptions>();
    const sections: ProceduralRegionSection[] = [];
    let nextConsolidatedBlockTypeId = 1;

    for (const loadableSection of loadableSections) {
      const { id, map, weight } = loadableSection;
      const { blockTypes, blocks, entities } = map;

      if (!blockTypes || !blocks) {
        ErrorHandler.warning(`ProceduralRegion._load(): Section ${id} has no block types or blocks, excluding from generation.`);
        continue;
      }

      // Consolidate block types by name across sections with sequential ids starting at 1
      for (const blockType of blockTypes) {
        if (!consolidatedByName.has(blockType.name)) {
          if (this._liquidBlockNames.includes(blockType.name)) {
            blockType.isLiquid = true;
          }

          const consolidated: BlockTypeOptions = { ...blockType, id: nextConsolidatedBlockTypeId };
          consolidatedByName.set(blockType.name, consolidated);
          nextConsolidatedBlockTypeId += 1;
        }
      }

      // Find the joints
      const localJoints = this._calculateLocalJoints(blockTypes, blocks);

      if (localJoints.length === 0) {
        ErrorHandler.warning(`ProceduralRegion._load(): Section ${id} has no local joints, excluding from generation.`);
        continue;
      }

      sections.push({
        id,
        blockTypes,
        blocks,
        entities,
        localJoints,
        weight,
      });
    }

    // Remap the block ids to the consolidated block types
    this._consolidatedBlockTypes = Array.from(consolidatedByName.values());

    for (const section of sections) {
      const sectionRemappedBlockIds: Record<number, number> = {};

      // Generate the remapped block ids for fast lookups and conversion
      for (const blockType of section.blockTypes) {
        const consolidatedBlockType = consolidatedByName.get(blockType.name);

        if (!consolidatedBlockType) {
          ErrorHandler.warning(`ProceduralRegion._load(): Section ${section.id} has a block type ${blockType.name} that is not in the consolidated block types, excluding from generation.`);
          continue;
        }

        sectionRemappedBlockIds[blockType.id] = consolidatedBlockType.id;
      }

      // Remap the block ids in the section to match the consolidated block types
      for (const coordinate of Object.keys(section.blocks)) {
        const originalId = section.blocks[coordinate];
        const remappedId = sectionRemappedBlockIds[originalId];
        
        if (!remappedId) {
          ErrorHandler.warning(`ProceduralRegion._load(): Section ${section.id} has block id ${originalId} without a consolidated mapping.`);
          continue;
        } 

        section.blocks[coordinate] = remappedId;
      }
    }

    // Store the sections
    this._sections = sections;
  }

  /**
   * This finds the local joints within a section that are used to connect
   * to other sections. The joints are returned as an array of coordinates that
   * are local to the section itself.
   */
  private _calculateLocalJoints(blockTypes: BlockTypeOptions[], blocks: Record<string, number>): Joint[] {
    const jointBlockId = blockTypes.find(blockType => blockType.name === SECTION_JOINT_BLOCK_NAME)?.id;
    if (jointBlockId === undefined) return [];

    // Parse once for performance and clarity
    const parsed = Object.entries(blocks).map(([coordinate, id]) => {
      const [ x, y, z ] = coordinate.split(',').map(Number);
      return { x, y, z, id };
    });

    // Compute bounds across all blocks in the section
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    for (const { x, z } of parsed) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (z < minZ) minZ = z;
      if (z > maxZ) maxZ = z;
    }

    // Collect joints and assign orientation by edge rule (X precedence over Z), we should never have joins on edges though.
    const joints: Joint[] = [];
    for (const { x, y, z, id } of parsed) {
      if (id !== jointBlockId) continue;

      const orientation =
        x === minX ? JointOrientation.LEFT :
        x === maxX ? JointOrientation.RIGHT :
        z === minZ ? JointOrientation.UP :
        z === maxZ ? JointOrientation.DOWN :
        undefined;

      if (orientation) joints.push({ coordinate: { x, y, z }, orientation });
    }

    return joints;
  }

  private _selectConnectableSection(): ProceduralRegionSection {
    const connectableSections = this._sections.filter(section => section.localJoints.length > 1);
    return this._pickWeighted(connectableSections);
  }
  
  private _selectDeadEndSection(): ProceduralRegionSection {
    const endSections = this._sections.filter(section => section.localJoints.length === 1);
    return this._pickWeighted(endSections);
  }

  private _pickWeighted(sections: ProceduralRegionSection[]): ProceduralRegionSection {
    const count = sections.length;
    if (count === 0) return this._sections[Math.floor(Math.random() * this._sections.length)];

    let totalWeight = 0;
    for (const section of sections) totalWeight += Math.max(0, section.weight ?? 0);
    if (totalWeight <= 0) return sections[Math.floor(Math.random() * count)];

    let threshold = Math.random() * totalWeight;

    for (const section of sections) {
      threshold -= Math.max(0, section.weight ?? 0);
      if (threshold <= 0) return section;
    }

    return sections[count - 1];
  }
}