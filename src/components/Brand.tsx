/** The mark: a depth sounding. Two contour rings and a stencilled figure. */
export function BrandMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="16" r="14.5" fill="none" stroke="var(--fg)" strokeOpacity="0.85" strokeWidth="1.4" />
      <circle cx="16" cy="16" r="10" fill="none" stroke="var(--fg)" strokeOpacity="0.4" strokeWidth="1" strokeDasharray="1.6 2.4" />
      <path d="M16 1.5 L16 7" stroke="var(--signal)" strokeWidth="1.6" strokeLinecap="round" />
      <text x="16" y="20.6" textAnchor="middle" fontFamily="var(--font-stencil), sans-serif" fontWeight="800" fontSize="12.5" fill="var(--signal)">
        6
      </text>
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
