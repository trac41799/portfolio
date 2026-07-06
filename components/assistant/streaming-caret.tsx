export function StreamingCaret() {
  return (
    <span
      aria-hidden
      data-testid="streaming-caret"
      className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[2px] animate-caret bg-accent align-baseline"
    />
  );
}
