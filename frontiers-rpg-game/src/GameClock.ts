import { World } from 'hytopia';

const CYCLE_CLOCK_INTERVAL_MS = 250; // Update clock every 1 second
const CYCLE_CLOCK_OFFSET_HOURS = 7;
const CYCLE_DAY_MAX_SKYBOX_INTENSITY = 1.2;
const CYCLE_DURATION_MS = 24 * 60 * 1000; // Day/Night Cycle Every 24 minutes
const CYCLE_NIGHT_MIN_SKYBOX_INTENSITY = 0.005;

export default class GameClock {
  public static readonly instance = new GameClock();

  private _timeMs: number = 0;
  private _worlds: Set<World> = new Set();

  private constructor() {
    setInterval(() => this._tickClock(), CYCLE_CLOCK_INTERVAL_MS);
  }

  public get hour(): number { 
    const cycleProgress = (this._timeMs % CYCLE_DURATION_MS) / CYCLE_DURATION_MS;
    return Math.floor((cycleProgress * 24) + CYCLE_CLOCK_OFFSET_HOURS) % 24;
  }
  
  public get minute(): number { 
    const cycleProgress = (this._timeMs % CYCLE_DURATION_MS) / CYCLE_DURATION_MS;
    const totalMinutes = (cycleProgress * 24 * 60) + (CYCLE_CLOCK_OFFSET_HOURS * 60);
    return Math.floor(totalMinutes) % 60;
  }

  public addWorld(world: World): void {
    this._worlds.add(world);
  }

  public removeWorld(world: World): void {
    this._worlds.delete(world);
  }

  private _tickClock(): void {
    this._timeMs += CYCLE_CLOCK_INTERVAL_MS; 

    if (this._timeMs >= CYCLE_DURATION_MS) {
      this._timeMs = 0;
    }

    this._worlds.forEach((world) => this._updateWorldClockCycle(world));
  }

  private _updateWorldClockCycle(world: World): void {
    // Calculate sun position in circular path
    const timeProgress = this._timeMs / CYCLE_DURATION_MS;
    const sunAngle = timeProgress * 2 * Math.PI;
    const sunRadius = 300;
    const sunHeight = 100 + Math.sin(sunAngle) * 150;
    
    const sunX = Math.cos(sunAngle) * sunRadius;
    const sunZ = Math.sin(sunAngle) * sunRadius;
    
    world.setDirectionalLightPosition({ x: sunX, y: sunHeight, z: sunZ });
    
    // Calculate lighting intensity based on sun height (simple and elegant)
    const sunHeightNormalized = (sunHeight - (-50)) / (250 - (-50)); // Normalize to 0-1
    const lightIntensity = Math.max(0.2, sunHeightNormalized * 1.5);
    const ambientIntensity = Math.max(0.35, sunHeightNormalized * 0.9);
    
    // Calculate skybox intensity with ease-in transition
    const skyboxT = Math.max(0, Math.min(1, sunHeightNormalized));
    const skyboxEaseT = skyboxT * skyboxT; // Simple ease-in using quadratic
    const skyboxIntensity = CYCLE_NIGHT_MIN_SKYBOX_INTENSITY + 
                           skyboxEaseT * (CYCLE_DAY_MAX_SKYBOX_INTENSITY - CYCLE_NIGHT_MIN_SKYBOX_INTENSITY);
    
    // Smooth color transition from night to day
    const colorIntensity = Math.max(0.4, sunHeightNormalized);
    const dayProgressT = Math.max(0, Math.min(1, sunHeightNormalized));
    const dayProgress = dayProgressT * dayProgressT * (3 - 2 * dayProgressT); // Smooth step formula
    
    // Interpolate between night colors (cool blue) and day colors (warm white)
    const nightR = 150;
    const nightG = 180;
    const nightB = 255;
    
    const dayR = 255;
    const dayG = 255;
    const dayB = 255;
    
    const r = Math.floor(colorIntensity * (nightR + dayProgress * (dayR - nightR)));
    const g = Math.floor(colorIntensity * (nightG + dayProgress * (dayG - nightG)));
    const b = Math.floor(colorIntensity * (nightB + dayProgress * (dayB - nightB)));
    
    // Apply lighting
    world.setDirectionalLightColor({ r, g, b });
    world.setDirectionalLightIntensity(lightIntensity);
    world.setAmbientLightColor({ r, g, b });
    world.setAmbientLightIntensity(ambientIntensity);
    world.setSkyboxIntensity(skyboxIntensity);
  }
}