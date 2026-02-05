# Procedural World Generator Specification

## Overview

A procedural world generation system for HYTOPIA that generates Fallout-style post-apocalyptic worlds at runtime. The generator creates urban ruins, wilderness areas, underground systems, and natural terrain that load into the HYTOPIA runtime.

## References

- **SDK/Server Source:** `/Users/arkdev/Desktop/HYTOPIA/hytopia/server`
- **Reference Generators:** `/Users/arkdev/Desktop/HYTOPIA/hytopia/sdk-examples/ark-game/generator-references` (arnis, Cities, LostCities, Terra)
- **Block Types:** `/Users/arkdev/Desktop/HYTOPIA/hytopia/sdk-examples/ark-game/assets/maps/generator-base.json`
- **Output Directory:** `/Users/arkdev/Desktop/HYTOPIA/hytopia/sdk-examples/ark-game/src/generator`
- **Integration Point:** `/Users/arkdev/Desktop/HYTOPIA/hytopia/sdk-examples/ark-game/index.ts`

---

## World Configuration

### Dimensions
- **Size:** 1024 x 192 x 1024 blocks (configurable)
- **Y-axis:** 0 = bedrock, 192 = sky limit
- **Coordinate origin:** World center at (512, 0, 512)

### Generation Mode
- **Type:** Fixed-size world, generated synchronously at startup
- **Seeding:** Deterministic - same seed produces identical world every time
- **Error handling:** Skip and continue - log warnings for failed placements, don't halt generation

### World Boundaries
- **Edge treatment:** Void/cliff - world ends in a cliff dropping to void
- **Boundary buffer:** Generate natural cliff edge 8-16 blocks from actual boundary

---

## Aesthetic & Theme

### Overall Style
Post-apocalyptic wasteland inspired by Fallout series:
- Abandoned cities with decay and collapse
- Overgrown vegetation reclaiming structures
- Mix of ruined and occasionally intact buildings
- Environmental storytelling through destruction patterns

### Zone Variation (Subtle Biomes)
Different zones with environmental differences rather than distinct biomes:
- **Dried riverbed zones** - Sandy terrain, exposed pipes, stranded vehicles
- **Dead forest zones** - Skeletal trees, leaf piles, undergrowth debris
- **Ash plains** - Darker soil, sparse vegetation, scattered rubble
- **Urban decay zones** - Dense ruins, street grids, collapsed infrastructure
- **Industrial wasteland** - Factory ruins, toxic pools, metal debris

### Decay Level
- **Target:** 40-50% of structures significantly damaged/collapsed
- **50-60%** of structures structurally intact (varying degrees of weathering)
- Damage should feel organic - blast patterns, structural failure, nature reclamation

---

## Urban Generation

### Coverage
- **Urban ratio:** 40-50% of world surface
- **Distribution:** Clustered city centers with suburban sprawl, transitioning to wilderness

### Building Types

#### Residential (Most Common)
- Small houses (1-2 floors)
- Apartment buildings (3-8 floors)
- Suburban homes with yards

#### Commercial
- Shops and storefronts (1-3 floors)
- Office buildings (2-12 floors)
- Warehouses (1-2 floors, large footprint)
- Gas stations

#### Industrial
- Factories (2-4 floors, large footprint)
- Power plant structures
- Storage facilities

#### Civic/Special
- Hospital (large, multi-wing)
- Police station
- Schools
- Churches

### Building Heights
- **Suburban/residential:** 1-4 floors
- **Mid-rise commercial:** 3-8 floors
- **Downtown/high-rise:** 8-15+ floors
- Height varies by zone density - taller buildings toward city centers

### Interiors
- **Accessibility:** Mixed - some buildings fully explorable, others sealed/collapsed
- **Detail level:** Basic room layouts using blocks only
  - Walls define rooms
  - Broken walls, holes in floors
  - Structural damage details
  - No furniture in V1 (placeholder for future decoration system)

### Street Layout
- **Pattern:** Hybrid grid with destruction overlay
- **Base:** Manhattan-style street grids in urban cores
- **Destruction:** Collapsed sections, debris piles, crater interruptions
- **Materials:** Use stone/concrete blocks for roads, damaged sections show dirt/rubble

---

## Landmark Generation

### Types

#### Vertical Structures
- Radio towers (tall, skeletal metal structure)
- Water towers (platform on legs)
- Tall smokestacks/chimneys

#### Transportation
- Collapsed highway overpasses
- Train stations/platforms
- Bridges (intact and collapsed)

### Placement
- 3-5 major landmarks per world
- Distributed to aid navigation from different areas
- Visible from significant distance
- Located at zone boundaries or city centers

---

## Underground Systems

### Multi-Layer Architecture

#### Layer 1: Subway/Metro (Y: 40-60)
- **Content:** Complex metro system
  - Linear tunnel sections connecting urban areas
  - Station rooms with platforms
  - Maintenance areas
  - Flooded sections
  - Collapsed/blocked areas
- **Connections:** Stairs/entrances in urban areas, vertical shafts

#### Layer 2: Natural Caves (Y: 10-50)
- **Content:** Natural cave networks
  - Caverns of varying sizes
  - Connecting tunnels
  - Underground lakes/water pools
  - Stalactite/stalagmite formations (using block shapes)
- **Ore placement:** Following depth-based rarity

#### Layer 3: Deep Caverns (Y: 0-20)
- **Content:** Deep cave system
  - Lava pools and flows
  - Rare ore concentrations
  - Large open caverns
  - Narrow passages

### Cave Connectivity
- Caves can intersect with subway tunnels (flooded metro, collapsed into caves)
- Vertical shafts connecting layers
- Some caves surface in wilderness areas

---

## Resource Distribution

### Ore Types (from block types)
Using existing block definitions:
- `coal-ore` / `deepslate-coal-ore`
- `iron-ore` / `deepslate-iron-ore`
- `gold-ore` / `deepslate-gold-ore`
- `diamond-ore` / `deepslate-diamond-ore`
- `emerald-ore` (deepslate variant)
- `ruby-ore` (deepslate variant)
- `sapphire-ore` (deepslate variant)

### Depth-Based Rarity
| Ore Type | Y Range | Frequency |
|----------|---------|-----------|
| Coal | 10-60 | Common |
| Iron | 5-50 | Common |
| Gold | 0-30 | Uncommon |
| Diamond | 0-16 | Rare |
| Emerald | 0-20 | Rare |
| Ruby | 0-15 | Very Rare |
| Sapphire | 0-15 | Very Rare |

### Vein Generation
- Coal/Iron: 4-8 blocks per vein
- Gold: 2-6 blocks per vein
- Diamond/Gems: 1-4 blocks per vein
- Veins follow natural cave walls when possible

---

## Water Features

### Distribution
Mixed water states across the world:
- Some areas flooded (subway sections, basements, low-lying areas)
- Some areas dried up (empty riverbeds, drained reservoirs)

### Water Types
- Standing water pools (using `water` block, isLiquid: true)
- Flooded basement/subway areas
- Underground lakes in caves
- Dried riverbed channels (empty, with exposed stone/dirt)

### Placement Logic
- Lower elevation areas more likely flooded
- Urban areas have drainage issues (flooded basements)
- Cave systems have underground water features

---

## Terrain Generation

### Surface Terrain
- **Base:** Noise-based heightmap generation
- **Range:** Y 50-100 for surface (adjustable)
- **Variation:** Rolling hills, occasional flat plains, small cliffs

### Block Layers (surface to depth)
1. **Surface:** Grass block variants or dirt (biome-dependent)
2. **Subsurface:** 3-5 blocks of dirt
3. **Stone layer:** Stone, transitioning to deepslate at Y < 20
4. **Bedrock:** Single layer at Y = 0

### Vegetation (Block-Based)
Using available blocks:
- Dead trees: `oak-log`, `spruce-log`, `birch-log` (no leaves or sparse `dark-oak-leaves`)
- Overgrown areas: `grass-block`, `grass-flower-block` variants
- Vines: `oak-planks-vine`, `birch-planks-vine`, `spruce-planks-vine` on structure walls

---

## Spawn System

### Safe Zone Generation
- Generate guaranteed safe starter area
- **Location:** Near world center
- **Size:** ~32x32 block clear area
- **Features:**
  - Flat, clear terrain
  - No hostile structures
  - Clear line of sight to nearest landmark
  - Path to explorable area

### Spawn Point Selection
- Center of safe zone
- Y position calculated to be on surface
- Returned to game code for player placement

---

## Special Block Usage

### Stairs (rotation support)
- Default orientation: Tallest side faces -Z
- Use for building entrances, multi-floor access
- Apply `BLOCK_ROTATIONS` for proper orientation

### Wedges/Ramps
- Default: 1-block tall back face at -Z, 45-degree slope
- Use for roof edges, rubble piles, terrain transitions

### Slabs (0.5 height)
- Use for floors, low walls, debris
- Create variation in flat surfaces

### Quarter Blocks (0.5x0.5x0.5)
- Use for fine detail
- Rubble, debris, broken edges

### Fences
- Use for barriers, railings, structural elements
- Connect along X/Z axes

---

## API Interface

### Generator Configuration
```typescript
interface GeneratorConfig {
  seed: number;                    // Deterministic seed
  worldSize: {
    x: number;                     // Default: 1024
    y: number;                     // Default: 192
    z: number;                     // Default: 1024
  };
  urbanDensity: number;            // 0.0-1.0, default: 0.45
  decayLevel: number;              // 0.0-1.0, default: 0.45
  caveFrequency: number;           // 0.0-1.0, default: 0.5
  oreAbundance: number;            // 0.0-1.0, default: 0.5
  waterLevel: number;              // Y level for water features
}
```

### Generator Output
```typescript
interface GeneratorResult {
  blocks: {
    [blockTypeId: number]: BlockPlacement[];
  };
  spawnPoint: Vector3Like;
  landmarks: LandmarkData[];
  decorationPoints: DecorationPoint[];  // For future decoration system
}

interface LandmarkData {
  type: string;
  position: Vector3Like;
  bounds: { min: Vector3Like; max: Vector3Like };
}
```

### Decoration Callback System (Future V2)
```typescript
type DecorationCallback = (point: DecorationPoint) => void;

interface DecorationPoint {
  position: Vector3Like;
  context: 'interior' | 'exterior' | 'road' | 'underground';
  structureType?: string;
  surfaceNormal: Vector3Like;
  availableSpace: Vector3Like;  // Dimensions of clear space
}
```

---

## Integration

### index.ts Integration
```typescript
import { WorldGenerator, GeneratorConfig } from './src/generator';

startServer(async world => {
  const config: GeneratorConfig = {
    seed: Date.now(),
    worldSize: { x: 1024, y: 192, z: 1024 },
    // ... other config
  };

  const generator = new WorldGenerator(config);
  const result = generator.generate();

  // Load generated blocks into world
  world.chunkLattice.initializeBlocks(result.blocks);

  // Store spawn point for player spawning
  const spawnPoint = result.spawnPoint;

  world.on(PlayerEvent.JOINED_WORLD, ({ player }) => {
    const playerEntity = new DefaultPlayerEntity({ player, name: 'Player' });
    playerEntity.spawn(world, spawnPoint);
  });
});
```

---

## File Structure

```
src/generator/
  index.ts                 # Main exports
  WorldGenerator.ts        # Main generator class
  config/
    GeneratorConfig.ts     # Configuration types
    BlockPalette.ts        # Block ID mappings from generator-base.json
  terrain/
    TerrainGenerator.ts    # Heightmap and base terrain
    BiomeMapper.ts         # Zone/biome distribution
    CaveGenerator.ts       # Underground cave systems
  structures/
    StructureGenerator.ts  # Building placement logic
    BuildingTemplates.ts   # Building type definitions
    LandmarkGenerator.ts   # Unique landmark generation
    RoadGenerator.ts       # Street and road networks
  underground/
    SubwayGenerator.ts     # Metro tunnel system
    OreDistributor.ts      # Resource vein placement
  utils/
    Noise.ts               # Simplex/Perlin noise utilities
    Random.ts              # Seeded random number generator
    Geometry.ts            # Block placement helpers
```

---

## Performance Considerations

### Generation Strategy
1. Generate terrain heightmap first (defines surface)
2. Place urban zones and road networks
3. Generate structures within urban zones
4. Carve cave systems (subtract from terrain)
5. Generate subway tunnels (in urban underground)
6. Distribute ores in cave walls
7. Apply decay/destruction passes
8. Generate safe spawn zone
9. Collect all block placements for batch initialization

### Optimization Notes
- Use `ChunkLattice.initializeBlocks()` for batch loading (more efficient than individual setBlock calls)
- Pre-calculate all block placements before any world modification
- Group blocks by type ID for collider optimization
- Total blocks for 1024x192x1024 world: up to ~200 million theoretical, actual ~5-20 million placed

---

## Version History

### V1 (Current Specification)
- Synchronous generation
- Block-only interiors (no decoration)
- Basic room layouts
- Decoration callback interface defined but not implemented

### Future V2 Considerations
- Async generation with progress reporting
- Decoration system for model placement
- Dynamic chunk generation for larger worlds
- Structure prefab loading from files

---

## Reference Generator Analysis

This section documents algorithms and patterns from reference codebases that can be adapted for our generator. The examples are in most cases not in typescript. They serve as an algorithmic and implementation approach reference.

### Reference Overview

| Reference | Primary Use | Language | Key Strengths |
|-----------|-------------|----------|---------------|
| **LostCities** | Urban generation, themes, damage | Java | Blocky cities, theme system, explosion damage |
| **Cities** | City pipeline, rasterization | Java | Sectors, roads, lots, shape-to-voxel conversion |
| **Terra** | Terrain, caves, biomes | Java | Noise routing, 3D caves, biome blending |
| **Arnis** | Roads, parcels, elevation | Rust | Road networks, flood fill, terrain integration |

---

### LostCities Reference

**Location:** `generator-references/LostCities/`

LostCities is the closest baseline for procedural blocky cities with a strong theme system. Excellent for building generation, damage/decay, and city layout patterns.

#### Architecture Overview

```
LostCityFeature (entry point)
    → LostCityTerrainFeature (main generation)
        → BuildingInfo (per-chunk metadata) ← CRITICAL FILE
        → ChunkDriver (block placement)
        → Gen modules (highways, buildings, streets)
```

#### Key Files

| File | Lines | Purpose |
|------|-------|---------|
| `worldgen/lost/BuildingInfo.java` | 2000+ | **PRIMARY** - Per-chunk metadata, building decisions |
| `worldgen/lost/City.java` | 200+ | City boundary detection via Perlin noise |
| `worldgen/lost/CityRarityMap.java` | 27 | Perlin noise-based city distribution |
| `worldgen/lost/cityassets/CityStyle.java` | 200+ | Theme/style definitions per city |
| `worldgen/lost/cityassets/Building.java` | 100+ | Individual building templates |
| `worldgen/lost/cityassets/Palette.java` | 100+ | Character↔BlockState mapping |
| `worldgen/lost/DamageArea.java` | 212 | Explosion damage calculation |
| `config/LostCityProfile.java` | 400+ | Global configuration parameters |

#### Algorithm: City Presence Detection

Uses Perlin noise with threshold for smooth city boundaries.

```java
// CityRarityMap.java
public float getCityFactor(int cx, int cz) {
    double factor = perlinCity.getValue(
        cx / scale,      // Perlin scale (default 3.0)
        cz / scale
    ) * innerScale - offset;  // innerScale: 0.1, offset: 0.1
    if (factor < 0) factor = 0;
    return (float) factor;
}

// BuildingInfo.java - Check if chunk is city
float cityFactor = City.getCityFactor(coord, provider, profile);
return cityFactor > profile.CITY_THRESHOLD;  // Default: 0.2f
```

**Adaptation:** Use this pattern for determining urban vs wilderness zones.

#### Algorithm: Building Height Variation

Height varies by distance from city center and random factors.

```java
// BuildingInfo.java lines 796-820
int maxfloors = getMaxfloors(cs);
int f = profile.BUILDING_MINFLOORS + rand.nextInt(
    (int)(profile.BUILDING_MINFLOORS_CHANCE +
    (cityFactor + .1f) *
    (profile.BUILDING_MAXFLOORS_CHANCE - profile.BUILDING_MINFLOORS_CHANCE))
);

// Adjust for distance from city center
if (CitySphere.intersectsWithCitySphere(key, provider)) {
    float reldest = CitySphere.getRelativeDistanceToCityCenter(coord, provider);
    if (reldest > .6f) { f = Math.max(minfloors, f - 2); }
    else if (reldest > .5f) { f = Math.max(minfloors, f - 1); }
}
```

**Adaptation:** Taller buildings toward city centers, shorter in suburbs.

#### Algorithm: Building Placement & Spacing

Neighbor-aware probabilistic rejection prevents crowding.

```java
// BuildingInfo.java lines 706-717
if (b && multiBuildingPos.isSingle()) {
    // Check neighboring buildings' "prefersLonely" probability
    if (rand.nextFloat() < getChunkCharacteristics(coord.west(), provider)
        .buildingType.getPrefersLonely()) {
        b = false;  // Don't place building
    }
    // Similar checks for east, north, south
}
```

**Adaptation:** Use for natural building spacing and density control.

#### Algorithm: Explosion Damage System

Two-tier explosion system with distance falloff.

```java
// DamageArea.java lines 199-209
public float getDamage(int x, int y, int z) {
    float damage = 0.0f;
    for (Explosion explosion : explosions) {
        double sq = explosion.getCenter().distToCenterSqr(x, y, z);
        if (sq < explosion.getSqradius()) {
            double d = Math.sqrt(sq);
            damage += 3.0f * (explosion.getRadius() - d) / explosion.getRadius();
        }
    }
    return damage;  // 0-3+ scale
}

// Block damage application
public BlockState damageBlock(BlockState b, float damage, CompiledPalette palette) {
    if (damage < BLOCK_DAMAGE_CHANCE && damaged != null) {
        if (rand.nextFloat() < .7f) {
            b = damaged;  // Damaged variant
        } else {
            b = air;  // Destroy completely
        }
    }
    return b;
}
```

**Configuration Parameters:**
```java
float EXPLOSION_CHANCE = .002f;        // 0.2% per chunk
int EXPLOSION_MINRADIUS = 15;
int EXPLOSION_MAXRADIUS = 35;
float MINI_EXPLOSION_CHANCE = .03f;    // 3% per chunk
int MINI_EXPLOSION_MINRADIUS = 5;
int MINI_EXPLOSION_MAXRADIUS = 12;
float RUIN_CHANCE = 0.05f;             // 5% buildings ruined
```

**Adaptation:** Apply damage pass after building generation for decay effect.

#### Algorithm: Floor Part Selection

Condition-based template selection for building floors.

```java
// BuildingInfo.java lines 877-930
for (int i = 0; i <= floors + cellars; i++) {
    ConditionContext context = new ConditionContext(
        cityLevel + i - cellars,  // absolute level
        i - cellars,               // relative level
        cellars, floors,
        "<none>", belowPart,
        building.getName(), coord
    );
    String randomPart = building.getRandomPart(rand, conditionContext);
    floorTypes[i] = AssetRegistries.PARTS.get(randomPart);
}
```

**Adaptation:** Use context-aware template selection for varied building interiors.

#### Theme System (Three-Layer)

1. **WorldStyle** - Global dimension settings
2. **CityStyle** - Per-city aesthetic (building selectors, street parts)
3. **Building** - Individual structure templates with palettes

**Palette System:** Character-to-block mapping (e.g., '#' → stone brick) with damaged variants.

---

### Cities Reference

**Location:** `generator-references/Cities/`

Cities excels at the generation pipeline: sectors → roads → lots → buildings → rasterization. Best reference for shape-to-voxel conversion.

#### Architecture Overview

```
Sector (region)
    → Road Network (polylines)
    → Parcels (lots with zones)
    → Buildings (composed of parts)
    → Rasterization (Pen → RasterTarget)
```

#### Key Files

| File | Purpose |
|------|---------|
| `parcels/Parcel.java` | Building plot with shape and orientation |
| `parcels/Zone.java` | Zoning enum (RESIDENTIAL, COMMERCIAL, etc.) |
| `roads/Road.java` | Multi-segment road polyline |
| `roads/RoadSegment.java` | Single road segment |
| `raster/Pen.java` | 2D drawing interface |
| `raster/RasterTarget.java` | 3D voxel writing interface |
| `raster/RasterUtil.java` | Geometry rasterization algorithms |
| `bldg/Building.java` | Building model composed of parts |
| `bldg/BuildingPart.java` | Individual building component |
| `bldg/gen/RectHouseGenerator.java` | House generation example |
| `common/Edges.java` | Spatial utilities for subdivision |

#### Algorithm: Road Network Generation

Roads as polylines through multiple waypoints.

```java
// Road.java - Build from segment points
List<RoadSegment> segments;
for (int i = 1; i < segPoints.size(); i++) {
    RoadSegment seg = new RoadSegment(segPoints.get(i-1), segPoints.get(i), width);
    segments.add(seg);
}

// RoadSegment stores start/end points and width
// Length calculated via start.distance(end)
```

**Adaptation:** Use for street grid generation with variable widths.

#### Algorithm: Lot Allocation with Edges Utility

Subdivide rectangular areas by orientation.

```java
// Edges.java - Get corner by orientation
public static Vector2i getCorner(BlockAreac rc, Orientation o) {
    int dx = o.direction().x() + 1;  // [0..2]
    int dy = o.direction().y() + 1;  // [0..2]
    int x = rc.minX() + (rc.getSizeX() - 1) * dx / 2;
    int y = rc.minY() + (rc.getSizeY() - 1) * dy / 2;
    return new Vector2i(x, y);
}

// Distance to border for parcel sizing
public static int getDistanceToBorder(BlockAreac rc, int x, int z) {
    int borderDistX = Math.min(x - rc.minX(), rc.maxX() - x);
    int borderDistZ = Math.min(z - rc.minY(), rc.maxY() - z);
    return Math.min(borderDistX, borderDistZ);
}
```

**Adaptation:** Use for calculating building setbacks and yard space.

#### Algorithm: Bresenham Line Rasterization

Convert 2D lines to voxel-aligned blocks.

```java
// RasterUtil.java lines 145-178
private static void drawClippedLine(Pen pen, int x1, int z1, int x2, int z2) {
    int dx = Math.abs(x2 - x1);
    int dy = Math.abs(z2 - z1);
    int sx = (x1 < x2) ? 1 : -1;
    int sy = (z1 < z2) ? 1 : -1;
    int err = dx - dy;

    while (true) {
        pen.draw(x, z);
        if (x == x2 && z == z2) break;

        int e2 = 2 * err;
        if (e2 > -dy) { err -= dy; x += sx; }
        if (e2 < dx) { err += dx; z += sy; }
    }
}
```

**Adaptation:** Essential for road drawing and wall generation.

#### Algorithm: Circle Rasterization (Horn's Algorithm)

```java
// RasterUtil.java lines 188-210
public static void drawCircle(CheckedPen pen, int cx, int cy, int rad) {
    int d = -rad;
    int x = rad, y = 0;
    while (y <= x) {
        // 8-way symmetry drawing
        pen.draw(cx + x, cy + y);
        pen.draw(cx - x, cy + y);
        pen.draw(cx + x, cy - y);
        pen.draw(cx - x, cy - y);
        pen.draw(cx + y, cy + x);
        pen.draw(cx - y, cy + x);
        pen.draw(cx + y, cy - x);
        pen.draw(cx - y, cy - x);

        d = d + 2 * y + 1;
        y = y + 1;
        if (d > 0) { d = d - 2 * x + 2; x = x - 1; }
    }
}
```

**Adaptation:** Use for round structures like water towers, silos.

#### Algorithm: Floor Preparation with Terrain

Smart foundation that adapts to uneven terrain.

```java
// BuildingPens.java lines 39-77
public static Pen floorPen(RasterTarget target, HeightMap terrainHeightMap,
                           int baseHeight, BlockType floor) {
    return new AbstractPen(target.getAffectedArea()) {
        @Override
        public void draw(int x, int z) {
            int terrain = terrainHeightMap.apply(x, z);
            int floorLevel = baseHeight - 1;
            int y = Math.max(target.getMinHeight(), terrain);

            // Fill foundation from terrain to floor
            while (y < floorLevel) {
                target.setBlock(x, y, z, BUILDING_FOUNDATION);
                y++;
            }

            // Place floor block
            target.setBlock(x, floorLevel, z, floor);

            // Clear area above floor
            while (y <= target.getMaxHeight() && y <= terrain) {
                target.setBlock(x, y, z, AIR);
                y++;
            }
        }
    };
}
```

**Adaptation:** Critical for placing buildings on uneven terrain.

#### Building Generation Pattern

```java
// RectHouseGenerator.java pattern
public Building generate(Parcel parcel, HeightMap hm) {
    // 1. Deterministic randomization from parcel
    Random rng = new MersenneRandom(parcel.getShape().hashCode());

    // 2. Create building with orientation
    DefaultBuilding bldg = new DefaultBuilding(parcel.getOrientation());

    // 3. Inset from parcel boundary
    int inset = 2;
    BlockAreac layout = parcel.getShape().expand(-inset, -inset);

    // 4. Place door at front
    Vector2i doorPos = Edges.getCorner(layout, orientation);
    int floorHeight = hm.apply(doorPos) + 1;

    // 5. Create roof (random type selection)
    Roof roof = createRoof(rng, layout, floorHeight + wallHeight);

    // 6. Create building part with components
    RectBuildingPart part = new RectBuildingPart(layout, roof, floorHeight, wallHeight);
    part.addDoor(new SimpleDoor(orientation, doorPos, floorHeight, floorHeight + 2));

    // 7. Add windows
    for (SimpleWindow wnd : createWindows(...)) {
        part.addWindow(wnd);
    }

    bldg.addPart(part);
    return bldg;
}
```

#### Turtle Graphics for Layout

Relative positioning with orientation awareness.

```java
// Turtle.java - Move relative to current orientation
public Turtle move(int right, int forward) {
    Vector2ic dir = orient.direction();
    pos.add(rotateX(dir, right, forward), rotateY(dir, right, forward));
    return this;
}

// Create rectangle relative to turtle position/direction
public BlockAreac rect(int right, int forward, int width, int len) {
    // ... returns oriented rectangle
}
```

**Adaptation:** Excellent for procedural multi-part building layout.

---

### Terra Reference

**Location:** `generator-references/Terra/`

Terra is a modern noise routing + biome-based worldgen system. Best reference for terrain generation, cave carving, and biome transitions.

#### Architecture Overview

```
Config (YAML)
    → Biome Pipeline (Sources → Stages)
    → Noise Composition (Samplers)
    → 3D Terrain Generation
    → Cave Carving (Lazy Interpolation)
    → Block Palette Selection
```

#### Key Files

| File | Purpose |
|------|---------|
| `chunkgenerator/generation/NoiseChunkGenerator3D.java` | Main 3D terrain generator |
| `chunkgenerator/generation/math/samplers/Sampler3D.java` | 3D noise sampling |
| `chunkgenerator/generation/math/interpolation/ChunkInterpolator.java` | Trilinear 3D interpolation |
| `chunkgenerator/generation/math/interpolation/ElevationInterpolator.java` | 2D elevation smoothing |
| `chunkgenerator/generation/math/interpolation/LazilyEvaluatedInterpolator.java` | Cave carving |
| `chunkgenerator/config/noise/BiomeNoiseConfigTemplate.java` | Noise routing config |
| `biome/pipeline/PipelineBiomeProvider.java` | Biome placement pipeline |
| `noise/NoiseAddon.java` | Noise function registry |

#### Algorithm: 3D Terrain Generation

Core generation loop combining terrain noise + elevation + carving.

```java
// NoiseChunkGenerator3D.java - Main loop
for each chunk (x=0..15, z=0..15):
    get biome column for (cx, cz)
    for each y level (top to bottom):
        noise = sampler.sample(x, y, z)      // 3D terrain + elevation
        carving = carver.sample(x, y, z)     // Cave carving noise

        if (noise > 0):
            if (carving > 0):  // Cave (3D noise carves out blocks)
                place air
            else:
                get block from palette at depth
        else if (y <= seaLevel):
            place water/ocean block
```

**Adaptation:** Use this pattern for our terrain + cave integration.

#### Algorithm: Trilinear 3D Interpolation

Pre-compute noise grid, interpolate for smooth terrain.

```java
// ChunkInterpolator.java - Biome blending during grid setup
for each sample point (x, y, z):
    runningNoise = 0
    runningDiv = 0

    for each biome in blend radius:
        sample = biome.base.getSample(x, y, z, seed)
        weight = biome.blendWeight
        runningNoise += sample * weight
        runningDiv += weight

    final_noise = runningNoise / runningDiv  // Weighted average

// Trilinear interpolation of 8 cube corners
trilerp(x, y, z) = lerp(
    bilerp(y, z) at x=0,
    bilerp(y, z) at x=1,
    x_fraction
)
```

**Adaptation:** Use for smooth biome/zone transitions.

#### Algorithm: Cave Carving

Lazy-evaluated 3D noise for efficient cave generation.

```java
// LazilyEvaluatedInterpolator.java
// Samples at configurable resolution (default: 4 horizontal, 2 vertical)
carving_sample[x][y][z] = biome.carving.getSample(seed, x, y, z)

if carving_sample > 0:  // Solid
    place block
else:  // Cave
    place air
```

**Configuration:**
```yaml
carving:
  resolution:
    horizontal: 4  # Sample every 4 blocks horizontally
    vertical: 2    # Sample every 2 blocks vertically
```

- **Lower resolution** = faster = larger caves
- **Higher resolution** = slower = detailed caves

**Adaptation:** Use for our natural cave system (Layer 2-3).

#### Algorithm: 2D Elevation Smoothing

Per-column elevation with biome boundary smoothing.

```java
// ElevationInterpolator.java
for each column (x, z):
    if all surrounding biomes are same:
        elevation = biome.elevation.getSample(x, z, seed)
    else:
        // Smooth across biome boundary
        elevation = weighted_average of nearby biome elevations
```

**Adaptation:** Use for zone boundary smoothing (urban→wilderness).

#### Noise Function Types (from NoiseAddon.java)

**Base Noise:**
- `OPEN_SIMPLEX_2`, `OPEN_SIMPLEX_2S` - Modern simplex (recommended)
- `PERLIN` - Classic Perlin
- `CELLULAR` - Voronoi/cellular
- `VALUE`, `VALUE_CUBIC` - Value noise

**Modifiers:**
- `FBM` - Fractional Brownian Motion (layered octaves)
- `RIDGED` - Ridged multifractal
- `DOMAIN_WARP` - Domain warping

**Operations:**
- `ADD`, `SUB`, `MUL`, `DIV`, `MAX`, `MIN`

**Normalizers:**
- `LINEAR`, `CLAMP`, `CUBIC_SPLINE`

#### Example Noise Composition

```yaml
samplers:
  base_terrain:
    type: FBM
    source:
      type: OPEN_SIMPLEX_2
      scale: 50
    octaves: 4
    frequency: 2.0
    amplitude: 1.0
    roughness: 0.5

  cave_carving:
    type: FBM
    source:
      type: OPEN_SIMPLEX_2
      scale: 30
    octaves: 3
```

**Adaptation:** Use FBM with OpenSimplex2 for terrain and caves.

---

### Arnis Reference

**Location:** `generator-references/arnis/`

Arnis demonstrates how roads, parcels, landuse, and elevation integrate together. Best reference for the urban planning pipeline.

#### Architecture Overview

```
Data → Parse → Transform → Generate Ground → Process Elements → Save
                              ↓
              Roads → Buildings → Landuse → Natural Features
```

#### Key Files

| File | Purpose |
|------|---------|
| `element_processing/highways.rs` | Road generation (866 lines) |
| `element_processing/landuse.rs` | Zone classification (420 lines) |
| `floodfill.rs` | Parcel subdivision (240 lines) |
| `ground.rs` | Elevation interpolation |
| `urban_ground.rs` | Urban cluster detection |
| `bresenham.rs` | Line drawing |

#### Algorithm: Road Generation with Elevation

Multi-layer roads with automatic slopes and bridges.

```rust
// highways.rs - Elevation handling
const LAYER_HEIGHT_STEP: i32 = 6;  // Each layer = 6 blocks
let base_elevation = layer_value * LAYER_HEIGHT_STEP;

// Valley bridge detection (lines 281-327)
// If terrain dips >7 blocks below endpoints, maintain level bridge deck

// Slope calculation (lines 259-268)
// Slopes use 35% of way length, clamped to 15-50 blocks
let slope_length = (total_way_length * 0.35).clamp(15, 50);

// Support pillar placement at intervals
// (x + z) % 8 == 0 for pillar positions
// 3x3 base for stability
```

**Road Width Classification:**
```
Motorway/Primary/Trunk: 5 blocks + stripes
Secondary: 4 blocks + stripes
Tertiary: 3 blocks + stripes
Footway/Pedestrian: 1 block (gray concrete)
Path: 1 block (dirt)
Service: 2 blocks (gray concrete)
```

**Adaptation:** Use for highway overpasses and varied street widths.

#### Algorithm: Flood Fill for Parcels

Efficient polygon-to-coordinates conversion.

```rust
// floodfill.rs - Automatic algorithm selection
// Small areas (< 50,000 blocks): optimized flood fill
// Large areas (>= 50,000 blocks): grid sampling

pub fn flood_fill_area(polygon_coords: &[(i32, i32)]) -> Vec<(i32, i32)> {
    // Create geo::Polygon for point-in-polygon testing
    let polygon = Polygon::new(/* coords */);

    // Adaptive step sizes
    let step_x = (width / 6).clamp(1, 8);
    let step_z = (height / 6).clamp(1, 8);

    // BFS with 4-directional neighbors
    while let Some((x, z)) = queue.pop_front() {
        if polygon.contains(&Point::new(x as f64, z as f64)) {
            filled_area.push((x, z));
            // Add neighbors to queue
        }
    }

    filled_area
}
```

**Adaptation:** Use for filling building footprints and zone areas.

#### Algorithm: Landuse Classification

Zone-to-block mapping with per-block randomization.

```rust
// landuse.rs - Base mapping
match landuse_tag {
    "greenfield" | "meadow" | "grass" => GRASS_BLOCK,
    "farmland" => FARMLAND,
    "residential" => if rural { GRASS } else { STONE_BRICKS },
    "commercial" => SMOOTH_STONE,
    "industrial" => STONE,
    // etc.
}

// Per-block randomization for variety
// Urban Residential Mix:
// 72% Stone Bricks, 15% Cracked, 5% Stone, 8% Cobblestone
```

**Adaptation:** Use for ground block variation in different zones.

#### Algorithm: Elevation Integration

Bilinear interpolation from terrain data.

```rust
// ground.rs
pub fn level(&self, coord: XZPoint) -> i32 {
    if !self.elevation_enabled {
        return self.ground_level;
    }

    // Convert world to elevation grid coordinates
    let (x_ratio, z_ratio) = self.get_data_coordinates(coord, data);

    // Bilinear interpolation
    self.interpolate_height(x_ratio, z_ratio, data)
}
```

**Usage:**
- Buildings get foundation from ground level to base
- Roads use `get_ground_level(x, z)` at each point
- Valley bridges detect terrain dips along path

**Adaptation:** Essential for terrain-aware structure placement.

#### Algorithm: Urban Cluster Detection

Grid-based density analysis for urban vs rural.

```rust
// urban_ground.rs
// 1. Grid-based density analysis (64 blocks = 4 chunks per cell)
// 2. Count buildings per cell
// 3. Flood fill from dense cells to find clusters
// 4. Only clusters with 5+ buildings become urban
// 5. Compute concave hull around cluster
// 6. Fill hull with urban ground blocks
```

**Memory-Efficient Bitmap:**
```rust
// 1 bit per coordinate instead of HashSet
// For 7.8 km²: ~270 KB vs ~560 MB
```

**Adaptation:** Use for determining urban density and ground materials.

---

### Algorithm Mapping to Our Generator

| Our Component | Primary Reference | Key Algorithms |
|---------------|------------------|----------------|
| **TerrainGenerator** | Terra | FBM noise, trilinear interpolation, elevation smoothing |
| **BiomeMapper** | Terra + LostCities | Perlin noise zones, biome blending, city factor |
| **CaveGenerator** | Terra | 3D carving noise, lazy interpolation, depth layers |
| **RoadGenerator** | Cities + Arnis | Bresenham lines, road widths, elevation slopes |
| **StructureGenerator** | LostCities + Cities | Height variation, spacing, floor parts, rasterization |
| **BuildingTemplates** | LostCities | Palette system, condition-based selection |
| **DamageSystem** | LostCities | Explosion damage, distance falloff, ruin chance |
| **LandmarkGenerator** | Cities | Turtle graphics, multi-part structures |
| **SubwayGenerator** | Arnis | Tunnel elevation, flood fill for stations |
| **OreDistributor** | Terra | Depth-based distribution, vein placement |

---

### Implementation Priority

**Phase 1 - Core Terrain:**
1. Implement noise utilities (adapt Terra's sampler system)
2. Terrain heightmap generation (Terra's ChunkInterpolator)
3. Basic cave carving (Terra's lazy interpolation)

**Phase 2 - Urban Framework:**
1. City zone detection (LostCities' CityRarityMap)
2. Road network generation (Cities' Road + Arnis' Bresenham)
3. Parcel subdivision (Arnis' flood fill)

**Phase 3 - Structures:**
1. Building placement logic (LostCities' BuildingInfo)
2. Height variation (LostCities' city factor algorithm)
3. Rasterization pipeline (Cities' Pen/RasterTarget)

**Phase 4 - Detail:**
1. Interior generation (LostCities' floor parts)
2. Damage/decay pass (LostCities' DamageArea)
3. Landmark placement (Cities' turtle graphics)
