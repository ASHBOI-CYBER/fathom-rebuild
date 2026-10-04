/** The mark: a sounding. A lead line drops through two depth contours to a sodium weight. */
export function BrandMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="16" r="14.5" fill="none" stroke="var(--fg)" strokeOpacity="0.85" strokeWidth="1.4" />
      <circle cx="16" cy="16" r="9.5" fill="none" stroke="var(--fg)" strokeOpacity="0.4" strokeWidth="1" strokeDasharray="1.6 2.4" />
      <path d="M16 1.5 V17.5" stroke="var(--fg)" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M16 17 L19 21.5 L16 24.5 L13 21.5 Z" fill="var(--signal)" />
    </svg>
  );
}

export function Wordmark() {
  return (
    <span className="flex items-center gap-2.5">
      <BrandMark />
      <span className="font-stencil text-[21px] font-extrabold uppercase leading-none tracking-[0.08em] text-fg">Sounding</span>
    </span>
  );
}
