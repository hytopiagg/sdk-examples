import { Vector3, World, SimpleEntityController, PlayerEntity } from "hytopia";
import { BaseAgent } from "../BaseAgent";
import type { AgentBehavior } from "../BaseAgent";
import { Player } from "hytopia";

interface Node {
	x: number;
	z: number;
	g: number; // Cost from start
	h: number; // Heuristic (estimated cost to end)
	f: number; // Total cost (g + h)
	parent?: Node;
}

/**
 * This is a simple implementation of A* pathfinding for Agents.
 * There are many simplifications here, like no diagonal movement, sketchy jump code, and no path smoothing.
 * It is good enough for a simple demo like this, but in a more polished game you would want to use a more robust pathfinding library or implementation.
 */
export class PathfindingBehavior implements AgentBehavior {
	private path: Vector3[] = [];
	private currentPathIndex: number = 0;
	private targetEntity?: BaseAgent;
	private moveSpeed = 4;
	private isJumping = false; // Track if we're currently in a jump
	private jumpCooldown = 0; // Cooldown timer for jumps

	onUpdate(agent: BaseAgent, world: World): void {
		if (!(agent.controller instanceof SimpleEntityController)) return;

		// Decrease jump cooldown
		if (this.jumpCooldown > 0) {
			this.jumpCooldown--;
		}

		if (this.path.length > 0 && this.currentPathIndex < this.path.length) {
			const nextPoint = this.path[this.currentPathIndex];
			const distance = Vector3.fromVector3Like(agent.position).distance(
				nextPoint
			);

			// Check if we're close enough to final destination
			const isNearEnd = this.currentPathIndex >= this.path.length - 3;
			if (isNearEnd) {
				const finalPoint = this.path[this.path.length - 1];
				const distanceToFinal = Vector3.fromVector3Like(
					agent.position
				).distance(finalPoint);

				if (distanceToFinal < 3) {
					agent.stopModelAnimations(["walk_upper", "walk_lower"]);
					agent.startModelLoopedAnimations(["idle_upper", "idle_lower"]);
					if (this.targetEntity) {
						agent.controller.face(
							this.targetEntity.position,
							this.moveSpeed * 2
						);
					}
					agent.handleEnvironmentTrigger(
						`You have arrived at your destination.`
					);
					this.targetEntity = undefined;
					this.path = [];
					this.currentPathIndex = 0;
					return;
				}
			}

			if (distance < 0.5) {
				this.currentPathIndex++;
				this.isJumping = false; // Reset jump state when reaching waypoint
				if (this.currentPathIndex >= this.path.length) {
					if (this.targetEntity) {
						agent.controller.face(
							this.targetEntity.position,
							this.moveSpeed * 2
						);
						agent.stopModelAnimations(["walk_upper", "walk_lower"]);
						agent.startModelLoopedAnimations(["idle_upper", "idle_lower"]);

						this.targetEntity = undefined;
					}
					agent.handleEnvironmentTrigger(
						`You have arrived at your destination.`
					);
					return;
				}
			} else {
				const yDiff = nextPoint.y - agent.position.y;
				const horizontalDistance = Math.sqrt(
					Math.pow(nextPoint.x - agent.position.x, 2) +
						Math.pow(nextPoint.z - agent.position.z, 2)
				);

				if (
					yDiff > 0.5 &&
					horizontalDistance < 1.5 &&
					!this.isJumping &&
					this.jumpCooldown === 0
				) {
					const direction = Vector3.fromVector3Like(nextPoint)
						.subtract(Vector3.fromVector3Like(agent.position))
						.normalize();
					direction.y = 10 * agent.mass;
					agent.applyImpulse(direction);
					this.isJumping = true;
					this.jumpCooldown = 30;
				}

				agent.controller.move(nextPoint, this.moveSpeed, {
					moveIgnoreAxes: yDiff >= 0 ? { y: true } : undefined,
				});
				agent.controller.face(nextPoint, this.moveSpeed * 2);
				agent.startModelLoopedAnimations(["walk_upper", "walk_lower"]);
			}
		} else if (this.path.length > 0) {
			this.path = [];
			this.currentPathIndex = 0;
			this.isJumping = false;
			this.jumpCooldown = 0;
			agent.stopModelAnimations(["walk_upper", "walk_lower"]);
			agent.startModelLoopedAnimations(["idle_upper", "idle_lower"]);
		}
	}

	private isWalkable(
		world: World,
		x: number,
		z: number,
		y: number,
		startY?: number
	): { walkable: boolean; y?: number; canJumpFrom?: boolean } {
		const maxDropHeight = 3;
		const maxStepUp = startY !== undefined ? 1 : 1.5;
		const legY = Math.floor(y);

		if (startY !== undefined && legY > startY + 2) {
			return { walkable: false };
		}

		for (
			let floorY = Math.min(
				legY + maxStepUp,
				startY ? startY + 2 : Infinity
			);
			floorY >= legY - maxDropHeight && floorY >= 0;
			floorY--
		) {
			// Check floor block
			const blockBelow = world.chunkLattice.hasBlock({
				x: Math.floor(x),
				y: floorY - 1,
				z: Math.floor(z),
			});

			if (!blockBelow) continue;

			// Check leg and head space
			const blockLeg = world.chunkLattice.hasBlock({
				x: Math.floor(x),
				y: floorY,
				z: Math.floor(z),
			});
			const blockHead = world.chunkLattice.hasBlock({
				x: Math.floor(x),
				y: floorY + 1,
				z: Math.floor(z),
			});

			// Check extra block above for jump clearance
			const blockJump = world.chunkLattice.hasBlock({
				x: Math.floor(x),
				y: floorY + 2,
				z: Math.floor(z),
			});

			// If both leg and head space are clear
			if (!blockLeg && !blockHead) {
				return {
					walkable: true,
					y: floorY,
					// Can only jump from here if we have the extra block of clearance
					canJumpFrom: !blockJump,
				};
			}
		}
		return { walkable: false };
	}

	private heuristic(x1: number, z1: number, x2: number, z2: number): number {
		return Math.abs(x1 - x2) + Math.abs(z1 - z2); // Manhattan distance
	}

	getState(): string {
		// We want to return a message depending on whether or not we are currently pathfinding
		if (this.path.length > 0) {
			const distance = Vector3.fromVector3Like(
				this.path[this.path.length - 1]
			).distance(this.path[0]);
			return `Pathfinding (${distance.toFixed(1)}m remaining)`;
		} else {
			return "Not currently pathfinding";
		}
	}

	private findPath(
		agent: BaseAgent,
		world: World,
		start: Vector3,
		end: Vector3
	): Vector3[] {
		const openSet: Node[] = [];
		const closedSet: Set<string> = new Set();
		const startY = Math.floor(start.y);

		interface NodeWithY extends Node {
			y: number;
		}

		const startNode: NodeWithY = {
			x: Math.floor(start.x),
			z: Math.floor(start.z),
			y: Math.floor(start.y),
			g: 0,
			h: this.heuristic(start.x, start.z, end.x, end.z),
			f: 0,
		};

		openSet.push(startNode);

		while (openSet.length > 0) {
			let current = openSet.reduce((min, node) =>
				node.f < min.f ? node : min
			) as NodeWithY;

			if (
				Math.abs(current.x - end.x) < 1 &&
				Math.abs(current.z - end.z) < 1
			) {
				// Path found, reconstruct it
				const path: Vector3[] = [];
				while (current) {
					const walkableCheck = this.isWalkable(
						world,
						current.x,
						current.z,
						current.y,
						startY
					);
					path.unshift(
						new Vector3(
							current.x + 0.5,
							walkableCheck.y! + 1,
							current.z + 0.5
						)
					);
					current = current.parent! as NodeWithY;
				}
				return path;
			}

			openSet.splice(openSet.indexOf(current), 1);
			closedSet.add(`${current.x},${current.z}`);

			// Only cardinal directions - no diagonals
			const neighbors = [
				{ x: current.x + 1, z: current.z }, // East
				{ x: current.x - 1, z: current.z }, // West
				{ x: current.x, z: current.z + 1 }, // North
				{ x: current.x, z: current.z - 1 }, // South
			];

			for (const neighbor of neighbors) {
				if (closedSet.has(`${neighbor.x},${neighbor.z}`)) continue;

				const walkableCheck = this.isWalkable(
					world,
					neighbor.x,
					neighbor.z,
					current.y,
					startY
				);

				if (!walkableCheck.walkable) continue;
				if (walkableCheck.y! > startY + 2) continue;

				// Calculate movement cost
				let movementCost = 1;

				// Add significant cost for moving up (jumping)
				const heightDiff = walkableCheck.y! - current.y;
				if (heightDiff > 0) {
					// Check if we can actually jump from the current position
					const currentPos = this.isWalkable(
						world,
						current.x,
						current.z,
						current.y,
						startY
					);

					if (!currentPos.canJumpFrom) {
						movementCost += 1000;
					} else {
						movementCost += heightDiff * 5;
					}
				}

				const g = current.g + movementCost;
				const h = this.heuristic(neighbor.x, neighbor.z, end.x, end.z);
				const f = g + h;

				const existingNode = openSet.find(
					(n) => n.x === neighbor.x && n.z === neighbor.z
				);

				if (!existingNode || g < existingNode.g) {
					const newNode: NodeWithY = {
						x: neighbor.x,
						z: neighbor.z,
						y: walkableCheck.y!,
						g,
						h,
						f,
						parent: current,
					};

					if (!existingNode) {
						openSet.push(newNode);
					} else {
						Object.assign(existingNode, newNode);
					}
				}
			}
		}
		return [];
	}

	onToolCall(
		agent: BaseAgent,
		world: World,
		toolName: string,
		args: any,
		player?: Player
	): string | void {
		if (toolName === "pathfindTo") {
			let targetPos: Vector3;
			let targetName: string;

			if (args.coordinates) {
				// Use provided coordinates
				targetPos = new Vector3(
					args.coordinates.x,
					args.coordinates.y,
					args.coordinates.z
				);
			} else {
				// Find target entity
				console.log("Pathfinding to", args.targetName);
				const target = world.entityManager
					.getAllEntities()
					.find(
						(e) =>
							(e instanceof BaseAgent &&
								e.name === args.targetName) ||
							(e instanceof PlayerEntity &&
								e.player.username === args.targetName)
					);

				if (!target) {
					return;
				}

				if (target instanceof BaseAgent) {
					this.targetEntity = target;
				}
				targetPos = Vector3.fromVector3Like(target.position);
				targetName =
					target instanceof PlayerEntity
						? target.player.username
						: target.name;
			}

			const startPos = Vector3.fromVector3Like(agent.position);

			// Check if start and end are walkable
			const startWalkable = this.isWalkable(
				world,
				Math.floor(startPos.x),
				Math.floor(startPos.z),
				Math.floor(startPos.y)
			);

			const endWalkable = this.isWalkable(
				world,
				Math.floor(targetPos.x),
				Math.floor(targetPos.z),
				Math.floor(targetPos.y)
			);

			this.path = this.findPath(agent, world, startPos, targetPos);

			if (this.path.length === 0) {
				return "No valid path found to target.";
			}

			this.currentPathIndex = 0;

			return "Started pathfinding. The system will notify you when you arrive.";
		}
	}

	getPromptInstructions(): string {
		return `
To navigate to a target, use:
<action type="pathfindTo">
{
	"targetName": "Name of character or player to pathfind to",  // Optional
	"coordinates": {  // Optional
		"x": number,
		"y": number, 
		"z": number
	}
}
</action>

Returns:
- Success message if pathfinding is successfully started
- Error message if no path can be found.

The Pathfinding procedure will result in a later message when you arrive at your destination.

You must provide either targetName OR coordinates.`;
	}
}
