import type { AssistantEvent } from "./events";
import type { Message } from "./types";
import { buildGraph } from "./graph";
import { getBrain, resolveProvider, type Provider } from "./provider";

export async function* runAssistant(input: {
  messages: Message[];
  provider?: Provider;
}): AsyncGenerator<AssistantEvent> {
  const provider = input.provider ?? resolveProvider(process.env);
  const brain = getBrain(provider);
  const graph = buildGraph(brain);

  const lastUser = [...input.messages]
    .reverse()
    .find((message) => message.role === "user");
  const query = lastUser?.content ?? "";

  try {
    const stream = await graph.stream(
      { query, context: "", route: "" },
      { streamMode: "custom" },
    );
    for await (const chunk of stream) {
      yield chunk as AssistantEvent;
    }
  } catch {
    yield { type: "error", message: "Sorry — something went wrong." };
  } finally {
    yield { type: "done" };
  }
}
