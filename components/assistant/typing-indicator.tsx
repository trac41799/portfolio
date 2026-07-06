export function TypingIndicator() {
  return (
    <div
      data-testid="typing-indicator"
      role="status"
      aria-label="Assistant is thinking"
      className="flex items-center gap-1.5 py-1"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-muted animate-typing [animation-delay:0ms]" />
      <span className="h-1.5 w-1.5 rounded-full bg-muted animate-typing [animation-delay:150ms]" />
      <span className="h-1.5 w-1.5 rounded-full bg-muted animate-typing [animation-delay:300ms]" />
    </div>
  );
}
