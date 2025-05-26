import { CollisionGroup, Quaternion } from 'hytopia';
import type { Vector3Like } from 'hytopia';

export const INVISIBLE_WALL_COLLISION_GROUP = CollisionGroup.GROUP_1;

export const INVISIBLE_WALLS = [
  { // Main entrance (south door)
    position: { x: 2.5, y: 1, z: 25},
    halfExtents: { x: 1, y: 5, z: 0.5 },
  },
  { // Main entrance (south window)
    position: { x: -4, y: 1, z: 25},
    halfExtents: { x: 1, y: 5, z: 0.5 },
  },
  { // Main entrance (east window)
    position: { x: 13, y: 1, z: 22 },
    halfExtents: { x: 0.5, y: 5, z: 1 },
  },
  { // Main entrance (north window)
    position: { x: 8, y: 1, z: 15 },
    halfExtents: { x: 1, y: 5, z: 0.5 },
  },
  { // Theater (south window)
    position: { x: -8, y: 1, z: 12},
    halfExtents: { x: 1, y: 5, z: 0.5 },
  },
  { // Parlor (south window)
    position: { x: -22, y: 1, z: 16},
    halfExtents: { x: 1, y: 5, z: 0.5 },
  },
  { // Parlor (north window)
    position: { x: -26, y: 1, z: -2},
    halfExtents: { x: 1, y: 5, z: 0.5 },
  },
  { // Dining Hall (south window)
    position: { x: 31, y: 1, z: 15},
    halfExtents: { x: 1, y: 5, z: 0.5 },
  },
  { // Dining Hall (north window)
    position: { x: 31, y: 1, z: -2},
    halfExtents: { x: 1.5, y: 5, z: 0.5 },
  },
  { // Art Gallery (north window)
    position: { x: 26, y: 1, z: -26},
    halfExtents: { x: 2.5, y: 5, z: 0.5 },
  },
  { // Kitchen (west window 1)
    position: { x: -29, y: 1, z: -18 },
    halfExtents: { x: 0.5, y: 5, z: 1.5 },
  },
  { // Kitchen (west window 2)
    position: { x: -29, y: 1, z: -23 },
    halfExtents: { x: 0.5, y: 5, z: 1.5 },
  }
]

export const PURCHASE_BARRIERS = [
  {
    name: 'Theater Room (South)',
    removalPrice: 300,
    position: { x: 2.5, y: 1.5, z: 15 },
    rotation: Quaternion.fromEuler(0, 0, 0),
    width: 5,
    unlockIds: [ 'theater' ],
  },
  {
    name: 'Parlor (South)',
    removalPrice: 75,
    position: { x: -8, y: 1.5, z: 18.5 },
    rotation: Quaternion.fromEuler(0, 90, 0),
    width: 3,
    unlockIds: [ 'parlor' ],
  },
  {
    name: 'Dining Hall (South)',
    removalPrice: 75,
    position: { x: 13, y: 1.5, z: 18.5 },
    rotation: Quaternion.fromEuler(0, 90, 0),
    width: 3,
    unlockIds: [ 'dining' ],
  },
  {
    name: 'Theater Room (West)',
    removalPrice: 250,
    position: { x: -15, y: 1.5, z: 3 },
    rotation: Quaternion.fromEuler(0, 90, 0),
    width: 5,
    unlockIds: [ 'theater', 'parlor' ],
  },
  {
    name: 'Theater Room (East)',
    removalPrice: 250,
    position: { x: 19, y: 1.5, z: 3 },
    rotation: Quaternion.fromEuler(0, 90, 0),
    width: 5,
    unlockIds: [ 'theater', 'dining' ],
  },
  {
    name: 'Art Gallery (South)',
    removalPrice: 500,
    position: { x: 26.5, y: 1.5, z: -2 },
    rotation: Quaternion.fromEuler(0, 0, 0),
    width: 5,
    unlockIds: [ 'gallery', 'dining' ],
  },
  {
    name: 'Kitchen (South)',
    removalPrice: 500,
    position: { x: -22, y: 1.5, z: -2 },
    rotation: Quaternion.fromEuler(0, 0, 0),
    width: 5,
    unlockIds: [ 'kitchen', 'parlor' ],
  },
  {
    name: 'Vault',
    removalPrice: 1000,
    position: { x: 0.5, y: 1.5, z: -26 },
    rotation: Quaternion.fromEuler(0, 0, 0),
    width: 3,
    unlockIds: [ 'vault' ],
  },
  {
    name: 'Treasure Room (West)',
    removalPrice: 75,
    position: { x: -15, y: 1.5, z: -19 },
    rotation: Quaternion.fromEuler(0, 90, 0),
    width: 5,
    unlockIds: [ 'treasure', 'kitchen' ],
  },
  {
    name: 'Treasure Room (East)',
    removalPrice: 75,
    position: { x: 20, y: 1.5, z: -19 },
    rotation: Quaternion.fromEuler(0, 90, 0),
    width: 5,
    unlockIds: [ 'treasure', 'gallery' ],
  },
]

export const WEAPON_CRATES = [
  {
    name: 'Rusty Weapon Crate',
    position: { x: -3, y: 1.5, z: 16.5 },
    rotation: Quaternion.fromEuler(0, 0, 0),
    price: 100,
    rollableWeaponIds: [ 'pistol', 'shotgun', 'ar15' ],
  },
  {
    name: 'Rusty Weapon Crate',
    position: { x: 10.5, y: 1.5, z: 16.5 },
    rotation: Quaternion.fromEuler(0, 0, 0),
    price: 100,
    rollableWeaponIds: [ 'pistol', 'shotgun', 'ar15' ],
  },
  {
    name: 'Weapon Crate',
    position: { x: -27.5, y: 1.5, z: 2.5 },
    rotation: Quaternion.fromEuler(0, 90, 0),
    price: 200,
    rollableWeaponIds: [ 'shotgun', 'ar15', 'auto-pistol', ],
  },
  {
    name: 'Weapon Crate',
    position: { x: 22, y: 1.5, z: 7 },
    rotation: Quaternion.fromEuler(0, -45, 0),
    price: 200,
    rollableWeaponIds: [ 'shotgun', 'ar15', 'auto-pistol', ],
  },
  {
    name: 'Weapon Crate',
    position: { x: -23.5, y: 1.5, z: -24.5 },
    rotation: Quaternion.fromEuler(0, 0, 0),
    price: 200,
    rollableWeaponIds: [ 'shotgun', 'ar15', 'auto-pistol', ],
  },
  {
    name: 'Elite Weapon Crate',
    position: { x: 31, y: 1.5, z: -14.5 },
    rotation: Quaternion.fromEuler(0, 45, 0),
    price: 300,
    rollableWeaponIds: [ 'ak47', 'ar15', 'auto-pistol', 'auto-shotgun', ],
  },
  {
    name: 'Elite Weapon Crate',
    position: { x: 2.5, y: 2.5, z: -4.5 },
    rotation: Quaternion.fromEuler(0, 0, 0),
    price: 300,
    rollableWeaponIds: [ 'ak47', 'ar15', 'auto-pistol', 'auto-shotgun', ],
  },
  {
    name: 'Elite Weapon Crate',
    position: { x: 0.5, y: 1.5, z: -29.5 },
    rotation: Quaternion.fromEuler(0, 0, 0),
    price: 300,
    rollableWeaponIds: [ 'ak47', 'ar15', 'auto-pistol', 'auto-shotgun', ],
  },
]

export const ENEMY_SPAWN_POINTS: Record<string, Vector3Like[]> = {
  start: [
    { x: -20, y: 3, z: 34 },
    { x: 12, y: 3, z: 36 },
    { x: 26, y: 3, z: 20 },
    { x: 17, y: 3, z: 13.5 },
  ],
  theater: [
    { x: -13.5, y: 3, z: 10 },
  ],
  parlor: [
    { x: -36, y: 3, z: 23 },
    { x: -35, y: 3, z: -5 },
  ],
  dining: [
    { x: 46, y: 3, z: 16 },
    { x: 41, y: 3, z: -5 },
  ],
  gallery: [
    { x: 35, y: 3, z: -39 },
    { x: 12, y: 3, z: -40 },
  ],
  kitchen: [
    { x: -28, y: 3, z: -32 },
    { x: -40, y: 3, z: -5 },
  ],
  treasure: [
    { x: -13, y: 3, z: -27 },
    { x: 0, y: 3, z: -37 },
  ],
};
