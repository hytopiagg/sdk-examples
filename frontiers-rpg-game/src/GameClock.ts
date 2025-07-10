import type GameRegion from './GameRegion';

const CYCLE_CLOCK_INTERVAL_MS = 5000; // Update clock every 5 second
const CYCLE_CLOCK_OFFSET_HOURS = 7;
const CYCLE_DAY_MAX_SKYBOX_INTENSITY = 1.2;
const CYCLE_DURATION_MS = 24 * 60 * 1000; // Day/Night Cycle Every 24 minutes
const CYCLE_NIGHT_MIN_SKYBOX_INTENSITY = 0.005;

export default class GameClock {
  public static readonly instance = new GameClock();

  private _timeMs: number = 7 * 60 * 1000; // 5 + Offset time start (hours) 12pm
  private _regions: Set<GameRegion> = new Set();

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

  public addRegionClockCycle(region: GameRegion): void {
    this._regions.add(region);
    this._updateRegionClockCycle(region);
  }

  public removeRegionClockCycle(region: GameRegion): void {
    this._regions.delete(region);
  }

  private _tickClock(): void {
    this._timeMs += CYCLE_CLOCK_INTERVAL_MS; 

    if (this._timeMs >= CYCLE_DURATION_MS) {
      this._timeMs = 0;
    }

    this._regions.forEach((region) => this._updateRegionClockCycle(region));
  }

  private _updateRegionClockCycle(region: GameRegion): void {
    const world = region.world;
    
    // Calculate sun position with asymmetric day/night cycle (75% day, 25% night)
    const timeProgress = this._timeMs / CYCLE_DURATION_MS;
    
    // Create asymmetric sun angle: 75% of time for day, 25% for night
    let sunAngle: number;
    if (timeProgress < 0.75) {
      // Day period: map first 75% of cycle to first half of sine wave (0 to π)
      sunAngle = (timeProgress / 0.75) * Math.PI;
    } else {
      // Night period: map last 25% of cycle to second half of sine wave (π to 2π)
      sunAngle = Math.PI + ((timeProgress - 0.75) / 0.25) * Math.PI;
    }
    
    const sunRadius = 300;
    const sunHeight = 100 + Math.sin(sunAngle) * 150;
    
    const sunX = Math.cos(sunAngle) * sunRadius;
    const sunZ = Math.sin(sunAngle) * sunRadius;
    
    world.setDirectionalLightPosition({ x: sunX, y: sunHeight, z: sunZ });
    
    // Calculate lighting intensity based on sun height (simple and elegant)
    const sunHeightNormalized = (sunHeight - (-50)) / (250 - (-50)); // Normalize to 0-1

    const lightIntensity = Math.max(region.minDirectionalLightIntensity, sunHeightNormalized * region.maxDirectionalLightIntensity);
    const ambientIntensity = Math.max(region.minAmbientLightIntensity, sunHeightNormalized * region.maxAmbientLightIntensity);
    
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

    // Adjust fog color based on day/night cycle if region has base fog color
    if (region.baseFogColor) {
      // Match the colorIntensity pattern - fog brightness follows same logic as lighting
      const fogIntensityMultiplier = Math.max(0.3, sunHeightNormalized);
      
      const adjustedFogColor = {
        r: Math.floor(region.baseFogColor.r * fogIntensityMultiplier),
        g: Math.floor(region.baseFogColor.g * fogIntensityMultiplier),
        b: Math.floor(region.baseFogColor.b * fogIntensityMultiplier)
      };
      
      world.setFogColor(adjustedFogColor);
    }
  }
}