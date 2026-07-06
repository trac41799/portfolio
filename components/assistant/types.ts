import type { UIComponent } from "@/lib/assistant/contracts";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  status: "thinking" | "streaming" | "done";
  reasoning: string[];
  ui: UIComponent[];
  artifacts: { id: string; title: string; html: string }[];
  reactWidgets: { id: string; title: string; code: string; data?: unknown }[];
  followups: string[];
  error?: string;
}
