import type { UIComponent } from "@/lib/assistant/contracts";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  reasoning: string[];
  ui: UIComponent[];
  artifacts: { id: string; title: string; html: string }[];
  followups: string[];
  error?: string;
}
