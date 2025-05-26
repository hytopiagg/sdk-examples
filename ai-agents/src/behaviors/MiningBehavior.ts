import { Vector3, World } from "hytopia";
import { BaseAgent, type AgentBehavior } from "../BaseAgent";

interface MiningResult {
	success: boolean;
	type?:
		| "coal"
		| "iron"
		| "silver"
		| "gold"
		| "diamond"
		| "mysterious_crystal";
	quantity?: number;
}

interface MineralInfo {
	chance: number;
	quantity: [number, number]; // [min, max]
	value: number; // For trading purposes
}

/**
 * This is a simple implementation of a mining behavior for Agents.
 * It does not include animations or any other fancy features.
 * Agents can call actions like `mine` to start mining, and the environment will trigger a callback when the mining is complete.
 * This is a simple example of ENVIRONMENT type messages for Agents.
 */
export class MiningBehavior implements AgentBehavior {
	private isMining: boolean = false;
	private readonly CAVE_LOCATION = new Vector3(-30, 1, 15);
	private readonly MINING_RANGE = 15; // meters from cave entrance
	private inventory: Record<string, number> = {
		coal: 0,
		iron: 0,
		silver: 0,
		gold: 0,
		diamond: 0,
		mysterious_crystal: 0,
	};

	private readonly MINERALS: Record<string, MineralInfo> = {
		coal: { chance: 0.4, quantity: [1, 5], value: 1 },
		iron: { chance: 0.3, quantity: [1, 3], value: 2 },
		silver: { chance: 0.15, quantity: [1, 2], value: 5 },
		gold: { chance: 0.1, quantity: [1, 1], value: 10 },
		diamond: { chance: 0.04, quantity: [1, 1], value: 25 },
		mysterious_crystal: { chance: 0.01, quantity: [1, 1], value: 50 },
	};

	onUpdate(agent: BaseAgent, world: World): void {
		// Could add ambient mining animations here
	}

	private isNearCave(agent: BaseAgent): boolean {
		const distance = Vector3.fromVector3Like(agent.position).distance(
			this.CAVE_LOCATION
		);
		return distance <= this.MINING_RANGE;
	}

	private rollForMinerals(): MiningResult {
		const roll = Math.random();
		let cumulative = 0;

		// First check for no find
		const noFindChance = 0.3; // 30% chance of finding nothing
		if (roll < noFindChance) {
			return { success: false };
		}

		// Roll for each mineral type
		for (const [type, info] of Object.entries(this.MINERALS)) {
			cumulative += info.chance;
			if (roll < cumulative) {
				const quantity = Math.floor(
					Math.random() * (info.quantity[1] - info.quantity[0] + 1) +
						info.quantity[0]
				);
				return {
					success: true,
					type: type as MiningResult["type"],
					quantity,
				};
			}
		}

		return { success: false };
	}

	onToolCall(
		agent: BaseAgent,
		world: World,
		toolName: string,
		args: any
	): string | void {
		if (toolName === "mine") {
			console.log("Mining tool called");

			if (!this.isNearCave(agent)) {
				return "You need to be closer to the cave to mine!";
			}

			if (this.isMining) {
				return "You're already mining!";
			}

			this.isMining = true;

			// Start mining animation if available
			agent.stopModelAnimations(["walk_upper", "walk_lower", "run_upper", "run_lower"]);
			agent.startModelLoopedAnimations(["idle_upper", "idle_lower"]); // Could be replaced with mining animation

			// Simulate mining time
			setTimeout(() => {
				this.isMining = false;
				const result = this.rollForMinerals();

				if (!result.success) {
					agent.handleEnvironmentTrigger(
						"Just found some worthless rocks..."
					);
					return;
				}

				if (result.type && result.quantity) {
					const mineralName = result.type.replace("_", " ");
					agent.addToInventory({
						name: mineralName,
						quantity: result.quantity,
						metadata: {
							value: this.MINERALS[result.type].value,
						},
					});

					let message = `Found ${result.quantity} ${mineralName}!`;
					if (result.type === "mysterious_crystal") {
						message +=
							" *mutters* These crystals... there's something strange about them...";
					}

					agent.handleEnvironmentTrigger(message);
				}
			}, 30000); // 30 second mining time

			return "Mining away...";
		} else if (toolName === "check_minerals") {
			const inventory = Object.entries(this.inventory)
				.filter(([_, amount]) => amount > 0)
				.map(
					([mineral, amount]) =>
						`${mineral.replace("_", " ")}: ${amount}`
				)
				.join(", ");

			return inventory || "No minerals in inventory";
		} else if (toolName === "give_minerals") {
			const { mineral, quantity, target } = args;
			const mineralName = mineral.replace("_", " ");

			if (!agent.removeFromInventory(mineralName, quantity)) {
				return `Not enough ${mineralName} in inventory`;
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
						name: mineralName,
						quantity,
						metadata: {
							value: this.MINERALS[mineral].value,
						},
					});
				}
			}

			return `Successfully gave ${quantity} ${mineralName} to ${target}`;
		}
	}

	getPromptInstructions(): string {
		return `
To mine in the cave, use:
<action type="mine"></action>

To check your mineral inventory, use:
<action type="check_minerals"></action>

To give minerals to another agent, use:
<action type="give_minerals">
{
    mineral: "coal" | "iron" | "silver" | "gold" | "diamond" | "mysterious_crystal",
    quantity: number
    target: "name of the player or agent to give the minerals to"
}
</action>

You must be within 15 meters of the cave to mine.
Each mining attempt takes 30 seconds and has a chance to find various minerals.
You can only mine one spot at a time.`;
	}

	getState(): string {
		const minerals = Object.entries(this.inventory)
			.filter(([_, amount]) => amount > 0)
			.map(([mineral, amount]) => `${mineral}: ${amount}`)
			.join(", ");

		return this.isMining
			? "Currently mining"
			: `Not mining. Inventory: ${minerals || "empty"}`;
	}
}
