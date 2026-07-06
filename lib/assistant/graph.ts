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
import { validateReactCode } from "./react-validator";

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

function decisionLabel(route: string, component?: UIComponentName): string {
  switch (route) {
    case "renderUI":
      return `Building a ${component ?? "view"}`;
    case "makeArtifact":
      return "Composing a one-page summary";
    case "makeReactWidget":
      return "Generating an interactive widget";
    case "refuse":
      return "Out of scope — declining politely";
    default:
      return "Answering directly";
  }
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
        if (REFUSE_RE.test(state.query.toLowerCase())) {
          return { route: "refuse" };
        }
        return {};
      },
    )
    .addNode(
      "retrieve",
      async (state, config: LangGraphRunnableConfig) => {
        config.writer?.({ type: "reasoning", step: "Looking up sources" });
        const docs = retrieve(state.query);
        const context = docs.map((doc) => doc.text).join("\n\n");
        const labels = docs
          .map((d) => d.source)
          .slice(0, 8)
          .join(", ");
        config.writer?.({
          type: "reasoning",
          step: `Found ${docs.length} source${docs.length !== 1 ? "s" : ""}: ${labels}`.slice(
            0,
            280,
          ),
        });
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
          step: decisionLabel(decision.route, decision.component),
        });
        return { route: decision.route, component: decision.component };
      },
    )
    .addNode(
      "answer",
      async (state, config: LangGraphRunnableConfig) => {
        let streamed = "";
        for await (const part of brain.answerStream({
          query: state.query,
          context: state.context,
        })) {
          if (part.delta) {
            streamed += part.delta;
            config.writer?.({ type: "content", text: part.delta });
          }
        }
        if (!streamed) {
          config.writer?.({
            type: "content",
            text: await brain.answer({
              query: state.query,
              context: state.context,
            }),
          });
        }
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
    .addNode(
      "makeReactWidget",
      async (state, config: LangGraphRunnableConfig) => {
        try {
          const { code, data } = await brain.reactWidget({
            query: state.query,
            context: state.context,
          });
          const verdict = validateReactCode(code);
          if (!verdict.ok) throw new Error(verdict.reason ?? "invalid widget");
          config.writer?.({
            type: "react_artifact",
            id: "react-1",
            title: "Interactive view",
            code,
            data,
          });
          config.writer?.({
            type: "content",
            text: "Here's an interactive view — try clicking around inside it.",
          });
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
          case "makeReactWidget":
            return "makeReactWidget";
          case "refuse":
            return "refuse";
          default:
            return "answer";
        }
      },
      {
        renderUI: "renderUI",
        makeArtifact: "makeArtifact",
        makeReactWidget: "makeReactWidget",
        refuse: "refuse",
        answer: "answer",
      },
    )
    .addEdge("answer", END)
    .addEdge("renderUI", END)
    .addEdge("makeArtifact", END)
    .addEdge("makeReactWidget", END)
    .addEdge("refuse", END);

  return graph.compile();
}
