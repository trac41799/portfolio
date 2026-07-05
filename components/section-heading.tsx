type SectionHeadingProps = {
  index: string;
  title: string;
  className?: string;
};

export function SectionHeading({ index, title, className = "" }: SectionHeadingProps) {
  return (
    <div className={`flex items-baseline gap-4 ${className}`}>
      <span className="font-mono text-xs text-accent tabular-nums">{index}</span>
      <h2 className="font-mono text-xs uppercase tracking-[0.28em] text-muted">
        {title}
      </h2>
      <span className="h-px flex-1 translate-y-[-2px] bg-line" aria-hidden />
    </div>
  );
}
