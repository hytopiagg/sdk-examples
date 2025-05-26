# Hytopia Multi Agent Demo

This demo codebase provides an example for building multi Agent AI systems in Hytopia. The server has the following features:
- Multiple AI agents with unique pathfinding, behaviour and capabilities
- Chat bubbles for agent speech
- Side bar UI for viewing Agent actions

## Setup

### Environment Variables
This demo requires an OpenAI API key to function. Create a `.env` file in the ai-agents directory with the following variables:

```env
OPENAI_API_KEY=your_openai_api_key_here
```

You can copy the `.env.example` file and fill in your API key:
```bash
cd examples/ai-agents
cp .env.example .env
```

The OpenAI API key is used for agent inference - the agents use GPT-4o to make decisions and respond to interactions. Make sure your OpenAI account has access to GPT-4o API.

## How do Agents work in Hytopia?
Game Agents are driven by a combination of game-specific action logic, world state representation, and Large Language Models.

At a high level, to integrate agents into your game, you need to think about these three pieces.

### World State Representation
Your Agents need to know what is going on in the game. Where are they? What is around them? etc..
In this demo, the following data is available in the Agent's personal state:
- Their location
- Entities around them
- The status of any ongoing actions ("Behaviors")
- Items in their inventory

For more information on this, see the [`getCurrentState()`](src/BaseAgent.ts#L205) function in BaseAgent. Each behavior returns their Agent-specific state as a string, which we group together into an object and stringify it for the Agent's prompt.
States are prepended to each prompt to the agent.

### Actions
Actions are things that people and agents do in your game. In this simple demo, the things people do are simple: they go places, they say things, and some of them do profession-specific tasks like Fishing and Mining.

Going places means going to specific locations (by coordinates), or going to a person or thing (by name). This means Bob can go to Jim, without knowing where Jim is. Bob might also decide to go to the Pier, since Jim is a Fisherman and one would expect the town fisherman to be at the pier.

Saying things is simple, but the weeds of what that means is also game specific. In this demo, when agents speak, other agents can hear them in close proximity, but for the sake of the demo we also show their messages globally in chat. Speaking also spawns a chat bubble UI template. See the [`agent-chat template`](assets/ui/index.html#L178) for more info on this.

Actions also interact with LLMs. Since actions are called by the LLM, we need to show the LLM how to call them.
Some agent frameworks use tool calling/function calling, which is very popular with OpenAI.
You can do this if you want, but I prefer XML. XML takes less output tokens, is very natural for LLMs to write (billions of html pages parsed). Most importantly, valid XML can be easily regexed out of any text, intermingled with other thoughts from the LLM. Many benchmarks show creativity in language models decreasing as output format is increasingly restricted.

In this demo, an action can be called by an LLM simply by outputting text like this:
`<action type="speak">...</action>`

Another benefit of this approach is that models with very little infrastructure around their APIs can all output valid XML, so you can easily use whatever model or provider you want.

### Large Language Models
LLM's act as a router and brain for the agent, converting state representations and inputs into a sequence of actions.
LLM's need to be prompted. You will not get a spontaneous output without an input. In a game, this means you need to decide when Agent's make decisions. In this demo I show two common techniques:
- Response Triggers: when a Player speaks to an Agent, they will respond immediately. This lets players have some immediate control over influencing agent behaviours, and makes it easy to test your prompts with quick feedback. This is best for smaller player counts.
- Game Steps: as you can imagine, the above response triggers will not work at scale. Imagine 100 players in an area all talking to the same agent. You would not want it to respond outloud to everyone in the area. Instead, you can take a page out of the playbook of turn-based strategy games. Divide your game time into turns (a step could be every 5 seconds, 10 seconds, whatever you want), and each turn, you trigger each agent with the new state since their last turn. Players don't need to be limited by turns, but this makes your agents a bit simpler to manage. You can see an example of how this works in the idle detection of the agents in this repo. If an agent has not been triggered by a player in the last 30 seconds, they wake up and can decide what to do next.

## What's next?
We want to continue to make AI Agents accessible for developers of Hytopia games. This means more game-specific demos, more tooling, and a standardized Agent implementation that you can import as a plugin into your games. More on this soon :)