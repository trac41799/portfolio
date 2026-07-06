export function ArtifactSandbox({
  html,
  title,
}: {
  html: string;
  title?: string;
}) {
  if (!html) {
    return (
      <div
        data-testid="artifact-skeleton"
        aria-hidden
        className="h-40 w-full animate-pulse rounded-lg border border-line bg-surface motion-reduce:animate-none"
      />
    );
  }
  return (
    <iframe
      data-testid="artifact-frame"
      title={title ?? "artifact"}
      srcDoc={html}
      sandbox="allow-popups"
      className="h-96 w-full rounded-lg border border-line bg-white"
    />
  );
}
