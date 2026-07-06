import {
  StateGraph,
  Annotation,
  START,
  END,
  type LangGraphRunnableConfig,
} from "@langchain/langgraph";
import { safeParseUIComponent, type UIComponentName } from "./contracts";
import type { Brain } from "./provider";
import { retrieve } from "./retriever";
import { sanitizeArtifact } from "./sanitize";

const REFUSE_RE =
  /weather|stock price|recipe|capital of|\b\d+\s*[+\-*/]\s*\d+\b|ignore (previous|above)|system prompt|tell me a joke/;

const AssistantState = Annotation.Root({
  query: Annotation<string>({ reducer: (_prev, next) => next, default: () => "" }),
  context: Annotation<string>({
    reducer: (_prev, next) => next,
    default: () => "",
  }),
  route: Annotation<string>({ reducer: (_prev, next) => next, default: () => "" }),
  component: Annotation<UIComponentName | undefined>({
    reducer: (_prev, next) => next,
    default: () => undefined,
  }),
});

function followupsFor(query: string): string[] {
  const q = query.toLowerCase();
  if (/publication|research|paper|ieee/.test(q)) {
    return [
      "What was his first-author IEEE paper about?",
      "What did he win the Best Paper Award for?",
    ];
  }
  if (/project|lms|travel|build|built|edge8/.test(q)) {
    return [
      "What was the hardest technical challenge in that work?",
      "How do his two biggest projects compare?",
    ];
  }
  if (/skill|stack|tool/.test(q)) {
    return [
      "Which parts of the stack has he shipped to production?",
      "What does he build from scratch versus with frameworks?",
    ];
  }
  if (/contact|email|hire|reach/.test(q)) {
    return [
      "What kind of role is he looking for?",
      "Can I see a one-page summary of his work?",
    ];
  }
  return [
    "What has Trac built at Edge8 AI?",
    "What is his strongest technical contribution?",
  ];
}

function introFor(component: UIComponentName): string {
  switch (component) {
    case "comparison":
      return "Here's a side-by-side comparison.";
    case "timeline":
      return "Here's his career timeline.";
    case "publicationList":
      return "Here are his publications.";
    case "skillMatrix":
      return "Here's his skill matrix.";
    case "metricGrid":
      return "Here are the headline numbers.";
    case "contactCard":
      return "Here's how to reach him.";
    case "projectCard":
      return "Here's a project snapshot.";
  }
}

export function buildGraph(brain: Brain) {
  const graph = new StateGraph(AssistantState)
    .addNode(
      "guard",
      async (state, config: LangGraphRunnableConfig) => {
        config.writer?.({
          type: "reasoning",
          step: "Understanding your question",
        });
        if (REFUSE_RE.test(state.query.toLowerCase())) {
          return { route: "refuse" };
        }
        return {};
      },
    )
    .addNode(
      "retrieve",
      async (state, config: LangGraphRunnableConfig) => {
        config.writer?.({
          type: "reasoning",
          step: "Reading Trac's background",
        });
        const context = retrieve(state.query)
          .map((doc) => doc.text)
          .join("\n\n");
        return { context };
      },
    )
    .addNode(
      "classify",
      async (state, config: LangGraphRunnableConfig) => {
        const decision = await brain.route({
          query: state.query,
          context: state.context,
        });
        config.writer?.({
          type: "reasoning",
          step: decision.route === "answer" ? "Answering" : "Preparing a response",
        });
        return { route: decision.route, component: decision.component };
      },
    )
    .addNode(
      "answer",
      async (state, config: LangGraphRunnableConfig) => {
        const text = await brain.answer({
          query: state.query,
          context: state.context,
        });
        config.writer?.({ type: "content", text });
        config.writer?.({
          type: "followups",
          questions: followupsFor(state.query),
        });
        return {};
      },
    )
    .addNode(
      "renderUI",
      async (state, config: LangGraphRunnableConfig) => {
        try {
          const component = state.component;
          if (!component) throw new Error("no component selected");
          const props = await brain.props({
            query: state.query,
            context: state.context,
            component,
          });
          const parsed = safeParseUIComponent({ component, props });
          if (!parsed) throw new Error("invalid UI component");
          config.writer?.({
            type: "reasoning",
            step: `Building a ${component}`,
          });
          config.writer?.({ type: "ui", component: parsed });
          config.writer?.({ type: "content", text: introFor(component) });
          config.writer?.({
            type: "followups",
            questions: followupsFor(state.query),
          });
        } catch {
          const text = await brain.answer({
            query: state.query,
            context: state.context,
          });
          config.writer?.({ type: "content", text });
          config.writer?.({
            type: "followups",
            questions: followupsFor(state.query),
          });
        }
        return {};
      },
    )
    .addNode(
      "makeArtifact",
      async (state, config: LangGraphRunnableConfig) => {
        const raw = await brain.artifactHtml({
          query: state.query,
          context: state.context,
        });
        const html = sanitizeArtifact(raw);
        config.writer?.({ type: "reasoning", step: "Designing an artifact" });
        config.writer?.({
          type: "artifact",
          id: "art-1",
          title: "Summary",
          html,
        });
        config.writer?.({
          type: "content",
          text: "Here's a one-page summary you can skim or share.",
        });
        config.writer?.({
          type: "followups",
          questions: followupsFor(state.query),
        });
        return {};
      },
    )
    .addNode(
      "refuse",
      async (_state, config: LangGraphRunnableConfig) => {
        config.writer?.({
          type: "content",
          text: "I can only answer questions about Nguyen Dang Trac's background, experience, projects, and skills. Ask me about his work at Edge8 AI, his research, or how to get in touch.",
        });
        return {};
      },
    )
    .addEdge(START, "guard")
    .addConditionalEdges(
      "guard",
      (state) => (state.route === "refuse" ? "refuse" : "retrieve"),
      { refuse: "refuse", retrieve: "retrieve" },
    )
    .addEdge("retrieve", "classify")
    .addConditionalEdges(
      "classify",
      (state) => {
        switch (state.route) {
          case "renderUI":
            return "renderUI";
          case "makeArtifact":
            return "makeArtifact";
          case "refuse":
            return "refuse";
          default:
            return "answer";
        }
      },
      {
        renderUI: "renderUI",
        makeArtifact: "makeArtifact",
        refuse: "refuse",
        answer: "answer",
      },
    )
    .addEdge("answer", END)
    .addEdge("renderUI", END)
    .addEdge("makeArtifact", END)
    .addEdge("refuse", END);

  return graph.compile();
}
