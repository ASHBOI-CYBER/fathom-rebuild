/** The mark: a chart sounding — a depth figure inside a contour ring. */
export function BrandMark({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="16" r="14.5" fill="none" stroke="var(--fg)" strokeOpacity="0.9" strokeWidth="1.5" />
      <circle cx="16" cy="16" r="10" fill="none" stroke="var(--fg)" strokeOpacity="0.45" strokeWidth="1" strokeDasharray="2 2.5" />
      <text x="16" y="20.5" textAnchor="middle" fontFamily="var(--font-newsreader), Georgia, serif" fontStyle="italic" fontSize="13" fill="var(--coral)">
        6
      </text>
    </svg>
  );
}

export function Wordmark() {
  return (
    <span className="flex items-center gap-2.5">
      <BrandMark />
      <span className="font-serif text-[22px] italic leading-none tracking-tight text-fg">Sounding</span>
    </span>
  );
}
