import { World, Player } from "hytopia";
import type { AgentBehavior, BaseAgent } from "../BaseAgent";

/**
 * Very simple implementation of speak behavior for Agents.
 * You can imagine how this could be extended to include more complex behaviors like Text-to-Speech.
 * It has no state, and no callbacks.
 */
export class SpeakBehavior implements AgentBehavior {
	onUpdate(agent: BaseAgent, world: World): void {}

	getPromptInstructions(): string {
		return `
To speak out loud, use:
<action type="speak">
{
	"message": "What to say"
}
</action>`;
	}

	getState(): string {
		return "";
	}

	onToolCall(
		agent: BaseAgent,
		world: World,
		toolName: string,
		args: { message: string }
	): string | void {
		if (toolName === "speak") {
			agent.setChatUIState({ message: args.message });

			if (world) {
				world.chatManager.sendBroadcastMessage(
					`[${agent.name}]: ${args.message}`,
					"FF69B4"
				);
			}

			// Clear message after delay
			setTimeout(() => {
				agent.setChatUIState({ message: "" });
			}, 5300);

			return "You said: " + args.message;
		}
	}
}
