'use client';

export function RecordToggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className="flex items-center gap-2 self-start text-[13px] text-ink-soft"
    >
      <span className={`relative inline-flex h-[18px] w-8 shrink-0 rounded-full transition-colors ${on ? 'bg-magenta' : 'bg-rule'}`}>
        <span className={`absolute top-[2px] h-[14px] w-[14px] rounded-full bg-white shadow transition-transform ${on ? 'translate-x-[16px]' : 'translate-x-[2px]'}`} />
      </span>
      {on ? 'Sounding will record' : 'Not recording'}
    </button>
  );
}
