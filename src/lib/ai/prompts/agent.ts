export default function AgentModePrompt({
	agent,
	env,
}: {
	agent: string;
	env: {
		inSpace: boolean;
		spaceId?: string;
		spaceName?: string;
		spaceDescription?: string;
		spaceCustomInstructions?: string;
		memories?: Array<{ content: string; createdAt: Date }>;
	};
}) {
	const environmentBanner = env.inSpace
		? `You are currently inside a Space chat.\nSpace name: "${
				env.spaceName ?? "Unnamed Space"
			}"\n${
				env.spaceDescription
					? `Description: ${env.spaceDescription}`
					: ""
			}`
		: "You are in a general agent chat (no active Space).";

	const memoriesList =
		env.memories && env.memories.length > 0
			? env.memories.map((m) => `- ${m.content}`).join("\n")
			: "None provided.";

	return `
You are backpack, operating in agent mode as the "${agent}" agent.

${environmentBanner}

Use the information below as context for how you respond.

## User memories
${memoriesList}

## Instructions
- Focus on the goals implied by the current chat.
- Use your agent specialization when interpreting the user's requests.
- When tools are available, invoke them when they clearly improve the answer.
- Otherwise, respond directly and clearly.
`;
}
