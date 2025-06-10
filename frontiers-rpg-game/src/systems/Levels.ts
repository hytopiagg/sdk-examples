/**
 * Experience and Level System
 * Handles all level calculations and experience requirements
 */
export default class Levels {
  private static readonly MAX_LEVEL = 100;
  private static readonly EXPERIENCE_TABLE: number[] = [0]; // Level 1 = 0 XP
  
  public static getLevelFromExperience(experience: number): number {
    if (experience <= 0) return 1;
    
    return Math.max(1, Math.floor(Math.pow(experience / 35, 1 / 2.2)));
  }
  
  public static getLevelRequiredExperience(level: number): number {
    if (level <= 1) return 0;

    if (level >= this.EXPERIENCE_TABLE.length) {
      return this.EXPERIENCE_TABLE[this.EXPERIENCE_TABLE.length - 1];
    }
    
    return this.EXPERIENCE_TABLE[level];
  }
}

// Initialize experience table on module load using formula: 35 * level^2.2
for (let level = 2; level <= Levels['MAX_LEVEL']; level++) {
  Levels['EXPERIENCE_TABLE'][level] = Math.floor(35 * Math.pow(level, 2.2));
}
