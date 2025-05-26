import { World } from "hytopia";
import { BaseAgent, type AgentBehavior } from "../BaseAgent";

interface TradeRequest {
	from: BaseAgent;
	to: BaseAgent;
	offerItems: { name: string; quantity: number }[];
	requestItems: { name: string; quantity: number }[];
	timestamp: number;
}
/**
 * Simple implementation of trade behavior for Agents.
 * This is a simple example of how behaviours can have state, in this case, a map of active trade requests.
 * It also demonstrates how Behaviors can manage agent state like the inventory.
 */
export class TradeBehavior implements AgentBehavior {
	private activeRequests: Map<string, TradeRequest> = new Map();

	onUpdate(agent: BaseAgent, world: World): void {}

	private generateTradeId(from: BaseAgent, to: BaseAgent): string {
		return `${from.name}_${to.name}_${Date.now()}`;
	}

	onToolCall(
		agent: BaseAgent,
		world: World,
		toolName: string,
		args: any
	): string | void {
		if (toolName === "request_trade") {
			const { target, offer, request } = args;

			// Find target agent
			const nearbyEntities = agent.getNearbyEntities(5);
			const targetEntity = nearbyEntities.find((e) => e.name === target);

			if (!targetEntity || targetEntity.type !== "Agent") {
				return `Cannot find ${target} nearby to trade with.`;
			}

			const targetAgent = world.entityManager
				.getAllEntities()
				.find(
					(e) => e instanceof BaseAgent && e.name === target
				) as BaseAgent;

			if (!targetAgent) return "Target agent not found";

			// Verify agent has the items they're offering
			for (const item of offer) {
				if (!agent.removeFromInventory(item.name, item.quantity)) {
					return `You don't have enough ${item.name} to offer.`;
				}
				// Return items since this is just a check
				agent.addToInventory({
					name: item.name,
					quantity: item.quantity,
				});
			}

			const tradeId = this.generateTradeId(agent, targetAgent);
			const tradeRequest = {
				from: agent,
				to: targetAgent,
				offerItems: offer,
				requestItems: request,
				timestamp: Date.now(),
			};

			// Set trade request in both agents' trade behaviors
			this.activeRequests.set(tradeId, tradeRequest);
			const targetTradeBehavior = targetAgent
				.getBehaviors()
				.find((b) => b instanceof TradeBehavior) as TradeBehavior;
			if (targetTradeBehavior) {
				targetTradeBehavior.activeRequests.set(tradeId, tradeRequest);
			}

			targetAgent.handleEnvironmentTrigger(
				`${agent.name} wants to trade!\n` +
					`Offering: ${offer
						.map(
							(i: { quantity: number; name: string }) =>
								`${i.quantity}x ${i.name}`
						)
						.join(", ")}\n` +
					`Requesting: ${request
						.map(
							(i: { quantity: number; name: string }) =>
								`${i.quantity}x ${i.name}`
						)
						.join(", ")}\n` +
					`Use accept_trade or decline_trade with tradeId: ${tradeId}`
			);

			return "Trade request sent!";
		} else if (toolName === "accept_trade") {
			const { tradeId } = args;
			const request = this.activeRequests.get(tradeId);
			console.log(`${agent.name} attempting to accept trade ${tradeId}`);

			if (!request) {
				console.log(`Trade ${tradeId} not found or expired`);
				return "Trade request not found or expired.";
			}

			if (request.to !== agent) {
				console.log(
					`${agent.name} tried to accept trade meant for ${request.to.name}`
				);
				return "This trade request was not sent to you.";
			}

			// Verify receiving agent has requested items
			for (const item of request.requestItems) {
				if (!agent.removeFromInventory(item.name, item.quantity)) {
					console.log(
						`${agent.name} lacks required item: ${item.quantity}x ${item.name}`
					);
					return `You don't have enough ${item.name} to complete the trade.`;
				}

				// Return items since this is just a check
				agent.addToInventory({
					name: item.name,
					quantity: item.quantity,
				});
			}

			console.log(
				`Executing trade between ${request.from.name} and ${request.to.name}`
			);
			console.log(
				`${request.from.name} offers: ${JSON.stringify(
					request.offerItems
				)}`
			);
			console.log(
				`${request.to.name} offers: ${JSON.stringify(
					request.requestItems
				)}`
			);

			// Execute the trade
			// Remove items from both agents
			for (const item of request.offerItems) {
				request.from.removeFromInventory(item.name, item.quantity);
			}
			for (const item of request.requestItems) {
				request.to.removeFromInventory(item.name, item.quantity);
			}

			// Add items to both agents
			for (const item of request.offerItems) {
				request.to.addToInventory({
					name: item.name,
					quantity: item.quantity,
				});
			}
			for (const item of request.requestItems) {
				request.from.addToInventory({
					name: item.name,
					quantity: item.quantity,
				});
			}

			// Clear trade request from both agents' trade behaviors
			this.activeRequests.delete(tradeId);
			const fromTradeBehavior = request.from
				.getBehaviors()
				.find((b) => b instanceof TradeBehavior) as TradeBehavior;
			if (fromTradeBehavior) {
				fromTradeBehavior.activeRequests.delete(tradeId);
			}

			console.log(`Trade ${tradeId} completed successfully`);

			// Notify both agents
			request.from.handleEnvironmentTrigger(
				`${agent.name} accepted your trade!`
			);
			request.to.handleEnvironmentTrigger(
				`You accepted the trade with ${agent.name}!`
			);
			return "Trade completed successfully!";
		} else if (toolName === "decline_trade") {
			const { tradeId } = args;
			const request = this.activeRequests.get(tradeId);

			if (!request) {
				console.log("Trade request not found or expired.");
				return "Trade request not found or expired.";
			}

			if (request.to !== agent) {
				console.log("This trade request was not sent to you.");
				return "This trade request was not sent to you.";
			}

			// Clear trade request from both agents' trade behaviors
			this.activeRequests.delete(tradeId);
			const fromTradeBehavior = request.from
				.getBehaviors()
				.find((b) => b instanceof TradeBehavior) as TradeBehavior;
			if (fromTradeBehavior) {
				fromTradeBehavior.activeRequests.delete(tradeId);
			}

			request.from.handleEnvironmentTrigger(
				`${agent.name} declined your trade.`
			);
			console.log("Trade declined.");
			return "Trade declined.";
		}
	}

	getPromptInstructions(): string {
		return `
To request a trade with another agent:
<action type="request_trade">
{
	"target": "name of agent to trade with",
	"offer": [{ "name": "item name", "quantity": number }],
	"request": [{ "name": "item name", "quantity": number }]
}
</action>

To accept a trade request:
<action type="accept_trade">
{
	"tradeId": "trade_id_from_request"
}
</action>

To decline a trade request:
<action type="decline_trade">
{
	"tradeId": "trade_id_from_request"
}
</action>

Trading requires both agents to be within 5 meters of each other.
Both agents must have the required items in their inventory.

If someone verbally offers a trade, but you don't get the official request from the Environment, you should ask them to request the trade so you can accept it.

If you request to trade with an agent, they will need to accept the trade request.`;
	}

	getState(): string {
		return `Active trade requests: ${JSON.stringify(this.activeRequests)}`;
	}
}
