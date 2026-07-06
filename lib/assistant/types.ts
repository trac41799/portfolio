export type ChatRole = "user" | "assistant";

export interface Message {
  role: ChatRole;
  content: string;
}
