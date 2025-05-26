import {
	Player,
	PlayerEntity,
	SimpleEntityController,
	Vector3,
	World,
} from "hytopia";
import type { AgentBehavior, BaseAgent } from "../BaseAgent";
import { PlayerManager } from "hytopia";

/**
 * This is a simple implementation of a follow behavior for Agents. It includes basic animation handling, jump detection, and running vs walking.
 * Agents can call actions like `follow` to start following a player.
 *
 * This provides a simple example of how behaviours have State, which get passed to the LLM.
 */
export class FollowBehavior implements AgentBehavior {
	private playerToFollow: Player | null = null;
	private followDistance = 2;
	private speed = 3;
	private runSpeed = 6;
	private runThreshold = 5;
	private isJumping = false;
	private jumpCooldown = 0;

	private needsToJump(
		world: World,
		currentPos: Vector3,
		targetPos: Vector3
	): boolean {
		// Check block directly in front of us
		const direction = new Vector3(
			targetPos.x - currentPos.x,
			0,
			targetPos.z - currentPos.z
		).normalize();

		// Check one block ahead
		const checkPos = {
			x: Math.floor(currentPos.x + direction.x),
			y: Math.floor(currentPos.y),
			z: Math.floor(currentPos.z + direction.z),
		};

		// Check if there's a block at head or leg level
		const blockAtLegs = world.chunkLattice.hasBlock(checkPos);
		const blockAtHead = world.chunkLattice.hasBlock({
			...checkPos,
			y: checkPos.y + 1,
		});

		// Check if there's space to jump into
		const blockAboveHead = world.chunkLattice.hasBlock({
			...checkPos,
			y: checkPos.y + 2,
		});

		return (blockAtLegs || blockAtHead) && !blockAboveHead;
	}

	onUpdate(agent: BaseAgent, world: World): void {
		if (!this.playerToFollow) return;
		if (!(agent.controller instanceof SimpleEntityController)) return;

		// Decrease jump cooldown
		if (this.jumpCooldown > 0) {
			this.jumpCooldown--;
		}

		const targetEntity = world.entityManager
			.getPlayerEntitiesByPlayer(this.playerToFollow)
			.at(0);

		if (!targetEntity) return;

		const dx = targetEntity.position.x - agent.position.x;
		const dz = targetEntity.position.z - agent.position.z;
		const distance = Math.sqrt(dx * dx + dz * dz);
		const yDiff = targetEntity.position.y - agent.position.y;

		if (Math.abs(distance - this.followDistance) > 0.5) {
			const isRunning = distance > this.runThreshold;
			agent.startModelLoopedAnimations([isRunning ? "run_upper" : "walk_upper", isRunning ? "run_lower" : "walk_lower"]);

			const angle = Math.atan2(dz, dx);
			const targetPos = new Vector3(
				targetEntity.position.x - Math.cos(angle) * this.followDistance,
				targetEntity.position.y,
				targetEntity.position.z - Math.sin(angle) * this.followDistance
			);

			// Check if we need to jump
			if (
				!this.isJumping &&
				this.jumpCooldown === 0 &&
				this.needsToJump(
					world,
					Vector3.fromVector3Like(agent.position),
					targetPos
				)
			) {
				const direction = Vector3.fromVector3Like(targetPos)
					.subtract(Vector3.fromVector3Like(agent.position))
					.normalize();
				direction.y = 10 * agent.mass;
				agent.applyImpulse(direction);
				this.isJumping = true;
				this.jumpCooldown = 30;
			}

			(agent.controller as SimpleEntityController).move(
				targetPos,
				isRunning ? this.runSpeed : this.speed,
				{ moveIgnoreAxes: yDiff >= 0 ? { y: true } : undefined }
			);
			agent.controller.face(targetEntity.position, this.speed * 2);
		} else {
			agent.stopModelAnimations(["walk_upper", "walk_lower", "run_upper", "run_lower"]);
			agent.startModelLoopedAnimations(["idle_upper", "idle_lower"]);
			this.isJumping = false; // Reset jump state when we're close enough
		}
	}

	getState(): string {
		if (this.playerToFollow) {
			return "You are following " + this.playerToFollow.username;
		}
		return "You are not following anyone";
	}

	onToolCall(
		agent: BaseAgent,
		world: World,
		toolName: string,
		args: any
	): void {
		if (toolName === "follow") {
			if (args.following) {
				const allPlayers = PlayerManager.instance.getConnectedPlayers();

				console.log(
					"All player usernames:",
					allPlayers.map((p) => p.username)
				);
				const player = allPlayers.find(
					(p) => p.username === args.targetPlayer
				);
				if (player) {
					this.playerToFollow = player;
					console.log("Following player:", player.username);
				} else {
					console.log("Could not find player:", args.targetPlayer);
				}
			} else {
				this.playerToFollow = null;
				console.log("Stopped following all players");
			}
		}
	}

	getPromptInstructions(): string {
		return `
To follow a player, use:
<action type="follow">
{
	"targetPlayer": "Username of player to follow",
	"following": true  // true to start following, false to stop
}
</action>`;
	}
}
