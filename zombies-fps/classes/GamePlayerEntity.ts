import { 
  Audio,
  BaseEntityControllerEvent,
  CollisionGroup,
  DefaultPlayerEntity,
  DefaultPlayerEntityController,
  EventPayloads,
  Light,
  LightType,
  Player,
  PlayerCameraMode,
  SceneUI,
  Vector3Like,
  QuaternionLike,
  World,
  Quaternion,
  Vector3,
} from 'hytopia';

import PistolEntity from './guns/PistolEntity';

import InteractableEntity from './InteractableEntity';
import type GunEntity from './GunEntity';
import { INVISIBLE_WALL_COLLISION_GROUP } from '../gameConfig';
import GameManager from './GameManager';

const BASE_HEALTH = 100;
const REVIVE_REQUIRED_HEALTH = 50;
const REVIVE_PROGRESS_INTERVAL_MS = 1000;
const REVIVE_DISTANCE_THRESHOLD = 3;

export default class GamePlayerEntity extends DefaultPlayerEntity {
  public health: number;
  public maxHealth: number;
  public money: number;
  public downed = false;
  private _damageAudio: Audio;
  private _downedSceneUI: SceneUI;
  private _purchaseAudio: Audio;
  private _gun: GunEntity | undefined;
  private _light: Light;
  private _reviveInterval: NodeJS.Timeout | undefined;
  private _reviveDistanceVectorA: Vector3;
  private _reviveDistanceVectorB: Vector3;

  // Player entities always assign a PlayerController to the entity, so we can safely create a convenience getter
  public get playerController(): DefaultPlayerEntityController {
    return this.controller as DefaultPlayerEntityController;
  }

  public constructor(player: Player) {
    super({
      player,
      name: 'Player',
      modelUri: 'models/players/soldier-player.gltf',
      modelScale: 0.5,
    });
    
    // Prevent mouse left click from being cancelled, required
    // for auto-fire and semi-auto fire mechanics, etc.
    this.playerController.applyDirectionalMovementRotations = false;
    this.playerController.autoCancelMouseLeftClick = false;
    
    // Setup player animations
    this.playerController.idleLoopedAnimations = [ 'idle_lower' ];
    this.playerController.interactOneshotAnimations = [];
    this.playerController.walkLoopedAnimations = ['walk_lower' ];
    this.playerController.runLoopedAnimations = [ 'run_lower' ];

    this.playerController.on(BaseEntityControllerEvent.TICK_WITH_PLAYER_INPUT, this._onTickWithPlayerInput);
    
    // Setup UI
    this.player.ui.load('ui/index.html');

    // Setup first person camera
    this.player.camera.setMode(PlayerCameraMode.FIRST_PERSON);
    this.player.camera.setModelHiddenNodes([ 'head', 'neck', 'torso', 'leg_right', 'leg_left' ]);
    this.player.camera.setOffset({ x: 0, y: 0.5, z: 0 });
  
    // Set base stats
    this.health = BASE_HEALTH;
    this.maxHealth = BASE_HEALTH;
    this.money = 0;

    // Setup damage audio
    this._damageAudio = new Audio({
      attachedToEntity: this,
      uri: 'audio/sfx/player-hurt.mp3',
      loop: false,
      volume: 0.7,
    });

    // Setup purchase audio
    this._purchaseAudio = new Audio({
      attachedToEntity: this,
      uri: 'audio/sfx/purchase.mp3',
      loop: false,
      volume: 1,
    });

    // Setup downed scene UI
    this._downedSceneUI = new SceneUI({
      attachedToEntity: this,
      templateId: 'downed-player',
      offset: { x: 0, y: 0.5, z: 0 },
    });

    // Setup light
    this._light = new Light({
      angle: Math.PI / 4 + 0.1,
      penumbra: 0.03,
      attachedToEntity: this,
      trackedEntity: this,
      type: LightType.SPOTLIGHT,
      intensity: 5,
      offset: { x: 0, y: 0, z: 0.1 }, 
      color: { r: 255, g: 255, b: 255 },
    });

    // Create reusable vector3 for revive distance calculations
    this._reviveDistanceVectorA = new Vector3(0, 0, 0);
    this._reviveDistanceVectorB = new Vector3(0, 0, 0);
  }

  public override spawn(world: World, position: Vector3Like, rotation?: QuaternionLike): void {
    super.spawn(world, position, rotation);

    // Prevent players from colliding, setup appropriate collision groups for invisible walls, etc.
    this.setCollisionGroupsForSolidColliders({
      belongsTo: [ CollisionGroup.PLAYER ],
      collidesWith: [ CollisionGroup.BLOCK, CollisionGroup.ENTITY, CollisionGroup.ENTITY_SENSOR, INVISIBLE_WALL_COLLISION_GROUP ],
    });

    // Give player a pistol.
    this.equipGun(new PistolEntity({ parent: this }));

    // Spawn light
    this._light.spawn(world);

    // Start auto heal ticker
    this._autoHealTicker();

    // Reset any prior UI from respawn
    this._updatePlayerUIHealth();
    this._updatePlayerUIMoney();
  }

  public addMoney(amount: number) {
    this.money += amount;
    this._updatePlayerUIMoney();
  }

  public equipGun(gun: GunEntity) {
    if (!this.world) {
      return;
    }

    if (gun.isSpawned) {
      // no support for equipping already spawned guns atm, like pickup up guns etc, 
      // but would be easy to add. Not needed for this game though.
      return console.warn('Cannot equip already spawned gun!');
    }

    if (this._gun) { // despawn old gun
      this._gun.despawn();
    }

    this._gun = gun;
    this._gun.spawn(this.world, { x: 0, y: 0, z: -0.2 }, Quaternion.fromEuler(-90, 0, 0));
  }

  public spendMoney(amount: number): boolean {
    if (!this.world || this.money < amount) {
      return false;
    }

    this.money -= amount;
    this._updatePlayerUIMoney();
    this._purchaseAudio.play(this.world, true);
    return true;
  }

  public takeDamage(damage: number) {
    if (!this.isSpawned || !this.world || this.downed) {
      return;
    }

    const healthAfterDamage = this.health - damage;
    if (this.health > 0 && healthAfterDamage <= 0) {
      this._setDowned(true);
    }

    this.health = Math.max(healthAfterDamage, 0);
    
    this._updatePlayerUIHealth();

    // randomize the detune for variation each hit
    this._damageAudio.setDetune(-200 + Math.random() * 800);
    this._damageAudio.play(this.world, true);
  }

  public progressRevive(byPlayer: GamePlayerEntity) {
    if (!this.world) {
      return;
    }

    clearTimeout(this._reviveInterval);

    this._reviveInterval = setTimeout(() => {
      this._reviveDistanceVectorA.set([ this.position.x, this.position.y, this.position.z ]);
      this._reviveDistanceVectorB.set([ byPlayer.position.x, byPlayer.position.y, byPlayer.position.z ]);
      const distance = this._reviveDistanceVectorA.distance(this._reviveDistanceVectorB);

      if (distance > REVIVE_DISTANCE_THRESHOLD) {
        return;
      }

      this.health += 10;
      this._updatePlayerUIHealth();

      this._downedSceneUI.setState({
        progress: (this.health / REVIVE_REQUIRED_HEALTH) * 100,
      });

      if (this.health >= REVIVE_REQUIRED_HEALTH) {
        this._setDowned(false);
      } else {
        this.progressRevive(byPlayer);
      }
    }, REVIVE_PROGRESS_INTERVAL_MS);
  }

  private _onTickWithPlayerInput = (payload: EventPayloads[BaseEntityControllerEvent.TICK_WITH_PLAYER_INPUT]) => {
    const { input } = payload;

    if (!this._gun) {
      return;
    }
    
    if (input.ml && !this.downed) {
      this._gun.shoot();
    }

    if (input.r && !this.downed) {
      this._gun.reload();
      input.r = false;
    }

    if (input.e) {
      this._interactRaycast();
      input.e = false;
    }
  }

  private _setDowned(downed: boolean) {
    if (!this.world) {
      return;
    }

    this.downed = downed;

    if (downed) {
      this.health = 0;
      this._updatePlayerUIHealth();
    }

    this.playerController.idleLoopedAnimations = downed ? [ 'sleep' ] : [ 'idle_lower' ];
    this.playerController.walkLoopedAnimations = downed ? [ 'crawling' ] : [ 'walk_lower' ];
    this.playerController.runLoopedAnimations = downed ? [ 'crawling' ] : [ 'run_lower' ];
    this.playerController.runVelocity = downed ? 1 : 8;
    this.playerController.walkVelocity = downed ? 1 : 4;
    this.playerController.jumpVelocity = downed ? 0 : 10;

    if (!downed && this._gun) {
      this._gun.setParentAnimations();
    }

    if (downed) {
      this._downedSceneUI.setState({ progress: 0 })
      this._downedSceneUI.load(this.world);
      this.world.chatManager.sendPlayerMessage(this.player, 'You are downed! A teammate can still revive you!', 'FF0000');

      GameManager.instance.checkEndGame();
    } else {
      this._downedSceneUI.unload();
      this.world.chatManager.sendPlayerMessage(this.player, 'You are back up! Thank your team & fight the horde!', '00FF00');
    }
  }

  private _interactRaycast() {
    if (!this.world) {
      return;
    }

    if (this.downed) {
      return this.world.chatManager.sendPlayerMessage(this.player, 'You are downed! You cannot revive others or make purchases!', 'FF0000');
    }

    // Get raycast direction from player camera
    const origin = {
      x: this.position.x,
      y: this.position.y + this.player.camera.offset.y,
      z: this.position.z,
    };
    const direction = this.player.camera.facingDirection;
    const length = 4;

    const raycastHit = this.world.simulation.raycast(origin, direction, length, {
      filterExcludeRigidBody: this.rawRigidBody, // prevent raycast from hitting the player
    });

    const hitEntity = raycastHit?.hitEntity;

    if (!hitEntity) {
      return;
    }

    if (hitEntity instanceof InteractableEntity) {
      hitEntity.interact(this);
    }

    if (hitEntity instanceof GamePlayerEntity && hitEntity.downed) {
      hitEntity.progressRevive(this);
    }
  }

  private _updatePlayerUIMoney() {
    this.player.ui.sendData({ type: 'money', money: this.money });
  }

  private _updatePlayerUIHealth() {
    this.player.ui.sendData({ type: 'health', health: this.health, maxHealth: this.maxHealth });
  }

  private _autoHealTicker() {
    setTimeout(() => {
      if (!this.isSpawned) {
        return;
      }

      if (!this.downed && this.health < this.maxHealth) {
        this.health += 1;
        this._updatePlayerUIHealth();
      }

      this._autoHealTicker();
    }, 1000);
  }
}

