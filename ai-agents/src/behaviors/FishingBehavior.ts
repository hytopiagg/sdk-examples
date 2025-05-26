import { Vector3, World } from "hytopia";
import { BaseAgent, type AgentBehavior } from "../BaseAgent";

interface FishResult {
	success: boolean;
	size?: "small" | "medium" | "large";
}

/**
 * This is a simple implementation of a fishing behavior for Agents.
 * It does not include animations or any other fancy features.
 * Agents can call actions like `cast_rod` to start fishing, and the environment will trigger a callback when the fishing is complete.
 * This is a simple example of ENVIRONMENT type messages for Agents.
 */
export class FishingBehavior implements AgentBehavior {
	private isFishing: boolean = false;
	private readonly PIER_LOCATION = new Vector3(31.5, 3, 59.5);
	private readonly FISHING_RANGE = 5; // meters
	private readonly CATCH_PROBABILITIES = {
		nothing: 0.4,
		small: 0.3,
		medium: 0.2,
		large: 0.1,
	};

	onUpdate(agent: BaseAgent, world: World): void {
		// Could add ambient fishing animations here if needed
	}

	private isNearPier(agent: BaseAgent): boolean {
		const distance = Vector3.fromVector3Like(agent.position).distance(
			this.PIER_LOCATION
		);
		return distance <= this.FISHING_RANGE;
	}

	private rollForFish(): FishResult {
		const roll = Math.random();
		let cumulative = 0;

		// Check for no catch
		cumulative += this.CATCH_PROBABILITIES.nothing;
		if (roll < cumulative) {
			return { success: false };
		}

		// Check for small fish
		cumulative += this.CATCH_PROBABILITIES.small;
		if (roll < cumulative) {
			return {
				success: true,
				size: "small",
			};
		}

		// Check for medium fish
		cumulative += this.CATCH_PROBABILITIES.medium;
		if (roll < cumulative) {
			return {
				success: true,
				size: "medium",
			};
		}

		// Must be a large fish
		return {
			success: true,
			size: "large",
		};
	}

	onToolCall(
		agent: BaseAgent,
		world: World,
		toolName: string,
		args: any
	): string | void {
		if (toolName === "cast_rod") {
			console.log("Fishing tool called");

			if (!this.isNearPier(agent)) {
				return "You need to be closer to the pier to fish!";
			}

			if (this.isFishing) {
				return "You're already fishing!";
			}

			this.isFishing = true;

			// Start fishing animation if available
			agent.stopModelAnimations(["walk_upper", "walk_lower", "run_upper", "run_lower"]);
			agent.startModelLoopedAnimations(["idle_upper", "idle_lower"]); // Could be replaced with a fishing animation

			// Simulate fishing time
			setTimeout(() => {
				this.isFishing = false;
				const result = this.rollForFish();

				if (!result.success) {
					agent.handleEnvironmentTrigger(
						"Nothing seems to be biting..."
					);
					return;
				}

				const fishDescription = `${result.size} fish`;
				agent.addToInventory({
					name: fishDescription,
					quantity: 1,
					metadata: {
						size: result.size,
					},
				});

				agent.handleEnvironmentTrigger(
					`You caught ${fishDescription}!`
				);
			}, 5000); // 5 second fishing time

			return "Casting your line...";
		} else if (toolName === "give_fish") {
			const { size, weight, target } = args;
			const fishDescription = `${size} fish`;

			if (!agent.removeFromInventory(fishDescription, 1)) {
				return "You don't have that fish anymore!";
			}

			const nearbyEntities = agent.getNearbyEntities(5);
			const targetEntity = nearbyEntities.find((e) => e.name === target);

			if (!targetEntity) {
				return `Cannot find ${target} nearby. Try getting closer to them.`;
			}

			// Add to target's inventory if it's an agent
			if (targetEntity.type === "Agent") {
				const targetAgent = world.entityManager
					.getAllEntities()
					.find(
						(e) => e instanceof BaseAgent && e.name === target
					) as BaseAgent;

				if (targetAgent) {
					targetAgent.addToInventory({
						name: fishDescription,
						quantity: 1,
						metadata: { size, weight },
					});
				}
			}

			return `Successfully gave ${fishDescription} to ${target}`;
		}
	}

	getPromptInstructions(): string {
		return `
To fish at the pier, use:
<action type="cast_rod"></action>

You must call cast_rod exactly like this, with the empty object inside the action tag.

To give a fish to another agent, use:
<action type="give_fish">
{
    size: "small" | "medium" | "large",
    target: "name of the player or agent to give the fish to"
}
</action>

You must be within 5 meters of the pier to fish.
Each attempt takes 5 seconds and has a chance to catch nothing or a fish of varying sizes.
You can only have one line in the water at a time.`;
	}

	getState(): string {
		return this.isFishing ? "Currently fishing" : "Not fishing";
	}
}
