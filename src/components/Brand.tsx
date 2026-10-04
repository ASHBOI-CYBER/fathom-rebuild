/** The mark: a chart sounding — a depth figure with a contour ring. */
export function BrandMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="16" r="14.5" fill="none" stroke="var(--ink)" strokeWidth="1.5" />
      <circle cx="16" cy="16" r="10" fill="none" stroke="var(--ink)" strokeWidth="1" strokeDasharray="2 2.5" />
      <text x="16" y="20.5" textAnchor="middle" fontFamily="var(--font-newsreader), Georgia, serif" fontStyle="italic" fontSize="13" fill="var(--magenta)">
        6
      </text>
    </svg>
  );
}

export function Wordmark() {
  return (
    <span className="flex items-center gap-2.5">
      <BrandMark />
      <span className="font-serif text-[22px] italic leading-none tracking-tight text-ink">Sounding</span>
    </span>
  );
}
